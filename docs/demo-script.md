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
2. `/start` is the attorney list, headed "Talk to an attorney before filing
   if any of these apply." It does not say whether the person can file.
   Back to my forms.
3. Check the box on "Before you start" and continue. Find legal help instead
   returns to that attorney list.
4. Choose nothing yourself, or press **Load demo**. If the tab already has
   answers, confirm before they are replaced. The demo selects every form
   in the list, including G-1145.
5. The sidebar lists the selected forms. The automated check on the hub is
   empty for the demo.
6. Open **Review**. The lifecycle rail highlights Review. Key facts say
   **Fictional demo**. The five-year address and employment bars run from
   October 2021 through the current month. Specialist review and attorney
   review say coming soon.
7. Open **USCIS fees**. Paper is $3,005. Online is $2,855. The service fee
   is $0. The source is Form G-1055, edition 10/01/26. I-765 is $260 with a
   pending I-485 filed on or after 4/1/2024 (Appendix C). I-131 is $630
   paper / $580 online with a pending I-485 (Appendix B).
8. Open **Documents**. The list follows the demo answers. A chosen file
   keeps its name only. Nothing is marked accepted.
9. **Preview** is the only filled button in the header. It shows page images
   of the selected mapped forms. There is no PDF viewer and no save control
   on those images. The family names on the I-130 images are Sampleton and
   Exampleton.
10. **Download my forms (PDF)** is inside that preview. It stays disabled
    until all four boxes under "Before you download" are checked. The zip is
    `aos-packet.zip`. The read-me says these are drafts and that AOS does not
    file them. I-130, I-130A, I-485, I-765, and I-131 are in the zip. I-864
    and G-1145 are named as not filled. I-864 has no official PDF in
    `Forms/` yet.

## What not to claim

- Do not say the person is eligible, recommended, or ready to file.
- Do not say a document was accepted.
- Do not say the packet was submitted to USCIS.
- Do not say Social Security numbers are encrypted. Preview and download
  post the answers, including the SSN and A-Number, to the local PDF service
  in plaintext. The account work that routes fills through a server proxy is
  not in this demo.
