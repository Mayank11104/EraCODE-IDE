from src.config.settings import settings
from langchain_openai import AzureChatOpenAI
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

def test_azure_connection():
    print("="*60)
    print("🔍 Testing Azure OpenAI Connection")
    print("="*60)
    
    print(f"Endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
    print(f"Deployment: {settings.AZURE_OPENAI_DEPLOYMENT_NAME}")
    print(f"Version: {settings.AZURE_OPENAI_API_VERSION}")
    # Mask API Key
    key_masked = f"{settings.AZURE_OPENAI_API_KEY[:4]}...{settings.AZURE_OPENAI_API_KEY[-4:]}" if len(settings.AZURE_OPENAI_API_KEY) > 8 else "NOT SET"
    print(f"API Key: {key_masked}")
    
    print("\nAttempting to create client...")
    try:
        llm = AzureChatOpenAI(
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            openai_api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            temperature=0.1,
        )
        print("✅ Client initialized")
        
        print("\nSending test request...")
        response = llm.invoke("Hello, are you working?")
        print(f"✅ Response received:\n{response.content}")
        
    except Exception as e:
        print(f"\n❌ Connection Failed: {e}")
        print("\nTroubleshooting Tips:")
        print("1. Endpoint should be: https://YOUR_RESOURCE_NAME.openai.azure.com/")
        print("2. Deployment Name must match exactly what is in Azure Portal.")
        print("3. Check if your API Key is correct.")

if __name__ == "__main__":
    test_azure_connection()
