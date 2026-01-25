Title: Product Guidance

Purpose
This file captures product guidance for building a friendly, low-stress intake
experience for marriage-based Adjustment of Status flows. This is not legal
advice. Always defer to official USCIS instructions and forms.
All Notion notes should be added under the AOS Notion page in tawsif/AOS.

Principles
- Use simple, human language; avoid form jargon where possible.
- Prefer step-by-step flows over long forms.
- Make gaps explainable rather than blocking.
- Allow estimated dates with a clear “confirm later” path.
- Minimize re-entry: cache locally, autosave, and let users resume.
- Clearly label sensitive/critical fields and why they matter.

Data Collection Guidance
- Collect timeline history for the last 5 years (addresses + employment).
- If gaps exist, prompt gently for an explanation (e.g., unemployed, student,
  caregiver, travel).
- Use month/year by default; day is optional unless required by the form.
- Provide a review step that highlights gaps and missing fields.

User Experience Tactics
- Start with “current” address and current employment.
- Move backward in time using “Before that…” prompts.
- Show a visual timeline to reduce confusion about order.
- Offer auto-complete for addresses (e.g., Google Places) to reduce typing.

Content Notes
- Avoid claiming to be an attorney or giving legal advice.
- Use language like “Based on common USCIS instructions…” and link to sources.
- Provide reminders: “Please verify against the official USCIS instructions.”

Developer Notes
- It is okay to use curl for debugging API endpoints.
- It's fine to use curl for local API debugging when needed. or to look up stuff

PDF Checkbox Handling
- Checkbox on-values vary by form. Common values: `/Yes`, `/Y`, `/On`, `/1`, or custom names.
- To debug a checkbox field, use: `GET /debug/field/{slug}?name={field_name}` (URL-encode brackets: `%5B` and `%5D`).
- The debug output shows `/AP` (appearance) dictionary with `/N` (normal) and `/D` (down) states. The on-value is any key in `/N` or `/D` that isn't `/Off`.
- For radio button groups (Yes/No pairs):
  - Set the selected widget's `/V` and `/AS` to the on-value (e.g., `/Y`).
  - Set the parent's `/V` to the same on-value.
  - Set all sibling widgets' `/AS` to `/Off`.
- For I-130 specifically, Yes/No fields use different on-values: `_Yes[0]` fields use `/Y`, `_No[0]` fields use `/N` (hardcoded in `_apply_leaf_value`).
- Always set `/NeedAppearances` to `True` on the AcroForm root before saving.