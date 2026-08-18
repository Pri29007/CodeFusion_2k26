"""
Open-ended eligibility matching: the LLM identifies ALL central and state
government welfare schemes a citizen may be eligible for, using its own
knowledge — no hardcoded scheme catalog to maintain.

A separate keyword-matching pass flags which of those results correspond to
our 3 automatable schemes (the only ones with working mock portals). This
keeps "which schemes exist" and "which schemes we can automate" as two
independent concerns — expanding automation later means adding a keyword
entry in config.py, not touching this matching logic.
"""
import json
from typing import Literal
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI

from config import GEMINI_API_KEY, GEMINI_MODEL, AUTOMATABLE_SCHEMES
from profile_mapper import CitizenProfile


class SchemeVerdict(BaseModel):
    scheme_name: str = Field(description="Official name of the government scheme")
    category: str = Field(description="e.g. Agriculture, Housing, Healthcare, Education, Disability")
    level: Literal["central", "state"] = Field(description="Central govt scheme or state-specific")
    eligible: bool
    confidence: Literal["high", "medium", "low"]
    reason: str = Field(description="Plain-language explanation, max 2 sentences, no jargon")
    missing_info: list[str] = Field(
        default_factory=list,
        description="Fields we still need from the citizen to confirm eligibility, if any",
    )
    is_automatable: bool = False  # filled in after LLM call, not by the LLM itself


class EligibilityResult(BaseModel):
    verdicts: list[SchemeVerdict]

    @property
    def eligible_schemes(self) -> list[SchemeVerdict]:
        return [v for v in self.verdicts if v.eligible]

    @property
    def automatable_eligible_schemes(self) -> list[SchemeVerdict]:
        return [v for v in self.verdicts if v.eligible and v.is_automatable]

MATCHING_PROMPT = """
You are an expert on Indian government welfare schemes — central and state level.

Given the citizen profile below, identify UP TO 6 schemes they are most likely
eligible for — prioritize the most relevant and highest-confidence matches,
not exhaustive coverage.

Rules:
- Only include schemes you have reasonable confidence actually exist with real criteria.
- Do not invent scheme names.
- If the citizen's state is known, include at most 2 relevant state schemes.
- Give a plain-language reason in ONE sentence.
- If information is missing that would change the verdict, note it briefly in missing_info.

CITIZEN PROFILE:
{profile}

Respond with ONLY a valid JSON object in exactly this format (no markdown, no extra text):

{{
  "verdicts": [
    {{
      "scheme_name": "PM-KISAN",
      "category": "Agriculture",
      "level": "central",
      "eligible": true,
      "confidence": "high",
      "reason": "Short plain-language reason here.",
      "missing_info": []
    }}
  ]
}}
"""

def _flag_automatable(verdict: SchemeVerdict) -> bool:
    """Keyword match against our 3 mock-portal schemes — case-insensitive, no exact-name dependency."""
    name_lower = verdict.scheme_name.lower()
    for scheme_info in AUTOMATABLE_SCHEMES.values():
        if any(keyword in name_lower for keyword in scheme_info["keywords"]):
            return True
    return False

def match_eligibility(profile: CitizenProfile) -> EligibilityResult:
    profile_text = profile.model_dump_json(indent=2)

    llm = ChatGoogleGenerativeAI(
    google_api_key=GEMINI_API_KEY,
    model=GEMINI_MODEL,
    temperature=0,
    max_tokens=4096,          # was 1024 — thinking eats into this budget too
    thinking_level="medium",     # Gemini 3 uses this, not thinking_budget
    response_mime_type="application/json",
    )

    prompt = MATCHING_PROMPT.format(profile=profile_text)
    response = llm.invoke(prompt)

    # response.content can be a plain string OR a list of content blocks,
    # depending on the model/SDK version — handle both.
    content = response.content
    if isinstance(content, list):
        raw = "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and not block.get("thought", False)
        )
    else:
        raw = content

    raw = raw.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    if not raw:
        raise ValueError("LLM returned empty response — check model name and prompt length")

    data = json.loads(raw)
    result = EligibilityResult(**data)

    for v in result.verdicts:
        v.is_automatable = _flag_automatable(v)

    return result