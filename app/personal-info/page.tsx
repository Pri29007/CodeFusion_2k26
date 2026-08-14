"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins, Noto_Sans } from "next/font/google";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Minus,
  Plus,
  User,
  Home,
  Briefcase,
  HeartPulse,
  Loader2,
  MapPin,
  Globe,
} from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/* -------------------------------------------------------------------------
 * TYPES
 * When wiring to a real backend, this shape is what you'll POST to
 * something like `/api/profile`. Keep it as the single source of truth
 * for the form's state.
 * ---------------------------------------------------------------------- */
type FormData = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dob: string;
  language: string;
  age: string;
  gender: string;
  category: string;
  maritalStatus: string;
  address: string;
  city: string;
  state: string;
  rationCard: string;
  income: string;
  housing: string;
  rooms: number;
  familyMembers: number;
  under18Members: number;
  occupation: string;
  occupationOther: string;
  landOwned: boolean | null;
  landAcres: string;
  disability: boolean | null;
  chronicIllness: boolean | null;
};

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  dob: "",
  language: "",
  age: "",
  gender: "",
  category: "",
  maritalStatus: "",
  address: "",
  city: "",
  state: "",
  rationCard: "",
  income: "",
  housing: "",
  rooms: 1,
  familyMembers: 1,
  under18Members: 0,
  occupation: "",
  occupationOther: "",
  landOwned: null,
  landAcres: "",
  disability: null,
  chronicIllness: null,

};

type SectionId = "basic" | "demographic" | "financial" | "occupation" | "health";

/* -------------------------------------------------------------------------
 * REUSABLE UI PIECES
 * These are intentionally dumb/presentational — swap className tokens in
 * one place if the design system changes later.
 * ---------------------------------------------------------------------- */

/** A row of large, tappable "chip" buttons used instead of <select> dropdowns. */
function ChipGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const gridCols =
    columns === 4
      ? "grid-cols-4"
      : columns === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`min-h-[48px] px-3 rounded-xl text-sm font-medium border transition-colors ${
              active
                ? "bg-blue-700 border-blue-700 text-white"
                : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Simple Yes / No toggle, styled as two big chips rather than a switch. */
function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={value === true}
        className={`min-h-[48px] rounded-xl text-sm font-medium border transition-colors ${
          value === true
            ? "bg-blue-700 border-blue-700 text-white"
            : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={value === false}
        className={`min-h-[48px] rounded-xl text-sm font-medium border transition-colors ${
          value === false
            ? "bg-blue-700 border-blue-700 text-white"
            : "bg-white border-gray-300 text-gray-700 active:bg-gray-50"
        }`}
      >
        No
      </button>
    </div>
  );
}

/** Number stepper with - / + buttons — avoids users having to type on a
 * cramped numeric keyboard for small counts like rooms/family members. */
function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="w-12 h-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-700 active:bg-gray-50 disabled:opacity-40"
      >
        <Minus className="w-5 h-5" />
      </button>
      <span className="w-10 text-center text-lg font-semibold text-gray-900">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="w-12 h-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-700 active:bg-gray-50 disabled:opacity-40"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

/** Field wrapper: label + helper text (which scheme this maps to) + control. */
function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {label}
      </label>
      {helper && <p className="text-xs text-gray-400 mb-2">{helper}</p>}
      {children}
    </div>
  );
}

/** Collapsible section card (accordion). Shows a check badge once every
 * required field inside has a value, so users get a sense of progress. */
