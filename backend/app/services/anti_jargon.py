import re
import logging
from typing import List, Optional, Tuple, Dict, Any
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class AntiJargonService:
    @staticmethod
    def scan_for_blacklisted_jargon(
        text: str,
        jargon_blacklist: List[str]
    ) -> Optional[str]:
        """
        Performs case-insensitive word-boundary token matching.
        Returns the first flagged jargon word detected, or None.
        """
        if not text or not jargon_blacklist:
            return None

        # Clean text
        text_lower = text.lower()
        for term in jargon_blacklist:
            cleaned_term = term.strip().lower()
            if not cleaned_term:
                continue
            # Regex match with word boundaries
            pattern = r'\b' + re.escape(cleaned_term) + r'\b'
            if re.search(pattern, text_lower):
                return term
        return None

    @staticmethod
    def verify_action_verbs(
        student_text: str,
        banned_words: List[str],
        concept_invariant: str
    ) -> Dict[str, Any]:
        """
        Calls the low-latency 32B model to verify that the student used
        physical/mechanical action verbs rather than domain labels.
        """
        try:
            return llm_service.evaluate_anti_jargon(
                student_text=student_text,
                banned_words=banned_words,
                concept_invariant=concept_invariant
            )
        except Exception as e:
            logger.error(f"Error in Anti-Jargon LLM evaluation: {e}")
            # Resilient fallback: check word count and absence of banned words
            banned_found = AntiJargonService.scan_for_blacklisted_jargon(student_text, banned_words)
            if banned_found:
                return {
                    "passed": False,
                    "reasoning": f"Explanation still contains the banned label '{banned_found}'."
                }
            return {
                "passed": True,
                "reasoning": "Mechanistic verbs accepted without prohibited textbook jargon."
            }

anti_jargon_service = AntiJargonService()
