import FormInput from "./FormInput";

export default function FamilyMembers({ field, value, members, error, onCountChange, onMemberChange }) {
  const count = Number(value) || 0;

  return (
    <div>
      <FormInput field={field} value={value} error={error} onChange={onCountChange} />

      {count > 0 && (
        <div className="mt-5 space-y-4">
          {Array.from({ length: count }).map((_, i) => {
            const member = members[i] || { name: "", age: "", relationship: "" };
            return (
              <div key={i} data-testid={`family-member-${i}`} className="rounded-md border border-slate-200 bg-navy-50/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Family Member {i + 1}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-navy-900">Name</span>
                    <input
                      data-testid={`family-member-${i}-name`}
                      type="text"
                      value={member.name}
                      onChange={(e) => onMemberChange(i, "name", e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/25 focus:border-navy-700"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-navy-900">Age</span>
                    <input
                      data-testid={`family-member-${i}-age`}
                      type="number"
                      value={member.age}
                      onChange={(e) => onMemberChange(i, "age", e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/25 focus:border-navy-700"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-navy-900">Relationship</span>
                    <input
                      data-testid={`family-member-${i}-relationship`}
                      type="text"
                      placeholder="e.g. Spouse, Child"
                      value={member.relationship}
                      onChange={(e) => onMemberChange(i, "relationship", e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/25 focus:border-navy-700"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
