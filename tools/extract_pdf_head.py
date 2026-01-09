from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def head_of_pdf(path: Path, pages: int = 2, chars: int = 800) -> str:
    reader = PdfReader(str(path))
    txt = []
    for i in range(min(pages, len(reader.pages))):
        try:
            t = reader.pages[i].extract_text() or ""
        except Exception:
            t = ""
        txt.append(t)
    one_line = " ".join(" ".join(txt).split())
    return one_line[:chars]


def main() -> int:
    resources = Path(__file__).resolve().parents[1] / "resources"
    pdfs = [
        resources / "Annual Report (Andrea Zedda).pdf",
        resources / "Annual Report (Andrea Zedda) - secondo anno.pdf",
        resources / "Final Report (Andrea Zedda) v7.pdf",
    ]

    for p in pdfs:
        if not p.exists():
            continue
        reader = PdfReader(str(p))
        meta = reader.metadata
        print(f"\n=== {p.name} ===")
        print(f"pages: {len(reader.pages)}")
        if meta:
            print(f"meta.title: {getattr(meta, 'title', None)}")
            print(f"meta.subject: {getattr(meta, 'subject', None)}")
        print("head:")
        print(head_of_pdf(p))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
