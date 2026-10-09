from .onboarding import router as onboarding_router
from .chapters import router as chapters_router
from .graph import router as graph_router
from .assessment import router as assessment_router
from .chat import router as chat_router
from .user import router as user_router

__all__ = [
    "onboarding_router",
    "chapters_router",
    "graph_router",
    "assessment_router",
    "chat_router",
    "user_router"
]

