#!/usr/bin/env python3
"""Lightweight validator for data/profile.json.

- Validates strict JSON parse.
- Checks a small set of structural invariants used by js/profile.js.

No external dependencies.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def _is_localized(value: Any) -> bool:
    return isinstance(value, dict) and ("en" in value or "it" in value)


def _err(errors: list[str], message: str) -> None:
    errors.append(message)


def validate(profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    if not isinstance(profile, dict):
        return ["Root JSON value must be an object"]

    for key in ("person", "i18n", "projects"):
        if key not in profile:
            _err(errors, f"Missing required top-level key: {key}")

    i18n = profile.get("i18n")
    if i18n is not None and not isinstance(i18n, dict):
        _err(errors, "i18n must be an object")
    elif isinstance(i18n, dict):
        for lang in ("en", "it"):
            if lang not in i18n:
                _err(errors, f"i18n missing language: {lang}")
            elif not isinstance(i18n[lang], dict):
                _err(errors, f"i18n.{lang} must be an object")

    projects = profile.get("projects")
    if projects is not None and not isinstance(projects, list):
        _err(errors, "projects must be an array")
    elif isinstance(projects, list):
        seen_ids: set[str] = set()
        for idx, proj in enumerate(projects):
            if not isinstance(proj, dict):
                _err(errors, f"projects[{idx}] must be an object")
                continue
            pid = proj.get("id")
            if not isinstance(pid, str) or not pid.strip():
                _err(errors, f"projects[{idx}].id must be a non-empty string")
            elif pid in seen_ids:
                _err(errors, f"Duplicate projects[].id: {pid}")
            else:
                seen_ids.add(pid)

            contained = proj.get("contained")
            if contained is not None:
                if not isinstance(contained, list):
                    _err(errors, f"projects[{idx}].contained must be an array")
                else:
                    for cidx, item in enumerate(contained):
                        if not isinstance(item, dict):
                            _err(errors, f"projects[{idx}].contained[{cidx}] must be an object")
                            continue
                        if not isinstance(item.get("name"), (str, dict)):
                            _err(errors, f"projects[{idx}].contained[{cidx}].name must be string or localized object")
                        if "tagline" in item and not isinstance(item.get("tagline"), (str, dict)):
                            _err(errors, f"projects[{idx}].contained[{cidx}].tagline must be string or localized object")

            spec = proj.get("spec")
            if spec is not None:
                if not isinstance(spec, dict):
                    _err(errors, f"projects[{idx}].spec must be an object")
                else:
                    # Only validate types; content is intentionally flexible.
                    if "status" in spec and not isinstance(spec["status"], str):
                        _err(errors, f"projects[{idx}].spec.status must be a string")
                    for loc_key in ("boundary", "purpose"):
                        if loc_key in spec and not (_is_localized(spec[loc_key]) or isinstance(spec[loc_key], str)):
                            _err(errors, f"projects[{idx}].spec.{loc_key} must be string or localized object")
                    for list_key in ("inputs", "outputs", "reuse", "constraints", "current_focus"):
                        if list_key in spec and not isinstance(spec[list_key], list):
                            _err(errors, f"projects[{idx}].spec.{list_key} must be an array")

    contexts = profile.get("contexts")
    if contexts is not None:
        if not isinstance(contexts, dict):
            _err(errors, "contexts must be an object")
        else:
            if "disclaimer" in contexts and not (_is_localized(contexts["disclaimer"]) or isinstance(contexts["disclaimer"], str)):
                _err(errors, "contexts.disclaimer must be string or localized object")
            for list_key in ("direct_work", "operational_exposure"):
                if list_key in contexts and not isinstance(contexts[list_key], list):
                    _err(errors, f"contexts.{list_key} must be an array")

    reading = profile.get("reading")
    if reading is not None:
        if not isinstance(reading, dict):
            _err(errors, "reading must be an object")
        else:
            domains = reading.get("domains")
            if domains is not None and not isinstance(domains, list):
                _err(errors, "reading.domains must be an array")

    phd_extract = profile.get("phd_extract")
    if phd_extract is None:
        _err(errors, "Missing required top-level key: phd_extract")
    elif not isinstance(phd_extract, dict):
        _err(errors, "phd_extract must be an object")
    else:
        required_arrays = (
            "research_objective",
            "architecture_stack",
            "innovation",
            "validation_plan",
            "engineering_challenges",
            "dissemination",
            "training_teaching",
        )
        source = phd_extract.get("source")
        if source is None or not isinstance(source, dict):
            _err(errors, "phd_extract.source must be an object")
        for key in required_arrays:
            value = phd_extract.get(key)
            if value is None:
                _err(errors, f"phd_extract missing required key: {key}")
            elif not isinstance(value, list) or not all(isinstance(x, str) for x in value):
                _err(errors, f"phd_extract.{key} must be an array of strings")

    proof = profile.get("proof")
    if isinstance(proof, dict) and isinstance(proof.get("categories"), list):
        domomea_items: list[dict[str, Any]] = []
        for group in proof["categories"]:
            if not isinstance(group, dict):
                continue
            items = group.get("items")
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict):
                    continue
                label = item.get("label")
                label_en = label.get("en") if isinstance(label, dict) else label
                if isinstance(label_en, str) and "domomea" in label_en.lower():
                    domomea_items.append(item)

        if not domomea_items:
            _err(errors, "proof.categories must include a DoMoMEA evidence item")
        else:
            for idx, item in enumerate(domomea_items):
                bullets = item.get("bullets")
                if not isinstance(bullets, list) or not all(isinstance(x, str) for x in bullets):
                    _err(errors, f"DoMoMEA proof item #{idx + 1} bullets must be an array of strings")
                else:
                    if not (6 <= len(bullets) <= 10):
                        _err(errors, f"DoMoMEA proof item #{idx + 1} bullets must have 6–10 items")
                if not isinstance(item.get("source"), (str, dict)):
                    _err(errors, f"DoMoMEA proof item #{idx + 1} source must be a string or localized object")

    if isinstance(projects, list):
        bmi = next((p for p in projects if isinstance(p, dict) and p.get("id") == "bmi"), None)
        if bmi is None:
            _err(errors, "projects must include id=bmi")
        else:
            evidence = bmi.get("evidence_bullets")
            if evidence is not None:
                if not isinstance(evidence, list) or not all(isinstance(x, str) for x in evidence):
                    _err(errors, "projects[id=bmi].evidence_bullets must be an array of strings")
                elif not (4 <= len(evidence) <= 8):
                    _err(errors, "projects[id=bmi].evidence_bullets must have 4–8 items")

    return errors


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    profile_path = repo_root / "data" / "profile.json"

    try:
        raw = profile_path.read_text(encoding="utf-8")
    except OSError as e:
        print(f"ERROR: failed to read {profile_path}: {e}", file=sys.stderr)
        return 2

    try:
        profile = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON in {profile_path}")
        print(f"  {e.msg} at line {e.lineno}, column {e.colno} (char {e.pos})")
        return 1

    errors = validate(profile)
    if errors:
        print(f"ERROR: schema checks failed for {profile_path}:")
        for msg in errors:
            print(f"- {msg}")
        return 1

    print(f"OK: {profile_path} is valid JSON and passed basic schema checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
