"""
LangGraph orchestration: the state machine that sequences the whole citizen journey.

Nodes owned by Person C: extract_document, match_eligibility, voice_readback.
Nodes owned by Person D (stubbed here as callbacks so C can build/test independently):
  auto_fill_form, human_in_loop_pause, track_status.

The graph is built so Person D's functions can be dropped in later via the
`agent_callbacks` dict without Person C's code changing.
"""
from typing import TypedDict, Optional, Callable
from langgraph.graph import StateGraph, END

from document_extraction import ExtractedProfile, extract_from_image, merge_profiles
from eligibility_matching import match_eligibility, EligibilityResult
from voice_pipeline import english_to_voice_output


class CitizenState(TypedDict, total=False):
    lang_code: str
    document_paths: list[str]
    profile: Optional[dict]
    eligibility: Optional[dict]
    selected_scheme_id: Optional[str]
    voice_reply_path: Optional[str]
    agent_status: Optional[str]        # e.g. "filling_form", "awaiting_otp", "submitted"
    human_input_needed: Optional[str]  # e.g. "otp" or "captcha", set by Person D's node
    human_input_value: Optional[str]   # filled in once the citizen responds


# --- Person C's nodes ---

def node_extract_document(state: CitizenState) -> CitizenState:
    profiles = [extract_from_image(p) for p in state["document_paths"]]
    merged = merge_profiles(profiles)
    state["profile"] = merged.model_dump()
    return state


def node_match_eligibility(state: CitizenState) -> CitizenState:
    profile = ExtractedProfile(**state["profile"])
    result: EligibilityResult = match_eligibility(profile)
    state["eligibility"] = result.model_dump()
    return state


def node_voice_readback(state: CitizenState) -> CitizenState:
    eligible = [v for v in state["eligibility"]["verdicts"] if v["eligible"]]
    if not eligible:
        summary = "You are not currently eligible for any of the schemes we checked."
    else:
        names = ", ".join(v["scheme_name"] for v in eligible)
        summary = f"You are eligible for the following schemes: {names}."
    path = english_to_voice_output(summary, state["lang_code"])
    state["voice_reply_path"] = path
    return state


# --- Placeholder nodes for Person D — replace via agent_callbacks at graph-build time ---

def _default_stub(state: CitizenState) -> CitizenState:
    state["agent_status"] = "stub_not_implemented_yet"
    return state


def build_graph(agent_callbacks: Optional[dict[str, Callable]] = None) -> StateGraph:
    """
    agent_callbacks lets Person D plug in real implementations of:
      "auto_fill_form", "human_in_loop_pause", "track_status"
    without touching this file.
    """
    callbacks = agent_callbacks or {}
    auto_fill_form = callbacks.get("auto_fill_form", _default_stub)
    human_in_loop_pause = callbacks.get("human_in_loop_pause", _default_stub)
    track_status = callbacks.get("track_status", _default_stub)

    graph = StateGraph(CitizenState)

    graph.add_node("extract_document", node_extract_document)
    graph.add_node("match_eligibility", node_match_eligibility)
    graph.add_node("voice_readback", node_voice_readback)
    graph.add_node("auto_fill_form", auto_fill_form)
    graph.add_node("human_in_loop_pause", human_in_loop_pause)
    graph.add_node("track_status", track_status)

    graph.set_entry_point("extract_document")
    graph.add_edge("extract_document", "match_eligibility")
    graph.add_edge("match_eligibility", "voice_readback")
    graph.add_edge("voice_readback", "auto_fill_form")

    # Human-in-loop branch: if the form-fill agent needs OTP/CAPTCHA, pause here.
    def needs_human_input(state: CitizenState) -> str:
        return "human_in_loop_pause" if state.get("human_input_needed") else "track_status"

    graph.add_conditional_edges(
        "auto_fill_form",
        needs_human_input,
        {"human_in_loop_pause": "human_in_loop_pause", "track_status": "track_status"},
    )
    graph.add_edge("human_in_loop_pause", "auto_fill_form")  # resume after human responds
    graph.add_edge("track_status", END)

    return graph.compile()


if __name__ == "__main__":
    app = build_graph()  # Person D's real callbacks get passed in once ready
    initial_state: CitizenState = {
        "lang_code": "hi",
        "document_paths": ["sample_docs/aadhaar_sample.jpg"],
    }
    final_state = app.invoke(initial_state)
    print(final_state["eligibility"])