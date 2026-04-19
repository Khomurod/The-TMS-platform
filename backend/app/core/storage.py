import logging
import os
import uuid
from typing import Optional
from fastapi import HTTPException, UploadFile
from app.config import settings
from app.models.base import EntityType

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
}
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "tiff"}

def _get_gcs_client():
    from google.cloud import storage
    try:
        if settings.gcs_credentials_json:
            import json
            from google.oauth2 import service_account
            creds_dict = json.loads(settings.gcs_credentials_json)
            credentials = service_account.Credentials.from_service_account_info(creds_dict)
            return storage.Client(credentials=credentials)
        return storage.Client()
    except Exception as exc:
        logger.warning("GCS is not configured — no credentials available: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "GCS is not configured. Set GCS_CREDENTIALS_JSON or "
                "GOOGLE_APPLICATION_CREDENTIALS."
            ),
        ) from exc


def _validate_file(file: UploadFile, content: bytes) -> None:
    """Raise HTTPException if file fails size or type validation."""
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Empty files are not allowed.",
        )
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )
    content_type = file.content_type or ""
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()

    if content_type not in ALLOWED_MIME_TYPES or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File type '{content_type}' / extension '.{ext}' is not allowed. "
                f"Allowed types: pdf, png, jpg, jpeg, tiff."
            ),
        )

def _gcs_object_path(company_id: uuid.UUID, entity_type: EntityType, entity_id: uuid.UUID, filename: str) -> str:
    """Build the GCS object path: {company_id}/{entity_type}/{entity_id}/{uuid}_{filename}."""
    safe_filename = os.path.basename(filename).replace(" ", "_").strip()
    if not safe_filename:
        safe_filename = "upload.bin"
    unique_prefix = uuid.uuid4().hex
    if hasattr(entity_type, 'value'):
        entity_type_str = entity_type.value
    else:
        entity_type_str = entity_type
    return f"{company_id}/{entity_type_str}/{entity_id}/{unique_prefix}_{safe_filename}"


async def upload_document_shared(
    file: UploadFile,
    entity_type: EntityType,
    entity_id: uuid.UUID,
    company_id: uuid.UUID,
) -> dict:
    content = await file.read()
    _validate_file(file, content)

    original_filename = file.filename or "unknown"
    gcs_path = _gcs_object_path(company_id, entity_type, entity_id, original_filename)

    if not settings.gcs_bucket_name:
        logger.warning(f"GCS is not configured. Bypassing upload step for {original_filename}. Saving locally to /tmp/{gcs_path.replace('/', '_')}")
        local_path = f"/tmp/{gcs_path.replace('/', '_')}"
        with open(local_path, "wb") as f:
            f.write(content)
        return {
            "gcs_object_path": gcs_path,
            "file_size": len(content),
            "mime_type": file.content_type,
            "message": "Saved locally due to missing GCS config"
        }

    try:
        client = _get_gcs_client()
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(gcs_path)
        blob.upload_from_string(content, content_type=file.content_type or "application/octet-stream")
    except Exception as e:
        logger.warning(f"GCS upload failed: {e}. Bypassing upload step for {original_filename}. Saving locally.")
        local_path = f"/tmp/{gcs_path.replace('/', '_')}"
        with open(local_path, "wb") as f:
            f.write(content)
        return {
            "gcs_object_path": gcs_path,
            "file_size": len(content),
            "mime_type": file.content_type,
            "message": f"Saved locally due to GCS error: {e}"
        }

    return {
        "gcs_object_path": gcs_path,
        "file_size": len(content),
        "mime_type": file.content_type,
        "message": "Uploaded to GCS"
    }
