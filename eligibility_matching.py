"""
Eligibility matching: takes the extracted citizen profile, retrieves relevant scheme
context via RAG, and asks the LLM to decide match/no-match for EACH of the 3 schemes
with a plain-language explanation.

Two layers of constraint keep this from hallucinating schemes that don't exist in
our mocked system:
  1. STRUCTURAL: the Pydantic output schema has a fixed field per scheme_id — the
     LLM literally cannot invent a 4th field.
  2. PROMPT: explicit instruction to reason ONLY from the provided context.
"""
import json
from typing import Literal
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq

from config import GROQ_API_KEY, GROQ_MODEL, SCHEME_IDS
from document_extraction import ExtractedProfile
from rag_pipeline import get_retriever


class SchemeVerdict(BaseModel):
    scheme_id: Literal["pm_kisan", "pmay", "ayushman_bharat"]
    scheme_name: str
    eligible: bool
    confidence: Literal["high", "medium", "low"]
    reason: str = Field(description="Plain-language explanation, max 2 sentences, no jargon")
    missing_info: list[str] = Field(
        default_factory=list,
        description="Fields we still need from the citizen to confirm eligibility, if any",
    )


class EligibilityResult(BaseModel):
    verdicts: list[SchemeVerdict]

    @property
    def eligible_schemes(self) -> list[SchemeVerdict]:
        return [v for v in self.verdicts if v.eligible]


MATCHING_PROMPT = """
You are an eligibility-matching assistant for an Indian government welfare scheme
program. You will be given a citizen's profile and official scheme criteria retrieved
from our database.

STRICT RULES:
- Only evaluate the schemes present in the CONTEXT below. Do not mention, reference,
  or invent any scheme not in the context.
- Base every verdict strictly on the criteria text provided — do not use outside
  knowledge about these schemes even if you know more about them.
- If the profile is missing information needed to confirm eligibility for a scheme,
  set eligible based on your best reading of available data, but list what's missing
  in missing_info.
- Explanations must be simple, plain language a non-technical citizen can understand.
  No legal or bureaucratic jargon.

CITIZEN PROFILE:
{profile}

SCHEME CONTEXT (retrieved):
{context}

Return ONLY valid JSON matching this schema, no prose outside the JSON:
{schema}
"""


def match_eligibility(profile: ExtractedProfile) -> EligibilityResult:
    retriever = get_retriever(k=len(SCHEME_IDS))  # always pull all 3 — small, fixed universe
    profile_text = profile.model_dump_json(indent=2)

    retrieved_docs = retriever.invoke(profile_text)
    context = "\n\n---\n\n".join(d.page_content for d in retrieved_docs)

    llm = ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL, temperature=0)

    prompt = MATCHING_PROMPT.format(
        profile=profile_text,
        context=context,
        schema=EligibilityResult.model_json_schema(),
    )

    response = llm.invoke(prompt)
    raw = response.content.strip().removeprefix("```json").removesuffix("```").strip()
    data = json.loads(raw)
    result = EligibilityResult(**data)

    # Hard guardrail: drop anything that somehow isn't one of our 3 scheme_ids
    result.verdicts = [v for v in result.verdicts if v.scheme_id in SCHEME_IDS]
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
    )
    result = match_eligibility(sample)
    for v in result.verdicts:
        print(f"{v.scheme_name}: {'ELIGIBLE' if v.eligible else 'NOT ELIGIBLE'} ({v.confidence})")
        print(f"  Reason: {v.reason}")
        if v.missing_info:
            print(f"  Missing: {v.missing_info}")