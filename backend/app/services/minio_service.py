import asyncio
from datetime import timedelta
from io import BytesIO
from fastapi import UploadFile
from minio import Minio
from minio.error import S3Error

from app.core.config import settings

PUBLIC_MEDIA_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "mp4", "avi", "mov", "webm", "mkv"}


class MinioService:
    """Handle file storage with MinIO."""

    def __init__(self, bucket: str | None = None):
        self.bucket = bucket or settings.MINIO_BUCKET_NAME
        
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
            public=settings.MINIO_PUBLIC_URL
        )

    def _ensure_bucket(self) -> None:
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    # ====================== UPLOAD ======================
    async def upload_file(self, file: UploadFile, contents: bytes) -> str:
        """Загружает файл и возвращает object_name (имя файла в MinIO)."""
        content_type = file.content_type or "application/octet-stream"
        object_name = file.filename or f"upload_{asyncio.get_event_loop().time()}"

        await asyncio.to_thread(
            self._upload_sync, object_name, contents, content_type
        )
        return object_name

    def _upload_sync(self, object_name: str, contents: bytes, content_type: str):
        self._ensure_bucket()
        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_name,
            data=BytesIO(contents),
            length=len(contents),
            content_type=content_type,
        )

    # ====================== URL ======================
    def get_file_url(self, object_name: str) -> str:
        """Основной метод: возвращает правильную публичную ссылку."""
        if not object_name:
            return ""

        ext = object_name.rsplit(".", 1)[-1].lower() if "." in object_name else ""
        
        if ext in PUBLIC_MEDIA_EXTENSIONS:
            return self.get_permanent_url(object_name)
        else:
            return self.get_presigned_url(object_name)

    def get_permanent_url(self, object_name: str) -> str:
        """Постоянная публичная ссылка (для картинок и видео)"""
        # Используем публичный URL из настроек, если он есть
        if hasattr(settings, "MINIO_PUBLIC_URL") and settings.MINIO_PUBLIC_URL:
            base = settings.MINIO_PUBLIC_URL.rstrip("/")
            return f"{base}/{self.bucket}/{object_name.lstrip('/')}"
        
        # Fallback для разработки
        return f"http://localhost:9000/{self.bucket}/{object_name.lstrip('/')}"

    def get_presigned_url(self, object_name: str, expires: int = 86400) -> str:
        """Временная ссылка (для pdf, doc и т.д.)"""
        return self.client.presigned_get_object(
            bucket_name=self.bucket,
            object_name=object_name,
            expires=timedelta(seconds=expires),
        )

    # ====================== ПРОЧИЕ МЕТОДЫ ======================
    async def file_exists(self, object_name: str) -> bool:
        return await asyncio.to_thread(self._file_exists_sync, object_name)

    def _file_exists_sync(self, object_name: str) -> bool:
        try:
            self.client.stat_object(self.bucket, object_name)
            return True
        except S3Error:
            return False

    async def delete_file(self, object_name: str) -> None:
        await asyncio.to_thread(self._delete_sync, object_name)

    def _delete_sync(self, object_name: str) -> None:
        self.client.remove_object(self.bucket, object_name)