"""External search and web scraping tools."""

from __future__ import annotations

from typing import Any

from firecrawl import FirecrawlApp
from langchain_core.tools import tool

from research_agent.config import load_settings


@tool
def google_search_tool(query: str) -> list[dict[str, str]]:
    """Search Google through SerpApi and return the five best organic results."""
    if not query.strip():
        raise ValueError("Search query must not be empty.")
    settings = load_settings()
    from serpapi import Client

    client = Client(api_key=settings.serpapi_api_key)
    response: dict[str, Any] = client.search({"engine": "google", "q": query})
    organic = response.get("organic_results", [])
    return [
        {
            "title": str(result.get("title", "")),
            "link": str(result.get("link", "")),
            "snippet": str(result.get("snippet", "")),
        }
        for result in organic[:5]
        if isinstance(result, dict)
    ]


@tool
def scrape_page_tool(url: str) -> str:
    """Scrape a URL using Firecrawl and return its Markdown content."""
    if not url.strip():
        raise ValueError("URL must not be empty.")
    settings = load_settings()
    app = FirecrawlApp(api_key=settings.firecrawl_api_key)
    result: Any = app.scrape_url(url, params={"formats": ["markdown"]})
    if isinstance(result, dict):
        markdown = result.get("markdown")
        if isinstance(markdown, str):
            return markdown
    markdown = getattr(result, "markdown", None)
    if isinstance(markdown, str):
        return markdown
    raise RuntimeError(f"Firecrawl did not return Markdown for {url!r}.")
