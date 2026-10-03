# Demo script

Marriage-based adjustment of status. The people in the demo are fictional.
Jordan Sampleton and Avery Exampleton are not real, and the identifiers are
`000-00-0000` and `A000000000` / `A000000001`.

AOS is self-help software. It is not a law firm, it is not a substitute for
the advice of an attorney, and it is not affiliated with USCIS. It does not
decide whether someone can file, and it does not submit forms to USCIS.

## Run it

```bash
bun install

# terminal 1
cd apps/api && npm run dev

# terminal 2, from apps/web
npx next dev
```

The API is `http://localhost:8000`. The site is `http://localhost:3000`.
Leave `NEXT_PUBLIC_CONVEX_URL` unset. Answers then stay in the browser tab.
A full reload clears them. Load demo again.

`bun run dev` from the repo root also starts Convex, which needs a Convex
login. The path above does not.

## Walkthrough

1. Open `/`. The button goes to `/start`. The short line under it is the
   disclaimer. The full text is in the footer.
2. `/start` lists topics people take to an attorney. It does not say whether
   the person can file. Continue to the forms.
3. Check the box on the disclaimer and continue.
4. Choose nothing yourself, or press **Load demo**. The demo selects every
   form in the list, including G-1145.
5. The sidebar lists the selected forms. The automated check on the hub is
   empty for the demo.
6. Open **Review**. Key facts say **Fictional demo**. The five-year address
   and employment bars run from October 2021 through the current month.
   Specialist review and attorney review say coming soon.
7. Open **USCIS fees**. Paper is $3,005. Online is $2,855. The service fee
   is $0. The source is Form G-1055, edition 10/01/26.
8. Open **Documents**. The list follows the demo answers. A chosen file
   keeps its name only. Nothing is marked accepted.
9. **Preview my forms** shows the I-130 draft. The family names are
   Sampleton and Exampleton.
10. **Download my forms (PDF)** stays disabled until all four boxes are
    checked. The zip is `aos-packet.zip`. The read-me says these are drafts
    and that AOS does not file them. I-130, I-130A, I-485, I-765, and I-131
    are in the zip. I-864 and G-1145 are named as not filled. I-864 has no
    official PDF in `Forms/` yet.

## What not to claim

- Do not say the person is eligible, recommended, or ready to file.
- Do not say a document was accepted.
- Do not say the packet was submitted to USCIS.
- Do not say Social Security numbers are encrypted. That arrives with the
  account work, which is not in this demo.
