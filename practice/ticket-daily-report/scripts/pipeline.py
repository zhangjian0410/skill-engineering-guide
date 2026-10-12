#!/usr/bin/env python3
"""Local-only fictional teaching example. Python 3.9+, standard library only."""
import argparse
from collections import Counter
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile
import uuid

FIELDS = ("ticket_id", "created_date", "status", "minutes")
# A bounded 32-bit teaching interface keeps two-decimal averages representable.
MAX_MINUTES = 2**31 - 1

def strict_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("日期必须为 YYYY-MM-DD")
    date.fromisoformat(value)
    return value

def inspect(raw):
    if not isinstance(raw, list):
        raise ValueError("输入必须是 JSON 数组")
    unique = {}
    duplicates = 0
    for index, row in enumerate(raw, 1):
        if not isinstance(row, dict):
            raise ValueError(f"第 {index} 行不是工单对象")
        missing = [key for key in FIELDS if key not in row]
        if missing:
            raise ValueError(f"第 {index} 行缺字段：{', '.join(missing)}")
        item = {key: row[key] for key in FIELDS}
        if not isinstance(item["ticket_id"], str) or not item["ticket_id"].strip():
            raise ValueError(f"第 {index} 行 ticket_id 必须是非空字符串")
        item["ticket_id"] = item["ticket_id"].strip()
        strict_date(item["created_date"])
        if item["status"] not in ("completed", "open"):
            raise ValueError(f"第 {index} 行 status 不支持")
        minutes = item["minutes"]
        if type(minutes) is not int or not 0 <= minutes <= MAX_MINUTES:
            raise ValueError(f"第 {index} 行 minutes 必须是 0 到 {MAX_MINUTES} 的整数")
        if (item["status"] == "completed" and minutes == 0) or (item["status"] == "open" and minutes != 0):
            raise ValueError(f"第 {index} 行 minutes 与 status 不一致")
        key = item["ticket_id"]
        if key in unique:
            if item != unique[key]:
                raise ValueError(f"第 {index} 行存在重复 ID 内容冲突")
            duplicates += 1
        else:
            unique[key] = item
    return list(unique.values()), duplicates

def average(total, count):
    return float((Decimal(total) / count).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if count else None

def transform(rows, day):
    scoped = [row for row in rows if row["created_date"] == day]
    done = [row for row in scoped if row["status"] == "completed"]
    minutes = sum(row["minutes"] for row in done)
    report = {"date": day, "total": len(scoped), "completed": len(done),
              "open": len(scoped) - len(done), "completed_minutes": minutes,
              "average_completed_minutes": average(minutes, len(done))}
    return report

def verify(report, rows, day, input_count, duplicates):
    counts = Counter()
    minutes = 0
    excluded = 0
    for row in rows:
        if row["created_date"] != day:
            excluded += 1
            continue
        counts[row["status"]] += 1
        if row["status"] == "completed":
            minutes += row["minutes"]
    expected = {"date": day, "total": sum(counts.values()), "completed": counts["completed"],
                "open": counts["open"], "completed_minutes": minutes,
                "average_completed_minutes": average(minutes, counts["completed"])}
    if report != expected or input_count != duplicates + excluded + report["total"]:
        raise ValueError("结果校验失败")
    return excluded

def sha(data):
    return hashlib.sha256(data).hexdigest()

def run(input_path, day, out):
    started = datetime.now(timezone.utc).isoformat()
    strict_date(day)
    source = input_path.read_bytes()
    rows, duplicates = inspect(json.loads(source.decode("utf-8-sig")))
    report = transform(rows, day)
    excluded = verify(report, rows, day, len(json.loads(source.decode("utf-8-sig"))), duplicates)
    root = Path(__file__).resolve().parent.parent
    evidence = {"run_id": str(uuid.uuid4()), "skill_version": "1.0", "started_at_utc": started,
                "input_file": input_path.name, "input_sha256": sha(source),
                "script_sha256": sha(Path(__file__).read_bytes()),
                "rules_sha256": sha((root / "references/business-rules.md").read_bytes()),
                "contract_sha256": sha((root / "references/data-contract.md").read_bytes()),
                "date": day, "input_count": len(json.loads(source.decode("utf-8-sig"))),
                "duplicates_removed": duplicates, "out_of_date_removed": excluded,
                "output_count": report["total"], "validation": "PASS"}
    avg = report["average_completed_minutes"]
    avg_text = "无完成工单，平均耗时不可用" if avg is None else f"完成单平均耗时 {avg:.2f} 分钟"
    if out.exists() or out.is_symlink():
        raise FileExistsError("输出目录已存在，请指定新目录")
    out.parent.mkdir(parents=True, exist_ok=True)
    # A cooperative exclusive lock prevents concurrent runs publishing to one path.
    lock = out.parent / f".{out.name}.publish-lock"
    with lock.open("x"):
        try:
            with tempfile.TemporaryDirectory(prefix=".ticket-daily-report-", dir=out.parent) as tmp:
                staged = Path(tmp) / "result"
                staged.mkdir()
                for name, obj in (("report.json", report), ("evidence.json", evidence)):
                    (staged / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                (staged / "report.txt").write_text(
                    f"工单日报（创建日期口径） {day}\n总计 {report['total']} 单，完成 {report['completed']} 单，待处理 {report['open']} 单。\n{avg_text}。\n教学虚构数据。\n", encoding="utf-8")
                if out.exists() or out.is_symlink():
                    raise FileExistsError("输出目录已存在，请指定新目录")
                # All files are complete before the result directory becomes visible.
                staged.rename(out)
        finally:
            lock.unlink()
    return evidence

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--date", required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    try:
        evidence = run(args.input, args.date, args.out)
    except (ValueError, OSError, UnicodeError) as exc:
        print(f"STOP: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(evidence, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    sys.exit(main())
