import {
  DEMO_BANNER,
  demoAddresses,
  demoBeneficiary,
  demoEmployment,
  demoPetitioner,
} from "@/app/lib/demoCouple";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
          Fake sample
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">{title}</h1>
        <p className="text-muted-foreground text-sm max-w-xl mt-2">{DEMO_BANNER}</p>
      </div>
      {children}
    </div>
  );
}

export function DemoPetitionerView() {
  const rows = [
    ["Petitioner", `${demoPetitioner.givenName} ${demoPetitioner.familyName}`],
    ["Beneficiary", `${demoBeneficiary.givenName} ${demoBeneficiary.familyName}`],
    ["Relationship", demoBeneficiary.relationship],
    ["Email", demoPetitioner.email],
    ["Phone", demoPetitioner.phone],
    ["Social Security number", demoPetitioner.ssnMask],
    ["A-Number", demoPetitioner.aNumberMask],
  ];
  return (
    <Shell title="Demo couple">
      <dl className="border border-border rounded-xl divide-y divide-border bg-card">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 gap-4 px-6 py-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd data-dd-privacy="hidden">{value}</dd>
          </div>
        ))}
      </dl>
    </Shell>
  );
}

export function DemoAddressView({ who }: { who: "Alex Demo" | "Jamie Demo" }) {
  const rows = demoAddresses.filter((row) => row.who === who);
  return (
    <Shell title={`${who} address history`}>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.street} className="border border-border rounded-xl p-4 bg-card text-sm">
            {row.street}, {row.city}, {row.state} {row.zip}
            <span className="block text-muted-foreground">
              {row.from} to {row.to}. Sample only.
            </span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function DemoEmploymentView() {
  return (
    <Shell title="Demo employment">
      <p className="border border-border rounded-xl p-4 bg-card text-sm">
        {demoEmployment.who} · {demoEmployment.jobTitle} at {demoEmployment.employerName},{" "}
        {demoEmployment.city}. {demoEmployment.from} to {demoEmployment.to}. Sample only.
      </p>
    </Shell>
  );
}
