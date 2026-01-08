from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
import json

# Load environment variables
load_dotenv()

# Initialize Groq LLM
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

# Supervisor Agent Prompt (using triple quotes and f-string)
def get_supervisor_prompt(request: str) -> str:
    return f"""You are an AI coding agent for EraCode IDE.

Your job: Generate code based on user requests.

Instructions:
1. Understand the user's request
2. Write clean, working code
3. Add comments to explain logic
4. Return the code in JSON format

Response Format (JSON):
{{
  "language": "python|javascript|etc",
  "filename": "suggested_filename.ext",
  "code": "actual code here",
  "explanation": "what the code does"
}}

User Request: {request}

Respond ONLY with valid JSON. No markdown, no extra text."""

def ask_agent(request: str):
    """Ask the agent to write code"""
    
    print(f"\n🤖 User Request: {request}\n")
    print("⏳ Agent thinking...\n")
    
    # Create prompt
    prompt = get_supervisor_prompt(request)
    
    # Get response from agent
    response = llm.invoke(prompt)
    
    print("=" * 60)
    print("✅ Agent Response:")
    print("=" * 60)
    
    # Clean response (remove markdown if present)
    content = response.content.strip()
    if content.startswith("```json"):
        content = content.replace("```json", "").replace("```", "").strip()
    elif content.startswith("```"):
        content = content.replace("```", "").strip()
    
    try:
        # Try to parse JSON
        result = json.loads(content)
        
        print(f"\n📄 Filename: {result.get('filename', 'N/A')}")
        print(f"🔤 Language: {result.get('language', 'N/A')}")
        print(f"\n💡 Explanation:\n{result.get('explanation', 'N/A')}\n")
        print("=" * 60)
        print("📝 Generated Code:")
        print("=" * 60)
        print(result.get('code', 'No code generated'))
        print("=" * 60)
        
        return result
        
    except json.JSONDecodeError as e:
        # If not JSON, just print raw response
        print(f"⚠️ Could not parse JSON: {e}\n")
        print("Raw response:")
        print(content)
        return None

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀 EraCode AI Agent - Coding Test")
    print("=" * 60)
    
    # Test with a coding request
    request = input("\n💬 What code should I write? (or press Enter for example)\n> ")
    
    if not request.strip():
        # Default example
        request = "Write a Python function to calculate factorial recursively"
    
    result = ask_agent(request)
    
    print("\n✅ Test complete!\n")
