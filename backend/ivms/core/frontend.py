"""Serves the built frontend (single-page app) from the API server, for packaged builds."""

from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles


class SinglePageApp(StaticFiles):
    """Static files; unknown paths get index.html so client-side routes load the app."""

    def __init__(self, directory, api_prefix: str):
        super().__init__(directory=directory, html=True)
        self.api_prefix = api_prefix.strip("/") + "/"

    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except HTTPException as e:
            # An unknown API route stays a 404, it must not turn into the app's HTML
            if e.status_code != 404 or path.startswith(self.api_prefix):
                raise
            return await super().get_response("index.html", scope)
