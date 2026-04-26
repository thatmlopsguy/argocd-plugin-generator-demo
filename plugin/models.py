from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    DateTime,
)
from sqlalchemy.orm import relationship

from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Organization(Base):
    __tablename__ = "organization"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    projects = relationship(
        "Project", back_populates="organization", cascade="all, delete-orphan"
    )
    environments = relationship(
        "Environment", back_populates="organization", cascade="all, delete-orphan"
    )
    tenants = relationship(
        "Tenant", back_populates="organization", cascade="all, delete-orphan"
    )


class Project(Base):
    __tablename__ = "project"
    __table_args__ = (UniqueConstraint("organization_id", "slug"),)

    id = Column(Integer, primary_key=True)
    organization_id = Column(
        Integer, ForeignKey("organization.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    repo_url = Column(String(500))
    chart = Column(String(255))
    target_revision = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    organization = relationship("Organization", back_populates="projects")
    assignments = relationship(
        "TenantProjectEnvironment",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class Environment(Base):
    __tablename__ = "environment"
    __table_args__ = (UniqueConstraint("organization_id", "slug"),)

    id = Column(Integer, primary_key=True)
    organization_id = Column(
        Integer, ForeignKey("organization.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    organization = relationship("Organization", back_populates="environments")
    assignments = relationship(
        "TenantProjectEnvironment",
        back_populates="environment",
        cascade="all, delete-orphan",
    )


class Tenant(Base):
    __tablename__ = "tenant"
    __table_args__ = (
        UniqueConstraint("organization_id", "slug"),
        CheckConstraint("status IN ('active', 'inactive', 'trial', 'de-provisioned')"),
    )

    id = Column(Integer, primary_key=True)
    organization_id = Column(
        Integer, ForeignKey("organization.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    organization = relationship("Organization", back_populates="tenants")
    assignments = relationship(
        "TenantProjectEnvironment",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )


class TenantProjectEnvironment(Base):
    __tablename__ = "tenant_project_environment"
    __table_args__ = (UniqueConstraint("tenant_id", "project_id", "environment_id"),)

    id = Column(Integer, primary_key=True)
    tenant_id = Column(
        Integer, ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False
    )
    project_id = Column(
        Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    environment_id = Column(
        Integer, ForeignKey("environment.id", ondelete="CASCADE"), nullable=False
    )
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    tenant = relationship("Tenant", back_populates="assignments")
    project = relationship("Project", back_populates="assignments")
    environment = relationship("Environment", back_populates="assignments")
