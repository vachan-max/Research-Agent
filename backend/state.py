"""Shared state schema for the research workflow."""

from __future__ import annotations

from typing import TypedDict


class AgentState(TypedDict):
    """State passed between the research graph nodes."""

    query: str
    search_results: list[dict[str, str]]
    selected_sources: list[dict[str, str]]
    scraped_content: list[str]
    final_report: str
