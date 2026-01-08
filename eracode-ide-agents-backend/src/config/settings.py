from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # ===== LLM Provider =====
    MODEL_PROVIDER: Literal["azure", "groq", "openai", "anthropic", "google"] = "azure"
    MODEL_NAME: str = "gpt-4"

    # ===== Azure OpenAI Configuration =====
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_VERSION: str = "2023-05-15"
    AZURE_OPENAI_DEPLOYMENT_NAME: str

    TEMPERATURE: float = 0.3
    MAX_TOKENS: int = 4096

    # ===== Server =====
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    DEBUG: bool = True

    # ===== Node Backend =====
    NODE_BACKEND_URL: str = "http://localhost:3001"

    # ===== Agent =====
    DEFAULT_PERMISSION_LEVEL: Literal["off", "auto", "turbo"] = "auto"
    MAX_ITERATIONS: int = 10
    AGENT_TIMEOUT: int = 120

    # ===== File System =====
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_EXTENSIONS: list[str] = [
        ".py", ".js", ".ts", ".tsx", ".jsx",
        ".java", ".cpp", ".c", ".go", ".rs",
        ".html", ".css", ".json", ".yaml", ".yml",
        ".md", ".txt", ".sh", ".bat", ".sql"
    ]

    # ===== Safety =====
    DANGEROUS_COMMANDS: list[str] = [
        "rm -rf", "del /f", "format", "dd if=",
        "git reset --hard", "git push --force",
        "npm publish", "pip install --upgrade pip"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
