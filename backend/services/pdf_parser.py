"""Small, bounded PDF text extraction helpers."""

import io
import logging
from pathlib import Path
from typing import BinaryIO

import pdfplumber

logger = logging.getLogger(__name__)
MAX_PDF_PAGES = 40
MAX_EXTRACTED_CHARACTERS = 100_000
PdfSource = str | Path | bytes | bytearray | BinaryIO


def extract_text(source: PdfSource) -> str:
    """Extract selectable text from a PDF path or in-memory byte stream.

    The API passes bytes so uploaded resumes are never written to disk. The
    path-like input remains supported for local scripts and backwards
    compatibility with existing callers.
    """
    try:
        stream = (
            io.BytesIO(bytes(source))
            if isinstance(source, (bytes, bytearray))
            else source
        )
        with pdfplumber.open(stream) as pdf:
            if not pdf.pages:
                return ""

            pages_text = []
            total_characters = 0
            for page in pdf.pages[:MAX_PDF_PAGES]:
                remaining = MAX_EXTRACTED_CHARACTERS - total_characters
                if remaining <= 0:
                    break
                page_text = page.extract_text() or ""
                page_text = page_text[:remaining]
                if page_text.strip():
                    pages_text.append(page_text)
                    total_characters += len(page_text)

            return "\n".join(pages_text).strip()
    except Exception as exc:  # noqa: BLE001 - PDF parser exceptions vary by input/library
        # Do not log the resume text or user-supplied filename.
        logger.info("PDF text extraction failed (%s)", type(exc).__name__)
        return ""
