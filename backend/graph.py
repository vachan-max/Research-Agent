"""Compiled LangGraph workflow for Phase 1 research."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.memory import MemorySaver

from backend.nodes import (
    generate_report_node,
    review_sources_node,
    scrape_links_node,
    search_web_node,
)
from backend.state import AgentState

builder = StateGraph(AgentState)
builder.add_node("search_web_node", search_web_node)
builder.add_node("review_sources_node", review_sources_node)
builder.add_node("scrape_links_node", scrape_links_node)
builder.add_node("generate_report_node", generate_report_node)
builder.add_edge(START, "search_web_node")
builder.add_edge("search_web_node", "review_sources_node")
builder.add_edge("review_sources_node", "scrape_links_node")
builder.add_edge("scrape_links_node", "generate_report_node")
builder.add_edge("generate_report_node", END)

agent_app = builder.compile(checkpointer=MemorySaver())
