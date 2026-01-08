import os
from groq import Groq
from src.prompts.system import SYSTEM_PROMPT
import re
from src.config.settings import settings

class LLMService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile" # Using a capable model for reasoning

    def _clean_mermaid_response(self, content: str) -> str:
        """Extracts Mermaid code from markdown code blocks if present."""
        pattern = r"```mermaid\n(.*?)\n```"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        # Fallback: try to find just code block without mermaid tag
        pattern_generic = r"```\n(.*?)\n```"
        match_generic = re.search(pattern_generic, content, re.DOTALL)
        if match_generic:
            return match_generic.group(1).strip()
            
        return content.strip()

    def generate_diagram(self, description: str) -> str:
        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Create an architecture diagram for: {description}"}
                ],
                model=self.model,
                temperature=0.2, # Low temperature for more deterministic code
            )
            return self._clean_mermaid_response(completion.choices[0].message.content)
        except Exception as e:
            print(f"Error generating diagram: {e}")
            raise e

    def edit_diagram(self, current_diagram: str, instructions: str) -> str:
        try:
            prompt = f"""
Current Mermaid Diagram:
{current_diagram}

Edit Instructions:
{instructions}

Return the updated Mermaid diagram code ONLY.
"""
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.2,
            )
            return self._clean_mermaid_response(completion.choices[0].message.content)
        except Exception as e:
            print(f"Error editing diagram: {e}")
            raise e
