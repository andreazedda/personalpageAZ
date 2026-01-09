from __future__ import annotations

import re
from pathlib import Path

from pypdf import PdfReader

PDF_PATH = Path(__file__).resolve().parents[1] / "resources" / "Annual Report (Andrea Zedda).pdf"

KEYWORDS = [
    "DoMoMEA",
    "telerehab",
    "telerehabilitation",
    "Android TV",
    "TV box",
    "Unity",
    "Unity3D",
    "MUSE",
    "221e",
    "IMU",
    "pressure",
    "Bluetooth",
    "classic",
    "Django",
    "PostgreSQL",
    "Nginx",
    "Gunicorn",
    "store-and-forward",
    "SUS",
    "QUEST",
    "SIAMOC",
    "poster",
    "consortium",
    "Cereatti",
    "Sassari",
    "random",
    "RCT",
    "8 weeks",
    "5 days",
]

RE_PHONE = re.compile(r"\b\+?\d[\d\s().-]{7,}\d\b")


def redact_pii(text: str) -> str:
    # Redact phone-like strings. (Email is kept out by not printing headers.)
    return RE_PHONE.sub("[REDACTED_NUMBER]", text)


def pdf_text() -> str:
    reader = PdfReader(str(PDF_PATH))
    parts: list[str] = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(parts)


def main() -> int:
    if not PDF_PATH.exists():
        raise SystemExit(f"Missing: {PDF_PATH}")

    text = pdf_text()
    text = redact_pii(text)

    # Split into pseudo-lines for grepping.
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    # Print keyword hits with a small context window.
    patterns = [re.compile(re.escape(k), re.IGNORECASE) for k in KEYWORDS]

    hits = 0
    for i, ln in enumerate(lines):
        if any(p.search(ln) for p in patterns):
            hits += 1
            start = max(0, i - 1)
            end = min(len(lines), i + 2)
            ctx = " | ".join(lines[start:end])
            print(f"- {ctx}")

    print(f"\nTotal hits: {hits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
