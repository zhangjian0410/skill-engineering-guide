#!/usr/bin/env python3
"""Compare fictional teaching cases with confirmed expectations. Python 3.9+."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
CASES = (
    ("normal", "2026-10-10", "2026-10-10.json", None),
    ("changed", "2026-10-11", "2026-10-11.json", None),
    ("missing-field", "2026-10-10", None, "缺字段"),
    ("conflicting-id", "2026-10-10", None, "重复 ID 内容冲突"),
)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compare(expected, actual):
    """Compare every confirmed field, including types; ignore optional new fields."""
    if not isinstance(actual, dict):
        return [{"field": "$", "expected": "object", "actual": actual}]
    differences = []
    for key, value in expected.items():
        found = actual.get(key)
        numeric = type(value) in (int, float) and type(found) in (int, float)
        if value != found or (type(value) is not type(found) and not numeric):
            differences.append({"field": key, "expected": value, "actual": found})
    return differences


def run_case(name, day, expected_file, stop_reason, pipeline, output):
    source = ROOT / "fixtures" / (name + ".json")
    target = output / name
    item = {"case": name, "date": day, "input_sha256": digest(source),
            "verdict": "UNKNOWN", "exit_code": None, "differences": []}
    expected = None
    if expected_file:
        expectation = ROOT / "expected" / expected_file
        expected = json.loads(expectation.read_text(encoding="utf-8"))
        item.update(expected=expected, expected_sha256=digest(expectation))
    else:
        item["expected"] = {"exit_code": "nonzero", "reason_contains": stop_reason,
                            "success_directory_exists": False}
    try:
        process = subprocess.run([sys.executable, str(pipeline), "--input", str(source),
                                  "--date", day, "--out", str(target)],
                                 capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired) as exc:
        item["reason"] = type(exc).__name__ + ": execution unavailable"
        return item
    item.update(exit_code=process.returncode, stdout=process.stdout, stderr=process.stderr)
    if stop_reason:
        checks = {"nonzero_exit": process.returncode != 0,
                  "explicit_reason": stop_reason in process.stderr,
                  "no_success_directory": not target.exists()}
        item.update(checks=checks, verdict="PASS" if all(checks.values()) else "FAIL")
        return item
    if process.returncode != 0:
        item.update(verdict="FAIL", reason="Expected a successful report")
        return item
    try:
        actual = json.loads((target / "report.json").read_text(encoding="utf-8"))
        evidence = json.loads((target / "evidence.json").read_text(encoding="utf-8"))
        differences = compare(expected, actual)
        checks = {"confirmed_fields_match": not differences,
                  "validation_pass": evidence.get("validation") == "PASS",
                  "text_report_present": (target / "report.txt").is_file(),
                  "input_bound": evidence.get("input_sha256") == item["input_sha256"],
                  "script_bound": evidence.get("script_sha256") == digest(pipeline)}
        item.update(actual=actual, differences=differences, checks=checks,
                    verdict="PASS" if all(checks.values()) else "FAIL")
    except (OSError, ValueError, AttributeError) as exc:
        item.update(verdict="FAIL", reason="Missing or invalid report/evidence: " + type(exc).__name__)
    return item


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="New directory outside the Skill package")
    parser.add_argument("--pipeline", type=Path, default=ROOT.parent / "scripts/pipeline.py",
                        help="Optional controlled teaching copy; never edits the selected script")
    args = parser.parse_args()
    output, pipeline = args.out.absolute(), args.pipeline.resolve()
    package = pipeline.parent.parent
    if output.exists() or output.is_symlink():
        parser.error("Output directory already exists; choose a new directory")
    if output.resolve() == package or package in output.resolve().parents:
        parser.error("Output must be outside the selected Skill package")
    if not pipeline.is_file():
        parser.error("Pipeline unavailable; no cases executed (UNKNOWN)")
    output.mkdir(parents=True, exist_ok=False)
    result = {"schema_version": 1, "course_version": "2.4",
              "started_at_utc": datetime.now(timezone.utc).isoformat(),
              "scope": "Fixed-script results and stopping; Agent discovery and migration UNKNOWN",
              "python": sys.version.split()[0], "script_sha256": digest(pipeline),
              "rules_sha256": digest(package / "references/business-rules.md"),
              "contract_sha256": digest(package / "references/data-contract.md"),
              "expectation_basis": "tests/expected/README.txt and confirmed references/business-rules.md",
              "cases": [run_case(*case, pipeline, output) for case in CASES]}
    verdicts = [case["verdict"] for case in result["cases"]]
    result["verdict"] = "FAIL" if "FAIL" in verdicts else "UNKNOWN" if "UNKNOWN" in verdicts else "PASS"
    # Keep logs portable: retain the actual tool messages with workspace prefixes removed.
    for case in result["cases"]:
        for field in ("stdout", "stderr"):
            if field in case:
                case[field] = case[field].replace(str(ROOT.parent), "ticket-daily-report").replace(str(output), "results")
    (output / "regression.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for case in result["cases"]:
        print(case["case"] + ": " + case["verdict"])
    print("Overall: " + result["verdict"])
    return 0 if result["verdict"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