function Section({
  id,
  title,
  icon,
  isOpen,
  isComplete,
  optional,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  isComplete: boolean;
  optional?: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 min-h-[56px]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isComplete ? "bg-blue-700" : "bg-gray-100"
            }`}
          >
            {isComplete ? (
              <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
            ) : (
              <span className="text-gray-500">{icon}</span>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {optional && (
              <p className="text-xs text-gray-400">Optional — you can skip this</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * PAGE
 * ---------------------------------------------------------------------- */
export default function DemographicDetailsPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(initialFormData);
 const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
  basic: true,
  demographic: false,
  financial: false,
  occupation: false,
  health: false,
});
  const [isSaving, setIsSaving] = useState(false);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(id: SectionId) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Section completion checks — used only to show the check-mark badge.
  const basicComplete =
  !!formData.firstName && !!formData.lastName && !!formData.phoneNumber && !!formData.dob && !!formData.language;
  const demographicComplete =
    !!formData.age && !!formData.gender && !!formData.category && !!formData.maritalStatus;
  const financialComplete =
    !!formData.rationCard && !!formData.income && !!formData.housing;
  const occupationComplete =
    !!formData.occupation &&
    (formData.landOwned === false || (formData.landOwned === true && !!formData.landAcres));
  // Health section is optional, so it's never "required" to be complete.
  const healthComplete = formData.disability !== null && formData.chronicIllness !== null;

  const canSubmit = basicComplete && demographicComplete && financialComplete && occupationComplete;

  function handleSaveAndNext() {
    if (!canSubmit) return;
    setIsSaving(true);

    // ---------------------------------------------------------------
    // TODO (backend): replace this mock delay with a real API call, e.g.
    //
    // const res = await fetch("/api/profile", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(formData),
    // });
    // if (!res.ok) { setIsSaving(false); /* show error toast */ return; }
    //
    // Only navigate forward once the save actually succeeds.
    // ---------------------------------------------------------------
    setTimeout(() => {
      setIsSaving(false);
      router.push("/doc-upload");
    }, 1200);
  }

  return (
    <div
      className={`${poppins.variable} ${notoSans.variable} min-h-screen bg-[#F5F6F8] font-[family-name:var(--font-body)]`}
    >
      {/* Header with step indicator */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-medium text-blue-700 mb-1">Step 2 of 3</p>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-gray-900">
            Tell us about yourself
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            This helps us match you to the right schemes
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-blue-700 rounded-full" />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-5">
        <div className="max-w-sm mx-auto flex flex-col gap-4">
{/* SECTION 0: Basic Info */}
<Section
  id="basic"
  title="Basic Info"
  icon={<Globe className="w-5 h-5" />}
  isOpen={openSections.basic}
  isComplete={basicComplete}
  onToggle={toggleSection}
>
  <Field label="First Name">
    <input
      type="text"
      value={formData.firstName}
      onChange={(e) => update("firstName", e.target.value)}
      placeholder="e.g. Ramesh"
      className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
    />
  </Field>

  <Field label="Last Name">
    <input
      type="text"
      value={formData.lastName}
      onChange={(e) => update("lastName", e.target.value)}
      placeholder="e.g. Kumar"
      className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
    />
  </Field>

  <Field label="Phone Number">
    <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
      <span className="text-gray-700 font-medium text-base pr-2 border-r border-gray-300 h-[48px] flex items-center">
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        value={formData.phoneNumber}
        onChange={(e) => update("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="98765 43210"
        className="flex-1 h-[48px] bg-transparent outline-none text-base text-gray-900"
      />
    </div>
  </Field>

  <Field label="Date of Birth">
    <input
      type="date"
      value={formData.dob}
      onChange={(e) => update("dob", e.target.value)}
      className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
    />
  </Field>

  <Field label="Preferred Language">
    <select
      value={formData.language}
      onChange={(e) => update("language", e.target.value)}
      className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">Select language</option>
      <option value="hi">हिंदी (Hindi)</option>
      <option value="en">English</option>
      <option value="bn">বাংলা (Bengali)</option>
      <option value="ta">தமிழ் (Tamil)</option>
      <option value="te">తెలుగు (Telugu)</option>
      <option value="mr">मराठी (Marathi)</option>
      <option value="gu">ગુજરાતી (Gujarati)</option>
      <option value="kn">ಕನ್ನಡ (Kannada)</option>
      <option value="ml">മലയാളം (Malayalam)</option>
      <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
      <option value="or">ଓଡ଼ିଆ (Odia)</option>
      <option value="as">অসমীয়া (Assamese)</option>
    </select>
  </Field>
</Section>
          {/* SECTION 1: Demographic */}
          <Section
            id="demographic"
            title="Demographic Details"
            icon={<User className="w-5 h-5" />}
            isOpen={openSections.demographic}
            isComplete={demographicComplete}
            onToggle={toggleSection}
          >
            <Field label="Age">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                value={formData.age}
                onChange={(e) => update("age", e.target.value)}
                placeholder="e.g. 42"
                className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="Gender">
              <ChipGroup
                columns={3}
                value={formData.gender}
                onChange={(v) => update("gender", v)}
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
              />
            </Field>

            <Field label="Social Category" helper="Used for SECC-2011 based scheme matching">
              <ChipGroup
                columns={4}
                value={formData.category}
                onChange={(v) => update("category", v)}
                options={[
                  { label: "General", value: "general" },
                  { label: "OBC", value: "obc" },
                  { label: "SC", value: "sc" },
                  { label: "ST", value: "st" },
                ]}
              />
            </Field>
            <Field label="Address">
  <input
    type="text"
    value={formData.address}
    onChange={(e) => update("address", e.target.value)}
    placeholder="House no, street, village"
    className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
  />
</Field>

<Field label="City">
  <input
    type="text"
    value={formData.city}
    onChange={(e) => update("city", e.target.value)}
    className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
  />
</Field>

<Field label="State">
  <select
    value={formData.state}
    onChange={(e) => update("state", e.target.value)}
    className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
  >
    <option value="">Select state</option>
    <option value="up">Uttar Pradesh</option>
    <option value="bihar">Bihar</option>
    <option value="mp">Madhya Pradesh</option>
    <option value="rajasthan">Rajasthan</option>
    <option value="maharashtra">Maharashtra</option>
    {/* add remaining states/UTs */}
  </select>
</Field>

            <Field label="Marital Status">
              <ChipGroup
                columns={3}
                value={formData.maritalStatus}
                onChange={(v) => update("maritalStatus", v)}
                options={[
                  { label: "Single", value: "single" },
                  { label: "Married", value: "married" },
                  { label: "Widowed", value: "widowed" },
                ]}
              />
            </Field>
          </Section>

          {/* SECTION 2: Financial & Household */}
          <Section
            id="financial"
            title="Financial & Household"
            icon={<Home className="w-5 h-5" />}
            isOpen={openSections.financial}
            isComplete={financialComplete}
            onToggle={toggleSection}
          >
            <Field label="Ration Card Type">
              <ChipGroup
                columns={4}
                value={formData.rationCard}
                onChange={(v) => update("rationCard", v)}
                options={[
                  { label: "None", value: "none" },
                  { label: "BPL", value: "bpl" },
                  { label: "AAY", value: "aay" },
                  { label: "PHH", value: "phh" },
                ]}
              />
            </Field>

            <Field label="Estimated Annual Family Income">
              <ChipGroup
                columns={3}
                value={formData.income}
                onChange={(v) => update("income", v)}
                options={[
                  { label: "Under ₹1L", value: "under_1l" },
                  { label: "₹1L–2.5L", value: "1l_to_2_5l" },
                  { label: "₹2.5L+", value: "above_2_5l" },
                ]}
              />
            </Field>

            <Field label="Housing Type">
              <ChipGroup
                columns={2}
                value={formData.housing}
                onChange={(v) => update("housing", v)}
                options={[
                  { label: "Kutcha (Mud/Thatch)", value: "kutcha" },
                  { label: "Pucca (Brick/Cement)", value: "pucca" },
                ]}
              />
            </Field>

            <Field label="Number of Rooms">
              <Stepper
                value={formData.rooms}
                onChange={(v) => update("rooms", v)}
                min={1}
                max={15}
              />
            </Field>

            <Field label="Family Members / Dependents">
              <Stepper
                value={formData.familyMembers}
                onChange={(v) => update("familyMembers", v)}
                min={1}
                max={25}
              />
            </Field>
          </Section>

          {/* SECTION 3: Occupation & Assets */}
          <Section
            id="occupation"
            title="Occupation & Assets"
            icon={<Briefcase className="w-5 h-5" />}
            isOpen={openSections.occupation}
            isComplete={occupationComplete}
            onToggle={toggleSection}
          >
            <Field label="Primary Occupation">
              <ChipGroup
                columns={2}
                value={formData.occupation}
                onChange={(v) => update("occupation", v)}
                options={[
                  { label: "Farmer", value: "farmer" },
                  { label: "Agri. Laborer", value: "agri_laborer" },
                  { label: "Artisan", value: "artisan" },
                  { label: "Street Vendor", value: "street_vendor" },
                  { label: "Unemployed", value: "unemployed" },
                  { label: "Other", value: "other" },
                ]}
              />
            </Field>
            {formData.occupation === "other" && (
  <Field label="Please specify your occupation">
    <input
      type="text"
      value={formData.occupationOther}
      onChange={(e) => update("occupationOther", e.target.value)}
      placeholder="e.g. Tailor, Driver, Shopkeeper"
      className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
    />
  </Field>
)}

            <Field label="Do you own agricultural land?">
              <YesNoToggle
                value={formData.landOwned}
                onChange={(v) => update("landOwned", v)}
              />
            </Field>

            {/* Conditional field — only rendered when landOwned === true */}
            {formData.landOwned === true && (
              <Field label="Land Owned (in Acres)">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={formData.landAcres}
                  onChange={(e) => update("landAcres", e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
            )}
          </Section>

          {/* SECTION 4: Health (optional) */}
          <Section
            id="health"
            title="Health & Vulnerabilities"
            icon={<HeartPulse className="w-5 h-5" />}
            isOpen={openSections.health}
            isComplete={healthComplete}
            optional
            onToggle={toggleSection}
          >
            <Field label="Disability Status (Divyangjan)">
              <YesNoToggle
                value={formData.disability}
                onChange={(v) => update("disability", v)}
              />
            </Field>

            <Field label="Chronic illness / pregnant woman in household">
              <YesNoToggle
                value={formData.chronicIllness}
                onChange={(v) => update("chronicIllness", v)}
              />
            </Field>
          </Section>

          {/* Save & Next */}
          <button
            type="button"
            onClick={handleSaveAndNext}
            disabled={!canSubmit || isSaving}
            className="mt-1 w-full min-h-[52px] rounded-xl bg-blue-700 text-white font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Next"
            )}
          </button>

          {!canSubmit && (
            <p className="text-xs text-center text-gray-400 -mt-2">
              Fill Demographic, Financial, and Occupation sections to continue
            </p>
          )}
        </div>
      </main>
    </div>
  );
}