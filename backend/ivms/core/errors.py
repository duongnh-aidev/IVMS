"""Domain errors and their mapping to RFC 9457 `application/problem+json` responses.

Controllers and models raise `AppError` subclasses; they never build HTTP responses themselves.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

PROBLEM_JSON = "application/problem+json"


class AppError(Exception):
    status = 500
    title = "Internal error"

    def __init__(self, detail: str | None = None):
        super().__init__(detail or self.title)
        self.detail = detail


class NotFound(AppError):
    status = 404
    title = "Not found"


class Unauthorized(AppError):
    """Missing, invalid or expired credentials: the client must sign in (again)."""

    status = 401
    title = "Unauthorized"


class Conflict(AppError):
    status = 409
    title = "Conflict"


class Invalid(AppError):
    """The request is well-formed but refers to something that does not fit (e.g. unknown group)."""

    status = 422
    title = "Invalid request"


class UpstreamError(AppError):
    """A dependency we call (MediaMTX, a camera) failed or is unreachable."""

    status = 502
    title = "Upstream service error"


def _problem(status: int, title: str, detail: str | None = None, headers: dict | None = None, **extra) -> JSONResponse:
    body = {"type": "about:blank", "title": title, "status": status}
    if detail:
        body["detail"] = detail
    return JSONResponse(body | extra, status_code=status, media_type=PROBLEM_JSON, headers=headers)


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        # RFC 6750: tell the client which scheme to authenticate with
        headers = {"WWW-Authenticate": "Bearer"} if exc.status == 401 else None
        return _problem(exc.status, exc.title, exc.detail, headers)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        errors = [
            # Drop the leading "body" / "query" segment: the client only cares about the field
            {"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return _problem(422, "Validation failed", errors=errors)

    @app.exception_handler(HTTPException)
    async def _http_error(_: Request, exc: HTTPException):
        return _problem(exc.status_code, str(exc.detail), headers=getattr(exc, "headers", None))
