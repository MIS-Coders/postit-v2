"""Apply current SOP publication state before any retrieved text reaches the model."""
import json
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

logger = logging.getLogger(__name__)


def _name(value):
    return re.sub(r"[^a-z0-9]+", " ", re.sub(r"\.pdf$", "", str(value).lower())).strip()


def filter_published_documents(documents, registry_file=None, today=None):
    registry_file = registry_file or os.environ.get("SOP_DATA_FILE", "/storage/sop-data.json")
    today = today or datetime.now(timezone(timedelta(hours=7))).date().isoformat()
    try:
        data = json.loads(Path(registry_file).read_text(encoding="utf-8"))
        rows = data["sopdoc"]
        by_id = {str(row["id"]): row for row in rows}
        departments = {row["id"]: row["nama_departement"] for row in data["departement"]}
    except (OSError, ValueError, KeyError, TypeError):
        logger.exception("Unable to verify SOP publication state")
        return []

    aliases = {}
    for row in rows:
        for value in (row.get("nama_dokumen"), row.get("file")):
            if value:
                aliases.setdefault(_name(value), set()).add(str(row["id"]))
    # Retain old names so renamed/deleted legacy embeddings are still recognized.
    for entry in data.get("audit", []):
        for state in (entry.get("before"), entry.get("after")):
            if state:
                aliases.setdefault(_name(state.get("nama_dokumen", "")), set()).add(str(entry["documentId"]))

    allowed = []
    for document in documents:
        metadata = document.metadata
        document_id = str(metadata.get("sop_doc_id") or "")
        source_file = str(metadata.get("source") or "").replace("\\", "/").split("/")[-1]
        if document_id:
            candidates = {document_id} if document_id in by_id else set()
        else:
            candidates = aliases.get(_name(source_file), set()) | aliases.get(_name(metadata.get("document_name", "")), set())
            if len(candidates) > 1 and metadata.get("department"):
                candidates = {key for key in candidates if departments.get(by_id[key]["departement_id"]) == metadata["department"]}
            # Revisions are always embedded with sop_doc_id, so legacy chunks belong to the original.
            if len(candidates) > 1:
                candidates = {key for key in candidates if not by_id[key].get("replaces_id")}
        if len(candidates) != 1:
            continue
        row = by_id[next(iter(candidates))]
        hidden = row.get("tgl_hide") and row["tgl_hide"] <= today
        if row.get("deleted_at") or hidden or (row.get("tgl_berlaku") or "") > today:
            continue
        # Replaced PDFs must not return old chunks while re-indexing is pending.
        if (row.get("content_updated_at") or str(metadata.get("source", "")).startswith("sop/")) and source_file != row.get("file"):
            continue
        metadata.update({"sop_doc_id": str(row["id"]), "type_doc": row["type_doc"], "document_name": row["nama_dokumen"], "document_number": row["no_dokumen"], "department": departments.get(row["departement_id"])})
        allowed.append(document)
    return allowed
