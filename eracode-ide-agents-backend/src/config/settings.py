from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Groq API Configuration
    GROQ_API_KEY: str
    
    # Model Configuration
    MODEL_PROVIDER: Literal["groq", "openai", "anthropic", "google"] = "groq"
    MODEL_NAME: str = "llama-3.3-70b-versatile"
    TEMPERATURE: float = 0.3
    MAX_TOKENS: int = 4096
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    DEBUG: bool = True
    
    # Node.js Backend Configuration
    NODE_BACKEND_URL: str = "http://localhost:3001"
    
    # Agent Configuration
    DEFAULT_PERMISSION_LEVEL: Literal["off", "auto", "turbo"] = "auto"
    MAX_ITERATIONS: int = 10
    AGENT_TIMEOUT: int = 120  # seconds
    
    # File System Configuration
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_EXTENSIONS: list[str] = [
        ".py", ".js", ".ts", ".tsx", ".jsx",
        ".java", ".cpp", ".c", ".go", ".rs",
        ".html", ".css", ".json", ".yaml", ".yml",
        ".md", ".txt", ".sh", ".bat", ".sql"
    ]
    
    # Safety Configuration
    DANGEROUS_COMMANDS: list[str] = [
        "rm -rf", "del /f", "format", "dd if=",
        "git reset --hard", "git push --force",
        "npm publish", "pip install --upgrade pip"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()
