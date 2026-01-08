from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.llm import LLMService

router = APIRouter()

# Initialize Service
# In a real production app, we might use dependency injection
llm_service = LLMService()

class GenerateRequest(BaseModel):
    description: str

class EditRequest(BaseModel):
    diagram: str
    instructions: str

class DiagramResponse(BaseModel):
    diagram: str

@router.post("/generate-diagram", response_model=DiagramResponse)
async def generate_diagram(request: GenerateRequest):
    """
    Generate a Mermaid architecture diagram from a text description.
    """
    if not request.description:
        raise HTTPException(status_code=400, detail="Description is required")
    
    try:
        diagram_code = llm_service.generate_diagram(request.description)
        return DiagramResponse(diagram=diagram_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edit-diagram", response_model=DiagramResponse)
async def edit_diagram(request: EditRequest):
    """
    Edit an existing Mermaid diagram based on instructions.
    """
    if not request.diagram or not request.instructions:
        raise HTTPException(status_code=400, detail="Diagram and instructions are required")
        
    try:
        updated_diagram = llm_service.edit_diagram(request.diagram, request.instructions)
        return DiagramResponse(diagram=updated_diagram)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
