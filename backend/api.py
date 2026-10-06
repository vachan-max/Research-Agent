"""FastAPI and SSE interface for the research agent."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langgraph.types import Command
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from research_agent.graph import agent_app


class ResearchRequest(BaseModel):
    """Request body for starting a research run."""

    query: str = Field(min_length=1, description="Question to research.")


class SourceReviewRequest(BaseModel):
    """Human-approved sources used to resume a paused research run."""

    sources: list[dict[str, str]]


app = FastAPI(title="Research Agent API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_pending_reviews: dict[str, asyncio.Future[list[dict[str, str]]]] = {}


@app.get("/health")
async def health() -> dict[str, str]:
    """Return service health status."""
    return {"status": "ok"}


@app.post("/api/research/{run_id}/sources")
async def approve_sources(run_id: str, request: SourceReviewRequest) -> dict[str, str]:
    """Submit source approval for an active SSE research run."""
    future = _pending_reviews.get(run_id)
    if future is None or future.done():
        raise HTTPException(status_code=404, detail="No active source review for this run.")
    future.set_result(request.sources)
    return {"status": "accepted", "run_id": run_id}


@app.post("/api/research/stream")
async def stream_research(request: ResearchRequest) -> EventSourceResponse:
    """Stream graph progress and pause for human source approval."""
    run_id = str(uuid4())

    async def event_generator() -> AsyncIterator[dict[str, str]]:
        config = {"configurable": {"thread_id": run_id}}
        review_future: asyncio.Future[list[dict[str, str]]] | None = None
        try:
            async for update in agent_app.astream(
                {"query": request.query}, config=config, stream_mode="updates"
            ):
                interrupt_events = update.get("__interrupt__", ())
                if interrupt_events:
                    interrupt_value: dict[str, Any] = interrupt_events[0].value
                    review_future = asyncio.get_running_loop().create_future()
                    _pending_reviews[run_id] = review_future
                    yield {
                        "event": "source_review",
                        "data": json.dumps(
                            {
                                "run_id": run_id,
                                "query": interrupt_value.get("query", request.query),
                                "search_results": interrupt_value.get("search_results", []),
                            }
                        ),
                    }
                    selected_sources = await review_future
                    _pending_reviews.pop(run_id, None)

                    async for resumed in agent_app.astream(
                        Command(resume=selected_sources),
                        config=config,
                        stream_mode="updates",
                    ):
                        for node_name, node_state in resumed.items():
                            if node_name != "__interrupt__":
                                yield {
                                    "event": "node_complete",
                                    "data": json.dumps(
                                        {"node": node_name, "state": node_state},
                                        default=str,
                                    ),
                                }
                    break

                for node_name, node_state in update.items():
                    yield {
                        "event": "node_complete",
                        "data": json.dumps(
                            {"node": node_name, "state": node_state}, default=str
                        ),
                    }
            yield {"event": "done", "data": json.dumps({"run_id": run_id})}
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            yield {
                "event": "error",
                "data": json.dumps({"message": str(exc), "run_id": run_id}),
            }
        finally:
            _pending_reviews.pop(run_id, None)
            if review_future is not None and not review_future.done():
                review_future.cancel()

    return EventSourceResponse(event_generator())
