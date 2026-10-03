"""Render a filled PDF to page images.

The preview response is images only. PDF bytes stay on the download
endpoints, which require an acknowledgement.
"""

from __future__ import annotations

import base64
import io


def render_pdf_pages(pdf_bytes: bytes) -> list[str]:
    import pypdfium2 as pdfium

    document = pdfium.PdfDocument(pdf_bytes)
    try:
        try:
            document.init_forms()
        except Exception:
            pass
        pages: list[str] = []
        for index in range(len(document)):
            page = document[index]
            bitmap = page.render(scale=1, may_draw_forms=True)
            image = bitmap.to_pil()
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=40, optimize=True)
            pages.append(base64.b64encode(buffer.getvalue()).decode("ascii"))
            page.close()
        return pages
    finally:
        document.close()
