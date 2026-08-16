export default function GovFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-navy-950 text-navy-100">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-display text-sm font-semibold text-white">National Scheme Services Portal</p>
            <p className="mt-1.5 text-xs leading-relaxed opacity-70">
              This is a simulated environment built for demonstration purposes only. It is not affiliated with,
              and does not represent, any real government website.
            </p>
          </div>
          <div className="text-xs opacity-80">
            <p className="mb-2 font-semibold uppercase tracking-wide opacity-90">Helpline (Demo)</p>
            <p>1800-000-0000 (Toll-free)</p>
            <p>support@demo-schemes.gov.example</p>
          </div>
          <div className="text-xs opacity-80">
            <p className="mb-2 font-semibold uppercase tracking-wide opacity-90">Quick Links</p>
            <p>Applicant Guide</p>
            <p>FAQs</p>
            <p>Grievance Redressal</p>
          </div>
        </div>
        <p className="mt-6 border-t border-white/10 pt-4 text-[11px] opacity-50">
          © {new Date().getFullYear()} Mock Government Scheme Portals — Built for the YojanaMitra hackathon prototype.
        </p>
      </div>
    </footer>
  );
}
