"""Client for the MediaMTX Control API (v3): registers each camera as a relay path."""

import httpx

from ivms.core.errors import UpstreamError


class MediaMTX:
    def __init__(self, client: httpx.AsyncClient):
        # `client` has base_url = MEDIAMTX_API_URL
        self._client = client

    async def publish(self, path: str, source: str) -> None:
        """Creates path `path` pulling from `source`, or replaces its config if it exists."""
        conf = {"source": source, "sourceOnDemand": False}
        r = await self._request("POST", f"/v3/config/paths/replace/{path}", json=conf)
        if r.status_code == 404:
            r = await self._request("POST", f"/v3/config/paths/add/{path}", json=conf)
        self._check(r)

    async def unpublish(self, path: str) -> None:
        r = await self._request("DELETE", f"/v3/config/paths/delete/{path}")
        if r.status_code != 404:  # already gone is fine
            self._check(r)

    async def _request(self, method: str, url: str, **kwargs) -> httpx.Response:
        try:
            return await self._client.request(method, url, **kwargs)
        except httpx.HTTPError as e:
            raise UpstreamError(f"MediaMTX is unreachable: {e}") from e

    @staticmethod
    def _check(r: httpx.Response) -> None:
        if r.is_error:
            raise UpstreamError(f"MediaMTX rejected the request ({r.status_code}): {r.text.strip()}")
