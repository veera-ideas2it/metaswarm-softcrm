from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import settings

# ---------------------------------------------------------------------------
# Rate limiter (shared instance – imported by routers that need per-route limits)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: nothing to do in prod (Alembic handles migrations)
    yield
    # Shutdown: dispose DB engine
    from app.database import async_engine
    await async_engine.dispose()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
def create_app() -> FastAPI:
    application = FastAPI(
        title="SoftCRM API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Rate limiter
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
    application.add_middleware(SlowAPIMiddleware)

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---------------------------------------------------------------------------
    # Exception handlers – return consistent Response envelope
    # ---------------------------------------------------------------------------
    @application.exception_handler(404)
    async def not_found_handler(request: Request, exc: Any) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"data": None, "error": "Resource not found", "meta": None},
        )

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Flatten pydantic v2 error messages into a single string
        messages = "; ".join(
            f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}"
            for err in exc.errors()
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"data": None, "error": messages, "meta": None},
        )

    @application.exception_handler(500)
    async def internal_error_handler(request: Request, exc: Any) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"data": None, "error": "Internal server error", "meta": None},
        )

    # ---------------------------------------------------------------------------
    # Routers – register as they are created
    # ---------------------------------------------------------------------------
    from app.routers import auth  # noqa: PLC0415
    from app.routers import reports  # noqa: PLC0415
    from app.routers import deals  # noqa: PLC0415
    from app.routers import activities  # noqa: PLC0415
    from app.routers import contacts  # noqa: PLC0415
    from app.routers import companies  # noqa: PLC0415
    from app.routers import settings  # noqa: PLC0415

    application.include_router(auth.router, prefix="/api/v1/auth")
    application.include_router(reports.router, prefix="/api/v1/reports")
    application.include_router(deals.router, prefix="/api/v1")
    application.include_router(activities.router, prefix="/api/v1")
    application.include_router(contacts.router, prefix="/api/v1")
    application.include_router(companies.router, prefix="/api/v1")
    application.include_router(settings.router, prefix="/api/v1")
    # from app.routers import users
    # application.include_router(users.router, prefix="/api/v1")

    # Health-check (no auth, no rate-limit)
    @application.get("/health", tags=["ops"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
