import Link from "next/link";
import { START_BULLETS, START_HEADING, START_LEAD } from "./trustCopy";

export function BeforeYouStart({ heading = true }: { heading?: boolean }) {
  return (
    <div>
      {heading ? (
        <h2 id="ack-title" className="type-title text-[1.5rem]">
          {START_HEADING}
        </h2>
      ) : (
        <h3 className="type-title text-[1.35rem]">{START_HEADING}</h3>
      )}
      <p className="mt-4 text-sm font-medium leading-6">{START_LEAD}</p>
      <ul className="mt-4 space-y-3 text-sm leading-6">
        {START_BULLETS.map((item) => (
          <li key={item.label}>
            <span className="font-medium">{item.label}</span>{" "}
            {item.label === "Not the government." ? (
              <GovernmentLine />
            ) : item.label === "Some situations need a lawyer." ? (
              <LawyerLine />
            ) : (
              item.body
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GovernmentLine() {
  return (
    <>
      AOS is not affiliated with, endorsed by, or connected to USCIS, the Department of Homeland Security, or any government agency. Blank forms and instructions are free at{" "}
      <a className="underline decoration-foreground/30 underline-offset-4" href="https://www.uscis.gov/forms">
        uscis.gov/forms
      </a>
      , and you don&apos;t need AOS to file.
    </>
  );
}

function LawyerLine() {
  return (
    <>
      If any of the items in our{" "}
      <Link className="underline decoration-foreground/30 underline-offset-4" href="/start">
        &quot;Talk to an attorney first&quot; list
      </Link>{" "}
      apply to you, please talk to a licensed immigration attorney or a DOJ-accredited representative before filing.
    </>
  );
}
