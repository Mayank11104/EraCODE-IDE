from fastapi import APIRouter
from src.models.response_models import HealthResponse
from src.config.settings import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the agent backend is healthy"""
    return HealthResponse(
        status="healthy",
        agents=["analyzer", "code", "debug", "terminal"],
        version="0.1.0",
        model=f"{settings.MODEL_PROVIDER}:{settings.MODEL_NAME}"
    )

@router.get("/status")
async def status():
    """Detailed status information"""
    return {
        "status": "running",
        "agents": {
            "analyzer": "ready",
            "code": "ready",
            "debug": "ready",
            "terminal": "ready"
        },
        "configuration": {
            "model_provider": settings.MODEL_PROVIDER,
            "model_name": settings.MODEL_NAME,
            "permission_level": settings.DEFAULT_PERMISSION_LEVEL,
            "max_iterations": settings.MAX_ITERATIONS
        }
    }
