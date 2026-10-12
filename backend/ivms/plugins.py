"""Plugins: separately installed packages that add features to IVMS (docs/plugins.md).

A plugin is a `Plugin` object published under the `ivms.plugins` entry point group:

    # pyproject.toml of the plugin package
    [project.entry-points."ivms.plugins"]
    acme = "acme_ivms:plugin"

Plugins only add: new routes, permissions and features. They never replace what the core (or another
plugin) already provides; `create_app` refuses to start when they try. `features` is called on every
check, so a plugin can turn features on and off at runtime (e.g. when a licence is entered).

This module and the names it re-exports are the API plugins may rely on. `PLUGIN_API_VERSION` goes up
when it changes in a way that breaks plugins.
"""

import logging
from collections.abc import Callable, Iterable, Sequence
from contextlib import AbstractAsyncContextManager
from dataclasses import dataclass, field
from importlib.metadata import entry_points
from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, Request

from ivms.core.errors import Forbidden

PLUGIN_API_VERSION = 1
ENTRY_POINT_GROUP = "ivms.plugins"
COMMUNITY = "Community"

log = logging.getLogger("ivms.plugins")


class PluginError(Exception):
    """A plugin breaks the rules (duplicate name, permission or route). The app does not start."""


@dataclass(frozen=True)
class Plugin:
    name: str
    api_version: int
    # Mounted under /api/v1, after the core routers
    routers: Sequence[APIRouter] = ()
    # New permission keys its routes declare with `require(...)`
    permissions: Sequence[str] = ()
    # Opened after the core resources (app.state.pool, ...) and closed before them
    lifespan: Callable[[FastAPI], AbstractAsyncContextManager[None]] | None = None
    # Feature keys enabled right now; routes guard themselves with `require_feature(key)`
    features: Callable[[], Iterable[str]] = field(default=lambda: ())
    # Edition shown while at least one of its features is enabled (otherwise the app stays Community)
    edition: str | None = None


class Plugins:
    """The plugins loaded into an app (`app.state.plugins`)."""

    def __init__(self, plugins: Sequence[Plugin] = ()):
        self.items = list(plugins)

    def features(self) -> set[str]:
        return {key for plugin in self.items for key in _features_of(plugin)}

    def enabled(self, feature: str) -> bool:
        return any(feature in _features_of(plugin) for plugin in self.items)

    def edition(self) -> str:
        return next((p.edition for p in self.items if p.edition and _features_of(p)), COMMUNITY)


def _features_of(plugin: Plugin) -> set[str]:
    """A failing check (e.g. a broken licence file) disables the plugin's features instead of the whole API."""
    try:
        return set(plugin.features())
    except Exception:
        log.exception("Plugin %s failed to report its features, treating them as disabled", plugin.name)
        return set()


def discover() -> list[Plugin]:
    """The installed plugins this core can run. Broken or incompatible ones are logged and skipped."""
    found = []
    for ep in entry_points(group=ENTRY_POINT_GROUP):
        try:
            plugin = ep.load()
        except Exception:
            log.exception("Plugin %s failed to load, skipping it", ep.name)
            continue
        if not isinstance(plugin, Plugin):
            log.error("Entry point %s is not an ivms.plugins.Plugin, skipping it", ep.value)
        elif plugin.api_version != PLUGIN_API_VERSION:
            log.error("Plugin %s targets plugin API %s, this IVMS provides %s; skipping it", plugin.name,
                      plugin.api_version, PLUGIN_API_VERSION)
        else:
            found.append(plugin)
    return found


def check_unique(plugins: Sequence[Plugin], core_permissions: Iterable[str]) -> None:
    """Raises PluginError when two plugins share a name or a permission clashes."""
    names, permissions = set(), set(core_permissions)
    for plugin in plugins:
        if plugin.name in names:
            raise PluginError(f'Two plugins are named "{plugin.name}"')
        names.add(plugin.name)
        for key in plugin.permissions:
            if key in permissions:
                raise PluginError(f'Plugin {plugin.name} redefines permission "{key}"')
            permissions.add(key)


def require_feature(feature: str):
    """Route dependency: 403 unless a plugin has `feature` enabled right now."""

    async def _check(request: Request) -> None:
        if not request.app.state.plugins.enabled(feature):
            raise Forbidden(f"This feature is not enabled: {feature}")

    return Depends(_check)


def get_plugins(request: Request) -> Plugins:
    return request.app.state.plugins


LoadedPlugins = Annotated[Plugins, Depends(get_plugins)]
