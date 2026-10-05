"""Strip instance-specific internals from exported n8n workflows before publishing.

Removes:
  - webhookId            (instance-specific webhook id)
  - credentials          (credential references; re-select on import)
  - workflowId.value / .cachedResultUrl  (sub-workflow ids; re-link on import)

Run from the repo root:  python scripts/sanitize_workflows.py
"""

import glob
import json
import os

WORKFLOW_DIR = "workflows"


def strip(obj):
    if isinstance(obj, dict):
        obj.pop("webhookId", None)
        obj.pop("credentials", None)
        wf = obj.get("workflowId")
        if isinstance(wf, dict):
            wf.pop("value", None)
            wf.pop("cachedResultUrl", None)
        for value in obj.values():
            strip(value)
    elif isinstance(obj, list):
        for value in obj:
            strip(value)


def main():
    for path in sorted(glob.glob(os.path.join(WORKFLOW_DIR, "*.json"))):
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        strip(data)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        print("sanitized", os.path.basename(path))


if __name__ == "__main__":
    main()
