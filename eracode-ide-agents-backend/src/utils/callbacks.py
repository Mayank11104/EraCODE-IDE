import httpx
from typing import Any
from src.utils.logger import logger

async def send_callback(callback_url: str, data: dict[str, Any]) -> bool:
    """
    Send results back to Node.js backend via HTTP POST
    
    Args:
        callback_url: URL to send callback to
        data: Data to send in request body
        
    Returns:
        True if successful, False otherwise
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(callback_url, json=data)
            
            if response.status_code == 200:
                logger.info(f"✅ Callback sent successfully to {callback_url}")
                return True
            else:
                logger.error(f"❌ Callback failed with status {response.status_code}")
                return False
                
    except httpx.TimeoutException:
        logger.error(f"❌ Callback timeout for {callback_url}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Callback error: {str(e)}")
        return False
