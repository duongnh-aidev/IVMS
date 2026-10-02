"""`python -m ivms`: run the API server (auto-reload in development)."""

import uvicorn

from ivms.core.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "ivms.app:create_app",
        factory=True,
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        reload_dirs=["backend"],
    )


if __name__ == "__main__":
    main()
