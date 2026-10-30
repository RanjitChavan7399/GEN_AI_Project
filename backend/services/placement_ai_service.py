import os
import json
import re
import time
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class PlacementAIService:
    """
    Placement AI Service powered by Google Gemini (GEMINI_API_KEY2).
    Generates company roadmaps, technical interview questions, answer evaluations,
    concept explanations, and audio transcription without using Groq.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY2", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
        env_model = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview").strip()
        if "2.5" in env_model or "2.0" in env_model or "1.5" in env_model:
            env_model = "gemini-3-flash-preview"
        
        self.candidate_models = [
            env_model,
            "gemini-3-flash-preview",
            "gemini-3.5-flash",
            "gemini-flash-latest",
            "gemini-3.8-flash"
        ]
        # De-duplicate candidate models
        seen = set()
        self.candidate_models = [m for m in self.candidate_models if not (m in seen or seen.add(m))]
        self.model_name = self.candidate_models[0]
        self.client = None
        self._init_client()

    def _init_client(self):
        self.api_key = os.getenv("GEMINI_API_KEY2", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Initialized Gemini Client for Placement AI with candidate models: {self.candidate_models}.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI Client: {e}")
                self.client = None
        else:
            logger.warning("Neither GEMINI_API_KEY2 nor GEMINI_API_KEY found in environment settings.")
            self.client = None

    def is_available(self) -> bool:
        if self.client is None and (os.getenv("GEMINI_API_KEY2") or os.getenv("GEMINI_API_KEY")):
            self._init_client()
        return self.client is not None and bool(self.api_key)

    def generate_completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.2, max_tokens: int = 4096) -> str:
        """Generate text completion using GEMINI_API_KEY2 with retries and multi-model quota fallback."""
        if not self.is_available():
            raise RuntimeError("Gemini Placement AI Client is not configured. GEMINI_API_KEY2 is missing.")

        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens
        )

        last_error = None
        for model in self.candidate_models:
            for attempt in range(2):
                try:
                    response = self.client.models.generate_content(
                        model=model,
                        contents=user_prompt,
                        config=config
                    )
                    if response and response.text:
                        self.model_name = model
                        return response.text.strip()
                    raise ValueError("Empty response received from Gemini.")
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "404" in err_str or "not available" in err_str:
                        logger.warning(f"Model {model} hit rate limit / deprecation ({e}). Trying next fallback model...")
                        break
                    elif "503" in err_str or "high demand" in err_str:
                        logger.warning(f"Gemini API high demand on {model} (attempt {attempt+1}): {e}. Retrying...")
                        time.sleep(1.5)
                    else:
                        break

        raise RuntimeError(f"Gemini API generation failed across all models: {last_error}")

    def generate_json_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.2, max_tokens: int = 4096) -> dict:
        """Query Gemini LLM with GEMINI_API_KEY2 and safely parse clean JSON output with defensive repair."""
        full_system_prompt = (
            system_prompt + 
            "\nCRITICAL: Return ONLY a valid JSON object matching the requested schema. Do not include markdown code block backticks, trailing commas, or explanations outside the JSON."
        )

        raw_output = self.generate_completion(full_system_prompt, user_prompt, temperature=temperature, max_tokens=max_tokens)

        def _repair_json_text(text: str) -> str:
            cleaned = re.sub(r'```(?:json)?\s*([\s\S]*?)\s*```', r'\1', text).strip()
            cleaned = re.sub(r'//.*?\n', '\n', cleaned)
            cleaned = re.sub(r'/\*[\s\S]*?\*/', '', cleaned)
            cleaned = re.sub(r',\s*([\]}])', r'\1', cleaned)
            return cleaned.strip()

        cleaned_text = _repair_json_text(raw_output)

        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            pass

        # Try regex extraction of first outer balanced curly braces
        match = re.search(r'(\{[\s\S]*\})', cleaned_text)
        if match:
            candidate = _repair_json_text(match.group(1))
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass

        # Try finding last valid closing brace if truncated
        last_brace = cleaned_text.rfind('}')
        first_brace = cleaned_text.find('{')
        if first_brace != -1 and last_brace > first_brace:
            candidate = _repair_json_text(cleaned_text[first_brace:last_brace + 1])
            try:
                return json.loads(candidate)
            except json.JSONDecodeError as err:
                logger.error(f"Failed to parse repaired JSON block: {err}")

        raise ValueError(f"Failed to parse JSON response from Gemini output: {raw_output[:250]}")

    def transcribe_audio(self, audio_file) -> str:
        """Transcribe audio recording via Gemini multimodal audio understanding."""
        if not self.is_available():
            raise RuntimeError("Gemini Client is not configured. GEMINI_API_KEY2 is missing.")

        try:
            from google.genai import types
            audio_bytes = audio_file.read() if hasattr(audio_file, 'read') else audio_file
            part = types.Part.from_bytes(
                data=audio_bytes,
                mime_type=getattr(audio_file, 'content_type', 'audio/webm') or 'audio/webm'
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    part,
                    "Transcribe this spoken interview audio verbatim into text. Return ONLY the transcribed words."
                ]
            )
            if response and response.text:
                return response.text.strip()
            return ""
        except Exception as e:
            logger.error(f"Gemini audio transcription error: {e}")
            raise RuntimeError(f"Audio transcription failed: {e}")

placement_ai_service = PlacementAIService()
