from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# Multi-tenant models for Supabase

class Organization(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str  # URL-friendly identifier
    domain: Optional[str] = None
    settings: Dict[str, Any] = {}
    logo_url: Optional[str] = None  
    contact_info: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class OrganizationCreate(BaseModel):
    name: str
    slug: str
    domain: Optional[str] = None
    settings: Dict[str, Any] = {}
    logo_url: Optional[str] = None
    contact_info: Dict[str, Any] = {}

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    email: str
    role: str = "resident"  # resident, staff, admin, super_admin
    profile: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    organization_id: str
    email: str
    role: str = "resident"
    profile: Dict[str, Any] = {}

class MultiTenantResource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    name: str
    description: str
    category: str
    phone: Optional[str] = None
    address: Optional[str] = None
    hours: Optional[str] = None
    eligibility: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class MultiTenantResourceCreate(BaseModel):
    organization_id: str
    name: str
    description: str
    category: str
    phone: Optional[str] = None
    address: Optional[str] = None
    hours: Optional[str] = None
    eligibility: Optional[str] = None

class MultiTenantApplication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    applicant_id: Optional[str] = None
    applicant_name: str
    applicant_email: Optional[str] = None
    applicant_phone: Optional[str] = None
    application_type: str = "mission_180"
    status: str = "submitted"
    progress_percentage: int = 0
    notes: Optional[str] = None
    estimated_completion: Optional[datetime] = None
    required_documents: List[str] = []
    completed_documents: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MultiTenantApplicationCreate(BaseModel):
    organization_id: str
    applicant_name: str
    applicant_email: Optional[str] = None
    applicant_phone: Optional[str] = None
    application_type: str = "mission_180"

class MultiTenantDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    application_id: Optional[str] = None
    name: str
    description: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None
    is_uploaded: bool = False
    uploaded_at: Optional[datetime] = None
    uploaded_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MultiTenantAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    title: str
    message: str
    alert_type: str = "info"
    deadline: Optional[datetime] = None
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MultiTenantAlertCreate(BaseModel):
    organization_id: str
    title: str
    message: str
    alert_type: str = "info"
    deadline: Optional[datetime] = None

class MultiTenantContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: str
    status: str = "new"
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MultiTenantContactMessageCreate(BaseModel):
    organization_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: str

class MultiTenantUsageMetric(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    event_type: str
    page: Optional[str] = None
    user_session: str
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MultiTenantFinancialCalculation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    user_id: Optional[str] = None
    calculation_type: str  # loan, income, utility
    input_data: Dict[str, Any]
    result_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Tenant configuration model
class TenantConfig(BaseModel):
    organization_id: str
    organization_name: str
    slug: str
    logo_url: Optional[str] = None
    theme_colors: Dict[str, str] = {
        "primary": "#667eea",
        "secondary": "#764ba2"
    }
    features_enabled: Dict[str, bool] = {
        "applications": True,
        "documents": True,
        "calculators": True,
        "alerts": True,
        "contact": True
    }