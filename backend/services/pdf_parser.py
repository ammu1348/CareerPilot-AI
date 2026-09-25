import pdfplumber

def extract_text(pdf_path: str) -> str:
    """Extract readable text from a PDF file safely."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if not pdf.pages:
                return ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return ""

    return text.strip()