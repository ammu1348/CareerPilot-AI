"""Test-only helpers for generating small, text-based PDF fixtures."""


def build_text_pdf(text: str) -> bytes:
    """Create a standards-compliant one-page PDF without extra dependencies."""

    def escape_pdf_string(value: str) -> bytes:
        value = value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        value = value.replace("\r", " ").replace("\n", " ")
        return value.encode("latin-1", errors="replace")

    lines = text.splitlines() or [text]
    commands = [b"BT", b"/F1 11 Tf", b"50 760 Td", b"14 TL"]
    for index, line in enumerate(lines):
        if index:
            commands.append(b"T*")
        commands.extend([b"(" + escape_pdf_string(line) + b") Tj"])
    commands.append(b"ET")
    stream = b"\n".join(commands)

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length "
        + str(len(stream)).encode("ascii")
        + b" >>\nstream\n"
        + stream
        + b"\nendstream",
    ]

    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for object_number, body in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{object_number} 0 obj\n".encode("ascii"))
        output.extend(body)
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n".encode("ascii")
    )
    return bytes(output)
