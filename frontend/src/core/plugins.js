/**
 * Frontend plugins (docs/plugins.md, "Frontend"): modules a plugin adds to the app at build time.
 *
 * A plugin is a plain object:
 *
 *   export default {
 *     name: 'acme',
 *     screens: {
 *       // build(services) returns a React component, like the core modules' `View`
 *       detections: { label: 'Detections', icon: 'M…', group: 'main', requires: 'acme.detections', build },
 *     },
 *     slots: {
 *       'settings.sections': [{ key: 'licence', label: 'Licence', build }],
 *     },
 *   };
 *
 * Plugins only add: a screen key or slot key the core (or another plugin) already uses is an error, so
 * the core screens never change. `requires` is a feature key from GET /system/info; without it the item
 * shows whenever the plugin is installed.
 */

/** Sidebar groups a plugin screen can join (appended after the core items of that group). */
export const SCREEN_GROUPS = ['main', 'setup', 'bottom'];

/** Places where the core shows plugin items, with the keys the core itself uses there. */
export const SLOTS = {
  'settings.sections': ['general', 'account', 'notifications', 'server', 'about'],
};

export class PluginError extends Error {}

/**
 * Checks the plugins and flattens what they add. Throws PluginError when one breaks the rules.
 * @param coreScreens  screen keys of the core (the shell's SCREENS)
 * @returns {{ screens: object[], slots: Record<string, object[]> }} items tagged with their `plugin`
 */
export function createPluginRegistry(plugins, coreScreens) {
  const names = new Set();
  const screenKeys = new Set(coreScreens);
  const screens = [];
  const slots = Object.fromEntries(Object.keys(SLOTS).map((slot) => [slot, []]));
  const slotKeys = Object.fromEntries(Object.entries(SLOTS).map(([slot, keys]) => [slot, new Set(keys)]));

  for (const plugin of plugins) {
    if (!plugin?.name) throw new PluginError('A frontend plugin has no name');
    if (names.has(plugin.name)) throw new PluginError(`Two frontend plugins are named "${plugin.name}"`);
    names.add(plugin.name);

    for (const [key, screen] of Object.entries(plugin.screens || {})) {
      if (screenKeys.has(key)) throw new PluginError(`Plugin ${plugin.name} redefines screen "${key}"`);
      if (!SCREEN_GROUPS.includes(screen.group)) {
        throw new PluginError(`Plugin ${plugin.name}: screen "${key}" has unknown group "${screen.group}"`);
      }
      if (typeof screen.build !== 'function')
        throw new PluginError(`Plugin ${plugin.name}: screen "${key}" has no build`);
      screenKeys.add(key);
      screens.push({ ...screen, key, plugin: plugin.name });
    }

    for (const [slot, items] of Object.entries(plugin.slots || {})) {
      if (!slots[slot]) throw new PluginError(`Plugin ${plugin.name} uses unknown slot "${slot}"`);
      for (const item of items) {
        if (slotKeys[slot].has(item.key)) {
          throw new PluginError(`Plugin ${plugin.name} redefines "${item.key}" in slot "${slot}"`);
        }
        if (typeof item.build !== 'function') {
          throw new PluginError(`Plugin ${plugin.name}: "${item.key}" in slot "${slot}" has no build`);
        }
        slotKeys[slot].add(item.key);
        slots[slot].push({ ...item, plugin: plugin.name });
      }
    }
  }
  return { screens, slots };
}

/** Whether a plugin item shows with these enabled features (a Set). */
export const isAvailable = (item, features) => !item.requires || features.has(item.requires);
