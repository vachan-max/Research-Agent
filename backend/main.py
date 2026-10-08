"""Launch the research agent FastAPI development server."""

from __future__ import annotations

import uvicorn


def main() -> None:
    """Start the API server with automatic reload for local development."""
    uvicorn.run(
        "backend.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1,
    )


if __name__ == "__main__":
    main()
