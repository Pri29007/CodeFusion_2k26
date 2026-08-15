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
from langchain_groq import ChatGroq

from config import GROQ_API_KEY, GROQ_MODEL, AUTOMATABLE_SCHEMES
from document_extraction import ExtractedProfile


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
You are an expert on Indian government welfare schemes — central and state level —
covering housing, healthcare, agriculture, education, disability, and income support.

Given the citizen profile below, identify EVERY scheme they are likely eligible for,
based on standard, well-documented eligibility criteria for schemes like (but not
limited to) PM-KISAN, PMAY, Ayushman Bharat/PM-JAY, National Scholarship schemes,
disability pension schemes, and relevant state-level schemes for their state if known.

Rules:
- Only include schemes you have reasonable confidence actually exist with real criteria.
  Do not invent scheme names.
- If the citizen's state is known, prioritize including relevant state schemes, marked
  with level="state".
- For each scheme, give a plain-language reason a non-technical citizen can understand.
- If information is missing that would change the verdict, note it in missing_info
  rather than guessing.
- Aim for thoroughness — a citizen should see every scheme they may qualify for, not
  just the most famous ones.

CITIZEN PROFILE:
{profile}

Return ONLY valid JSON matching this schema, no prose outside the JSON:
{schema}
"""


def _flag_automatable(verdict: SchemeVerdict) -> bool:
    """Keyword match against our 3 mock-portal schemes — case-insensitive, no exact-name dependency."""
    name_lower = verdict.scheme_name.lower()
    for scheme_info in AUTOMATABLE_SCHEMES.values():
        if any(keyword in name_lower for keyword in scheme_info["keywords"]):
            return True
    return False


def match_eligibility(profile: ExtractedProfile) -> EligibilityResult:
    profile_text = profile.model_dump_json(indent=2)

    llm = ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL, temperature=0)
    structured_llm = llm.with_structured_output(EligibilityResult)

    prompt = MATCHING_PROMPT.format(
        profile=profile_text,
        schema=EligibilityResult.model_json_schema(),
    )

    result = structured_llm.invoke(prompt)

    for v in result.verdicts:
        v.is_automatable = _flag_automatable(v)

    return result


if __name__ == "__main__":
    sample = ExtractedProfile(
        full_name="Ramesh Kumar",
        age=42,
        annual_income=250000,
        owns_land=True,
        land_area_acres=2.5,
        owns_pucca_house=False,
        is_government_employee=False,
        pays_income_tax=False,
        caste_category="OBC",
        state="Maharashtra",
    )
    result = match_eligibility(sample)
    for v in result.verdicts:
        status = "ELIGIBLE" if v.eligible else "NOT ELIGIBLE"
        auto = " 🤖 AUTOMATABLE" if v.is_automatable else ""
        print(f"\n{v.scheme_name} [{v.level}]{auto}: {status} ({v.confidence})")
        print(f"  Reason: {v.reason}")
        if v.missing_info:
            print(f"  Missing: {v.missing_info}")