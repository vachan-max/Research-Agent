"""LangGraph node implementations for the research workflow."""

from __future__ import annotations

from langchain_groq import ChatGroq
from langgraph.types import interrupt

from research_agent.config import load_settings
from research_agent.state import AgentState
from research_agent.tools import google_search_tool, scrape_page_tool

_settings = load_settings()
llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0, api_key=_settings.groq_api_key)


def search_web_node(state: AgentState) -> dict[str, object]:
    """Search the web for the state's query."""
    results = google_search_tool.invoke({"query": state["query"]})
    return {"search_results": results}


def review_sources_node(state: AgentState) -> dict[str, object]:
    """Pause for human approval of the sources to scrape."""
    approved = interrupt(
        {
            "kind": "source_review",
            "query": state["query"],
            "search_results": state["search_results"],
        }
    )
    if not isinstance(approved, list) or not all(
        isinstance(source, dict) and isinstance(source.get("link"), str)
        for source in approved
    ):
        raise ValueError("Source review must resume with a list of source objects containing links.")
    return {"selected_sources": approved}


def scrape_links_node(state: AgentState) -> dict[str, object]:
    """Scrape the user-approved URLs into Markdown content."""
    content: list[str] = []
    for result in state["selected_sources"]:
        url = result.get("link", "")
        if url:
            try:
                content.append(scrape_page_tool.invoke({"url": url}))
            except Exception as exc:
                content.append(f"[Scrape failed for {url}: {exc}]")
    return {"scraped_content": content}


def generate_report_node(state: AgentState) -> dict[str, object]:
    """Synthesize scraped source material into a Markdown research report."""
    sources = "\n\n---\n\n".join(state["scraped_content"])
    prompt = (
        "Write a clear, evidence-based Markdown research report answering the query. "
        "Organize it with a title, concise summary, key findings, and a conclusion. "
        "Distinguish supported facts from uncertainty and do not invent citations.\n\n"
        f"Query: {state['query']}\n\nSource material:\n{sources or '(No content was successfully scraped.)'}"
    )
    response = llm.invoke(prompt)
    return {"final_report": str(response.content)}
