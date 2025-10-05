import json
from pathlib import Path

FALLBACK_PATH = Path(__file__).parent / "fallback.json"
MIN_SECTION_ID = 100000
MAX_SECTION_ID = 999999  # full six-digit range supported by four-character Base69

def load_fallback(path: Path):
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)

def analyze_section_ids(data):
    section_ids = []
    invalid_entries = []

    for entry in data:
        section_id = entry.get("sectionId")
        if isinstance(section_id, int):
            section_ids.append(section_id)
            if not (MIN_SECTION_ID <= section_id <= MAX_SECTION_ID):
                invalid_entries.append({
                    "sectionId": section_id,
                    "courseCode": entry.get("courseCode"),
                    "sectionName": entry.get("sectionName")
                })
        else:
            invalid_entries.append({
                "sectionId": section_id,
                "courseCode": entry.get("courseCode"),
                "sectionName": entry.get("sectionName"),
                "issue": "Missing or non-integer sectionId"
            })

    if not section_ids:
        raise ValueError("No valid sectionId values found in the dataset.")

    return {
        "count": len(section_ids),
        "min": min(section_ids),
        "max": max(section_ids),
        "invalid": invalid_entries
    }

def format_report(stats):
    lines = [
        "Section ID Analysis",
        "====================",
        f"Total entries checked: {stats['count']}",
        f"Minimum sectionId: {stats['min']}",
        f"Maximum sectionId: {stats['max']}",
        f"Expected range: {MIN_SECTION_ID} - {MAX_SECTION_ID}",
        ""
    ]

    if stats["invalid"]:
        lines.append(f"Out-of-range or invalid section IDs ({len(stats['invalid'])}):")
        for item in stats["invalid"][:50]:  # limit output for readability
            lines.append(
                f"  - sectionId={item.get('sectionId')} "
                f"courseCode={item.get('courseCode')} "
                f"sectionName={item.get('sectionName')} "
                f"issue={item.get('issue', 'out of range')}"
            )
        if len(stats["invalid"]) > 50:
            lines.append("  ... (truncated)")
    else:
        lines.append("All section IDs fall within the expected range.")

    return "\n".join(lines)

def main():
    data = load_fallback(FALLBACK_PATH)
    stats = analyze_section_ids(data)
    print(format_report(stats))

if __name__ == "__main__":
    main()
