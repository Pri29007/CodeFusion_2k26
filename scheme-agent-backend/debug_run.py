import os
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import faulthandler
faulthandler.enable()

import sys
sys.path.insert(0, "app/agent")

from onboarding_pipeline import run_scheme_matching_for_user
result = run_scheme_matching_for_user("777733334444")
print(result)