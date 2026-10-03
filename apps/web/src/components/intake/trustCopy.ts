export const START_HEADING = "Before you start";

export const START_LEAD =
  "AOS is self-help software. It is not a law firm, and it is not a substitute for the advice of an attorney.";

export const START_BULLETS = [
  {
    label: "No legal advice.",
    body: "AOS gives general information taken from official USCIS instructions and copies the answers you type into the USCIS forms you choose. AOS does not tell you whether you qualify, which forms to file, or how to answer a question about your situation.",
  },
  {
    label: "No attorney-client relationship.",
    body: "Using AOS does not make AOS or anyone at AOS your lawyer or representative. Nobody at AOS will sign your forms as your representative or contact USCIS for you.",
  },
  {
    label: "You're in charge.",
    body: "You choose your forms, you give every answer, and you're responsible for checking that everything is true and complete before you sign and file.",
  },
  {
    label: "Not the government.",
    body: "AOS is not affiliated with, endorsed by, or connected to USCIS, the Department of Homeland Security, or any government agency. Blank forms and instructions are free at uscis.gov/forms, and you don't need AOS to file.",
  },
  {
    label: "Some situations need a lawyer.",
    body: 'If any of the items in our "Talk to an attorney first" list apply to you, please talk to a licensed immigration attorney or a DOJ-accredited representative before filing.',
  },
] as const;

export const START_CHECKBOX =
  "I understand that AOS is not a law firm, does not give legal advice, and is not a substitute for the advice of an attorney.";

export const DOWNLOAD_HEADING = "Before you download";

export const DOWNLOAD_LEAD =
  "These forms were filled in from the answers you gave. AOS did not review them for legal accuracy.";

export const DOWNLOAD_BOXES = [
  "I chose these forms myself, and I gave every answer in them.",
  "I will read every page and check each answer against the official USCIS instructions before I sign. I understand I'm signing under penalty of perjury that everything is true and complete.",
  "I understand AOS is not a law firm, did not give me legal advice, and is not a substitute for the advice of an attorney, and that AOS is not affiliated with USCIS or any government agency.",
  "I understand I must sign the forms myself, pay the USCIS fees, and file them myself. AOS does not file anything for me.",
] as const;

export const PREPARER_NOTE =
  'About the "preparer" section: USCIS forms have a section for anyone who helped prepare the form. AOS leaves it blank. Read the USCIS instructions for that section and complete it truthfully if anyone helped you.';
