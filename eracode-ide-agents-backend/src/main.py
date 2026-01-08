from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import agent_routes, health_routes
from src.config.settings import settings
from src.utils.logger import logger
from src.routes.diagrams import router as diagrams
# Create FastAPI app
app = FastAPI(
    title="EraCode AI Agents Backend",
    description="Multi-agent system for intelligent code assistance",
    version="0.1.0"
)

# CORS - Allow Node.js backend to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.NODE_BACKEND_URL,
        "http://localhost:3000",  # Frontend
        "http://localhost:3001",  # Node.js backend
        "http://localhost:5173",  # Vite Frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_routes.router, tags=["Health"])
app.include_router(agent_routes.router, prefix="/agent", tags=["Agents"])
app.include_router(diagrams, prefix="/routes", tags=["diagrams"])
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🤖 EraCode AI Agents Backend",
        "status": "running",
        "version": "0.1.0",
        "docs": "/docs"
    }

@app.on_event("startup")
async def startup_event():
    """Startup event - log configuration"""
    logger.info("=" * 60)
    logger.info("🚀 EraCode AI Agents Backend Starting")
    logger.info("=" * 60)
    logger.info(f"   Model: {settings.MODEL_PROVIDER}:{settings.MODEL_NAME}")
    logger.info(f"   Port: {settings.PORT}")
    logger.info(f"   Debug: {settings.DEBUG}")
    logger.info(f"   Permission Level: {settings.DEFAULT_PERMISSION_LEVEL}")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("🛑 EraCode AI Agents Backend Shutting Down")
