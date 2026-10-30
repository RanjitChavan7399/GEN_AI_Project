"""
Compatibility bridge redirecting groq_service to PlacementAIService powered by GEMINI_API_KEY2.
This completely removes any dependency on Groq API while maintaining 100% backward compatibility.
"""
from services.placement_ai_service import placement_ai_service, PlacementAIService

GroqService = PlacementAIService
groq_service = placement_ai_service
