"""Environment configuration for the research agent."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True, slots=True)
class Settings:
    """Validated credentials required by the agent's external services."""

    groq_api_key: str
    serpapi_api_key: str
    firecrawl_api_key: str


def load_settings(env_file: str | Path | None = None) -> Settings:
    """Load `.env` values and validate all required API keys.

    Args:
        env_file: Optional path to an environment file. By default, dotenv
            searches from the current working directory upward.

    Raises:
        ValueError: If one or more required keys are missing or blank.
    """
    if env_file is None:
        # Resolve beside this module so the backend .env works from any cwd.
        package_env = Path(__file__).resolve().parent / ".env"
        load_dotenv(dotenv_path=package_env, override=False)
        load_dotenv(override=False)
    else:
        load_dotenv(dotenv_path=env_file, override=False)
    names = {
        "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
        "SERPAPI_API_KEY": os.getenv("SERPAPI_API_KEY"),
        "FIRECRAWL_API_KEY": os.getenv("FIRECRAWL_API_KEY"),
    }
    missing = [name for name, value in names.items() if not value or not value.strip()]
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    return Settings(
        groq_api_key=names["GROQ_API_KEY"].strip(),  # type: ignore[union-attr]
        serpapi_api_key=names["SERPAPI_API_KEY"].strip(),  # type: ignore[union-attr]
        firecrawl_api_key=names["FIRECRAWL_API_KEY"].strip(),  # type: ignore[union-attr]
    )
