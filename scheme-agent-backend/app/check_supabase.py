import os
from dotenv import load_dotenv
from supabase import create_client


# Load variables from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing from .env")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_SECRET_KEY is missing from .env")

print("Supabase URL:", SUPABASE_URL)
print("Supabase secret key loaded:", bool(SUPABASE_KEY))

client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================
# 1. CHECK APPLICATIONS TABLE
# ============================================================

print("\n" + "=" * 70)
print("APPLICATIONS TABLE")
print("=" * 70)

try:
    response = (
        client
        .table("applications")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    applications = response.data

    print(f"\nTotal application rows: {len(applications)}\n")

    for i, row in enumerate(applications, start=1):
        print(f"--- Application {i} ---")
        print("ID:", row.get("id"))
        print("Aadhaar:", row.get("aadhaar_number"))
        print("Scheme:", row.get("scheme_name"))
        print("Status:", row.get("status"))
        print("Form Data:", row.get("form_data"))
        print("Created:", row.get("created_at"))
        print("Updated:", row.get("updated_at"))
        print()


except Exception as e:
    print("\nERROR READING APPLICATIONS TABLE:")
    print(type(e).__name__)
    print(repr(e))


# ============================================================
# 2. CHECK STATIC-AUDIO BUCKET
# ============================================================

print("\n" + "=" * 70)
print("STATIC-AUDIO BUCKET")
print("=" * 70)

try:
    response = (
        client
        .storage
        .from_("static-audio")
        .list()
    )

    print(f"\nItems in bucket root: {len(response)}\n")

    for item in response:
        print(item)

except Exception as e:
    print("\nERROR READING STATIC-AUDIO BUCKET:")
    print(type(e).__name__)
    print(repr(e))


# ============================================================
# 3. CHECK AUDIO FOR YOUR TEST AADHAAR
# ============================================================

AADHAAR = "456789012345"

print("\n" + "=" * 70)
print(f"AUDIO FOR AADHAAR: {AADHAAR}")
print("=" * 70)

try:
    response = (
        client
        .storage
        .from_("static-audio")
        .list(AADHAAR)
    )

    print(f"\nFiles found: {len(response)}\n")

    for item in response:
        filename = item.get("name")

        print("File:", item)

        if filename:
            path = f"{AADHAAR}/{filename}"

            public_url = (
                f"{SUPABASE_URL}"
                f"/storage/v1/object/public/"
                f"static-audio/{path}"
            )

            print("Path:", path)
            print("Public URL:", public_url)
            print()


except Exception as e:
    print("\nERROR READING USER AUDIO:")
    print(type(e).__name__)
    print(repr(e))