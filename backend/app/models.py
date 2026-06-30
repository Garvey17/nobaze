import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Text, Integer, DateTime,func, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import engine

from database import Base

class SourceType(str, enum.Enum):
    PDF="pdf"
    URL="url"
    TEXT="text"

class DocumentStatus(str, enum.Enum):
    PENDING="pending"
    PROCESSING="processing"
    COMPLETE="complete"
    FAILED="failed"

class Document(Base):
    __tablename__="documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
        )

    source_type: Mapped[SourceType] = mapped_column(
        SAEnum(SourceType),
        nullable=False
        )

    source_name: Mapped[str] = mapped_column(
        String,
        nullable=False
        )

    status: Mapped[DocumentStatus] = mapped_column(
        SAEnum(DocumentStatus), 
        nullable=False,
        default=DocumentStatus.PENDING
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    chunks:Mapped[list["Chunk"]] =  relationship(
        "Chunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    token_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    document = relationship(
        "Document",
        back_populates="chunks"
    )

def create_all() -> None:
    Base.metadata.create_all(engine)