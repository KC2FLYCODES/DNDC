from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

# Supabase imports
from supabase_config import get_supabase_client
from supabase_service import SupabaseService
from supabase_models import *

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase configuration
DNDC_ORG_ID = "97fef08b-4fde-484d-b334-4b9450f9a280"  # DNDC organization ID

# Helper function to get organization context
async def get_organization_context(x_organization_id: Optional[str] = Header(None)):
    """
    Get organization context from header or default to DNDC
    This allows for multi-tenant requests
    """
    org_id = x_organization_id or DNDC_ORG_ID
    return org_id

# Helper function to get Supabase service
def get_supabase_service(organization_id: str) -> SupabaseService:
    """Get SupabaseService instance for the organization"""
    return SupabaseService(organization_id=organization_id)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    phone: Optional[str] = None
    address: Optional[str] = None
    hours: Optional[str] = None
    eligibility: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ResourceCreate(BaseModel):
    name: str
    description: str
    category: str
    phone: Optional[str] = None
    address: Optional[str] = None
    hours: Optional[str] = None
    eligibility: Optional[str] = None

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    alert_type: str = "info"
    posted_date: datetime = Field(default_factory=datetime.utcnow)
    deadline: Optional[datetime] = None
    is_active: bool = True

class AlertCreate(BaseModel):
    title: str
    message: str
    alert_type: str = "info"
    deadline: Optional[datetime] = None

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    is_uploaded: bool = False
    uploaded_at: Optional[datetime] = None
    file_path: Optional[str] = None
    original_filename: Optional[str] = None
    file_size: Optional[int] = None

class DocumentUpdate(BaseModel):
    is_uploaded: bool
    file_path: Optional[str] = None

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "new"

class ContactMessageCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: str

# Analytics and Admin Models
class UsageMetric(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # page_view, button_click, form_submit, document_upload, etc.
    page: str
    user_session: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_info: Optional[dict] = None
    metadata: Optional[dict] = None

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str = "admin"  # admin, staff, super_admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True

class AdminLogin(BaseModel):
    username: str
    password: str

# Phase 2 Models - Application Status Tracker
class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    applicant_name: str
    applicant_email: Optional[str] = None
    applicant_phone: Optional[str] = None
    application_type: str = "mission_180"  # mission_180, rental_assistance, etc.
    status: str = "submitted"  # submitted, under_review, approved, denied
    progress_percentage: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    estimated_completion: Optional[datetime] = None
    required_documents: List[str] = []
    completed_documents: List[str] = []

class ApplicationCreate(BaseModel):
    applicant_name: str
    applicant_email: Optional[str] = None
    applicant_phone: Optional[str] = None
    application_type: str = "mission_180"

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    progress_percentage: Optional[int] = None
    notes: Optional[str] = None
    estimated_completion: Optional[datetime] = None

# Phase 2 Models - Financial Calculator
class LoanCalculation(BaseModel):
    loan_amount: float
    interest_rate: float
    loan_term_years: int
    monthly_payment: float
    total_interest: float
    total_cost: float
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

# Phase 3 Models - Property Management
class Property(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    address: str
    city: str = "Danville"
    state: str = "VA"
    zip_code: str
    property_type: str  # single_family, multi_family, apartment, condo
    bedrooms: int
    bathrooms: float
    square_feet: Optional[int] = None
    price: Optional[float] = None
    rent: Optional[float] = None
    status: str = "available"  # available, pending, sold, rented
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    features: List[str] = []
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    program_type: Optional[str] = None  # mission_180, rental_assistance, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PropertyCreate(BaseModel):
    title: str
    description: str
    address: str
    city: str = "Danville"
    state: str = "VA"
    zip_code: str
    property_type: str
    bedrooms: int
    bathrooms: float
    square_feet: Optional[int] = None
    price: Optional[float] = None
    rent: Optional[float] = None
    status: str = "available"
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    features: List[str] = []
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    program_type: Optional[str] = None

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    price: Optional[float] = None
    rent: Optional[float] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    features: Optional[List[str]] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    program_type: Optional[str] = None

class IncomeQualification(BaseModel):
    household_size: int
    annual_income: float
    area_median_income: float
    qualification_percentage: float
    qualifies: bool
    max_income_limit: float
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

class UtilityAssistance(BaseModel):
    household_size: int
    monthly_income: float
    utility_type: str  # electric, gas, water, combined
    monthly_utility_cost: float
    assistance_amount: float
    assistance_percentage: float
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

# Basic status check endpoints
@api_router.get("/")
async def root():
    return {"message": "DNDC Resource Hub API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Resource endpoints
@api_router.get("/resources", response_model=List[Resource])
async def get_resources(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    resources = await db.resources.find(query).to_list(1000)
    return [Resource(**resource) for resource in resources]

@api_router.post("/resources", response_model=Resource)
async def create_resource(resource_data: ResourceCreate):
    resource_dict = resource_data.dict()
    resource_obj = Resource(**resource_dict)
    await db.resources.insert_one(resource_obj.dict())
    return resource_obj

@api_router.get("/resources/categories")
async def get_resource_categories():
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    categories = await db.resources.aggregate(pipeline).to_list(100)
    return [{"name": cat["_id"], "count": cat["count"]} for cat in categories]

# Document checklist endpoints
@api_router.get("/documents", response_model=List[Document])
async def get_documents():
    documents = await db.documents.find().to_list(1000)
    return [Document(**doc) for doc in documents]

@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(document_id: str, update_data: DocumentUpdate):
    update_dict = update_data.dict()
    if update_data.is_uploaded:
        update_dict["uploaded_at"] = datetime.utcnow()
    
    result = await db.documents.update_one(
        {"id": document_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = await db.documents.find_one({"id": document_id})
    return Document(**document)

@api_router.post("/documents/upload/{document_id}")
async def upload_document(document_id: str, file: UploadFile = File(...)):
    # In a real app, you'd save the file to cloud storage
    # For now, we'll simulate file storage
    import shutil
    from pathlib import Path
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{document_id}_{uuid.uuid4().hex[:8]}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save the file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update document in database
    update_result = await db.documents.update_one(
        {"id": document_id},
        {
            "$set": {
                "is_uploaded": True,
                "uploaded_at": datetime.utcnow(),
                "file_path": str(file_path),
                "original_filename": file.filename,
                "file_size": file_path.stat().st_size if file_path.exists() else 0
            }
        }
    )
    
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = await db.documents.find_one({"id": document_id})
    return Document(**document)

@api_router.post("/documents/replace/{document_id}")
async def replace_document(document_id: str, file: UploadFile = File(...)):
    # Get existing document
    existing_doc = await db.documents.find_one({"id": document_id})
    if not existing_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete old file if it exists
    if existing_doc.get("file_path"):
        old_file_path = Path(existing_doc["file_path"])
        if old_file_path.exists():
            old_file_path.unlink()
    
    # Upload new file using the same logic as upload
    return await upload_document(document_id, file)

@api_router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    from fastapi.responses import FileResponse
    
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not document.get("file_path"):
        raise HTTPException(status_code=404, detail="No file uploaded for this document")
    
    file_path = Path(document["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=document.get("original_filename", file_path.name),
        media_type='application/octet-stream'
    )

@api_router.get("/documents/{document_id}/view")
async def view_document(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not document.get("file_path"):
        raise HTTPException(status_code=404, detail="No file uploaded for this document")
    
    file_path = Path(document["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return {
        "id": document["id"],
        "name": document["name"],
        "original_filename": document.get("original_filename"),
        "file_size": document.get("file_size", 0),
        "uploaded_at": document.get("uploaded_at"),
        "file_path": document["file_path"],
        "download_url": f"/api/documents/{document_id}/download"
    }

@api_router.delete("/documents/{document_id}/file")
async def delete_document_file(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk if it exists
    if document.get("file_path"):
        file_path = Path(document["file_path"])
        if file_path.exists():
            file_path.unlink()
    
    # Update document in database
    await db.documents.update_one(
        {"id": document_id},
        {
            "$set": {
                "is_uploaded": False,
                "file_path": None,
                "original_filename": None,
                "file_size": 0,
                "uploaded_at": None
            }
        }
    )
    
    return {"message": "File deleted successfully"}

# Alert endpoints
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    alerts = await db.alerts.find(query).sort("posted_date", -1).to_list(1000)
    return [Alert(**alert) for alert in alerts]

@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert_data: AlertCreate):
    alert_dict = alert_data.dict()
    alert_obj = Alert(**alert_dict)
    await db.alerts.insert_one(alert_obj.dict())
    return alert_obj

# Contact endpoints
@api_router.post("/contact", response_model=ContactMessage)
async def send_contact_message(message_data: ContactMessageCreate):
    message_dict = message_data.dict()
    message_obj = ContactMessage(**message_dict)
    await db.contact_messages.insert_one(message_obj.dict())
    return message_obj

@api_router.get("/contact/info")
async def get_contact_info():
    return {
        "organization": "DNDC Housing Specialists",
        "address": "123 Main Street, Danville, VA 24541",
        "phone": "(434) 555-0150",
        "email": "housing@dndcva.org",
        "hours": "Monday - Friday: 9:00 AM - 5:00 PM"
    }

# Phase 2 Endpoints - Application Status Tracker
@api_router.post("/applications", response_model=Application)
async def create_application(application_data: ApplicationCreate):
    application_dict = application_data.dict()
    
    # Set initial required documents for Mission 180
    if application_data.application_type == "mission_180":
        application_dict["required_documents"] = [
            "Photo ID", "Proof of Income", "Social Security Card", 
            "Birth Certificates", "Landlord References", "Bank Statements"
        ]
    
    application_obj = Application(**application_dict)
    await db.applications.insert_one(application_obj.dict())
    return application_obj

@api_router.get("/applications", response_model=List[Application])
async def get_applications(applicant_email: Optional[str] = None):
    query = {}
    if applicant_email:
        query["applicant_email"] = applicant_email
    
    applications = await db.applications.find(query).sort("created_at", -1).to_list(1000)
    return [Application(**app) for app in applications]

@api_router.get("/applications/{application_id}", response_model=Application)
async def get_application(application_id: str):
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return Application(**application)

@api_router.put("/applications/{application_id}", response_model=Application)
async def update_application(application_id: str, update_data: ApplicationUpdate):
    update_dict = update_data.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    # Auto-calculate progress based on status
    if "status" in update_dict:
        status_progress = {
            "submitted": 25,
            "under_review": 50,
            "approved": 100,
            "denied": 100
        }
        update_dict["progress_percentage"] = status_progress.get(update_dict["status"], 0)
    
    result = await db.applications.update_one(
        {"id": application_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application = await db.applications.find_one({"id": application_id})
    return Application(**application)

@api_router.post("/applications/{application_id}/documents")
async def link_document_to_application(application_id: str, document_name: str):
    """Mark a document as completed for an application"""
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    completed_docs = application.get("completed_documents", [])
    if document_name not in completed_docs:
        completed_docs.append(document_name)
        
        # Calculate new progress based on document completion
        required_docs = application.get("required_documents", [])
        if required_docs:
            doc_progress = (len(completed_docs) / len(required_docs)) * 50  # Documents worth 50% of progress
            current_status_progress = {
                "submitted": 25,
                "under_review": 50,
                "approved": 100,
                "denied": 100
            }.get(application.get("status", "submitted"), 25)
            
            new_progress = max(current_status_progress, doc_progress)
            
            await db.applications.update_one(
                {"id": application_id},
                {
                    "$set": {
                        "completed_documents": completed_docs,
                        "progress_percentage": int(new_progress),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
    
    return {"message": "Document linked successfully", "completed_documents": completed_docs}

# Phase 2 Endpoints - Financial Calculator
@api_router.post("/calculate/loan", response_model=LoanCalculation)
async def calculate_loan(loan_amount: float, interest_rate: float, loan_term_years: int):
    """Calculate Mission 180 loan payment"""
    try:
        # Convert annual rate to monthly and years to months
        monthly_rate = interest_rate / 100 / 12
        num_payments = loan_term_years * 12
        
        if monthly_rate == 0:
            monthly_payment = loan_amount / num_payments
        else:
            monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
        
        total_cost = monthly_payment * num_payments
        total_interest = total_cost - loan_amount
        
        calculation = LoanCalculation(
            loan_amount=loan_amount,
            interest_rate=interest_rate,
            loan_term_years=loan_term_years,
            monthly_payment=round(monthly_payment, 2),
            total_interest=round(total_interest, 2),
            total_cost=round(total_cost, 2)
        )
        
        # Store calculation for analytics
        await db.loan_calculations.insert_one(calculation.dict())
        
        return calculation
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

@api_router.post("/calculate/income-qualification", response_model=IncomeQualification)
async def check_income_qualification(household_size: int, annual_income: float):
    """Check income qualification for Mission 180"""
    try:
        # Danville, VA Area Median Income (AMI) - 2024 estimates
        ami_by_household_size = {
            1: 52800,
            2: 60300,
            3: 67850,
            4: 75350,
            5: 81400,
            6: 87400,
            7: 93450,
            8: 99450
        }
        
        area_median_income = ami_by_household_size.get(household_size, 99450)
        
        # Mission 180 typically serves 80% AMI and below
        max_income_limit = area_median_income * 0.8
        qualification_percentage = (annual_income / max_income_limit) * 100
        qualifies = annual_income <= max_income_limit
        
        qualification = IncomeQualification(
            household_size=household_size,
            annual_income=annual_income,
            area_median_income=area_median_income,
            qualification_percentage=round(qualification_percentage, 1),
            qualifies=qualifies,
            max_income_limit=round(max_income_limit, 2)
        )
        
        # Store calculation for analytics
        await db.income_qualifications.insert_one(qualification.dict())
        
        return qualification
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

@api_router.post("/calculate/utility-assistance", response_model=UtilityAssistance)
async def calculate_utility_assistance(household_size: int, monthly_income: float, utility_type: str, monthly_utility_cost: float):
    """Calculate utility assistance eligibility"""
    try:
        # Federal Poverty Guidelines for utility assistance (150% FPL)
        fpl_by_household_size = {
            1: 1395,  # Monthly 150% FPL
            2: 1875,
            3: 2355,
            4: 2835,
            5: 3315,
            6: 3795,
            7: 4275,
            8: 4755
        }
        
        max_income_for_assistance = fpl_by_household_size.get(household_size, 4755)
        
        if monthly_income <= max_income_for_assistance:
            # Calculate assistance based on utility burden
            utility_burden = (monthly_utility_cost / monthly_income) * 100
            
            # Higher assistance for higher utility burden
            if utility_burden > 10:  # High burden
                assistance_percentage = 75
            elif utility_burden > 6:  # Moderate burden
                assistance_percentage = 50
            else:  # Low burden
                assistance_percentage = 25
            
            assistance_amount = monthly_utility_cost * (assistance_percentage / 100)
        else:
            assistance_amount = 0
            assistance_percentage = 0
        
        assistance = UtilityAssistance(
            household_size=household_size,
            monthly_income=monthly_income,
            utility_type=utility_type,
            monthly_utility_cost=monthly_utility_cost,
            assistance_amount=round(assistance_amount, 2),
            assistance_percentage=assistance_percentage
        )
        
        # Store calculation for analytics
        await db.utility_assistance_calculations.insert_one(assistance.dict())
        
        return assistance
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

# Analytics and Usage Tracking Endpoints
@api_router.post("/analytics/track")
async def track_usage(event_type: str, page: str, user_session: str, metadata: dict = None):
    """Track user interactions for analytics"""
    try:
        metric = UsageMetric(
            event_type=event_type,
            page=page,
            user_session=user_session,
            metadata=metadata or {}
        )
        await db.usage_metrics.insert_one(metric.dict())
        return {"status": "tracked"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard():
    """Get comprehensive analytics for admin dashboard"""
    try:
        # Get date range for last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Page views by day
        page_views_pipeline = [
            {"$match": {"timestamp": {"$gte": thirty_days_ago}, "event_type": "page_view"}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        page_views = await db.usage_metrics.aggregate(page_views_pipeline).to_list(100)
        
        # Most popular pages
        popular_pages_pipeline = [
            {"$match": {"timestamp": {"$gte": thirty_days_ago}, "event_type": "page_view"}},
            {"$group": {"_id": "$page", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        popular_pages = await db.usage_metrics.aggregate(popular_pages_pipeline).to_list(100)
        
        # Application completion rates
        total_applications = await db.applications.count_documents({})
        completed_applications = await db.applications.count_documents({"status": {"$in": ["approved", "denied"]}})
        in_progress_applications = await db.applications.count_documents({"status": {"$in": ["submitted", "under_review"]}})
        
        # Document upload rates
        total_documents = await db.documents.count_documents({})
        uploaded_documents = await db.documents.count_documents({"is_uploaded": True})
        
        # Calculator usage
        loan_calculations = await db.loan_calculations.count_documents({"calculated_at": {"$gte": thirty_days_ago}})
        income_checks = await db.income_qualifications.count_documents({"calculated_at": {"$gte": thirty_days_ago}})
        utility_calculations = await db.utility_assistance_calculations.count_documents({"calculated_at": {"$gte": thirty_days_ago}})
        
        # Contact messages
        recent_messages = await db.contact_messages.count_documents({"created_at": {"$gte": thirty_days_ago}})
        
        return {
            "page_views_by_day": page_views,
            "popular_pages": popular_pages,
            "applications": {
                "total": total_applications,
                "completed": completed_applications,
                "in_progress": in_progress_applications,
                "completion_rate": (completed_applications / total_applications * 100) if total_applications > 0 else 0
            },
            "documents": {
                "total": total_documents,
                "uploaded": uploaded_documents,
                "upload_rate": (uploaded_documents / total_documents * 100) if total_documents > 0 else 0
            },
            "calculators": {
                "loan_calculations": loan_calculations,
                "income_checks": income_checks,
                "utility_calculations": utility_calculations,
                "total_calculations": loan_calculations + income_checks + utility_calculations
            },
            "engagement": {
                "recent_messages": recent_messages
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

# Admin Authentication and Management
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    """Simple admin authentication (in production, use proper auth with JWT)"""
    # In production, hash passwords and use proper authentication
    admin_credentials = {
        "admin": "admin123",
        "staff": "staff123",
        "dndc_admin": "dndc2024"
    }
    
    if credentials.username in admin_credentials and admin_credentials[credentials.username] == credentials.password:
        # Update last login
        await db.admin_users.update_one(
            {"username": credentials.username},
            {"$set": {"last_login": datetime.utcnow()}},
            upsert=True
        )
        
        return {
            "success": True,
            "user": {
                "username": credentials.username,
                "role": "admin" if credentials.username == "dndc_admin" else "staff"
            },
            "token": f"admin_token_{credentials.username}"  # In production, use JWT
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/admin/applications")
async def get_admin_applications():
    """Get all applications for admin review"""
    applications = await db.applications.find({}).sort("created_at", -1).to_list(1000)
    return [Application(**app) for app in applications]

@api_router.put("/admin/applications/{application_id}/status")
async def update_application_status_admin(application_id: str, status: str, notes: str = ""):
    """Admin endpoint to update application status"""
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow(),
        "notes": notes
    }
    
    # Auto-calculate progress based on status
    status_progress = {
        "submitted": 25,
        "under_review": 50,
        "approved": 100,
        "denied": 100
    }
    update_data["progress_percentage"] = status_progress.get(status, 0)
    
    result = await db.applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"success": True, "message": "Application status updated"}

@api_router.get("/admin/resources")
async def get_admin_resources():
    """Get all resources for admin management"""
    resources = await db.resources.find({}).sort("created_at", -1).to_list(1000)
    return [Resource(**resource) for resource in resources]

@api_router.put("/admin/resources/{resource_id}")
async def update_resource_admin(resource_id: str, resource_data: ResourceCreate):
    """Admin endpoint to update resources"""
    result = await db.resources.update_one(
        {"id": resource_id},
        {"$set": resource_data.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"success": True, "message": "Resource updated"}

@api_router.delete("/admin/resources/{resource_id}")
async def delete_resource_admin(resource_id: str):
    """Admin endpoint to delete resources"""
    result = await db.resources.delete_one({"id": resource_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"success": True, "message": "Resource deleted"}

@api_router.get("/admin/messages")
async def get_admin_messages():
    """Get all contact messages for admin review"""
    messages = await db.contact_messages.find({}).sort("created_at", -1).to_list(1000)
    return [ContactMessage(**msg) for msg in messages]

@api_router.put("/admin/messages/{message_id}/status")
async def update_message_status_admin(message_id: str, status: str):
    """Admin endpoint to update message status"""
    result = await db.contact_messages.update_one(
        {"id": message_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"success": True, "message": "Message status updated"}

@api_router.get("/admin/export/applications")
async def export_applications():
    """Export applications data for admin reporting"""
    applications = await db.applications.find({}).to_list(1000)
    
    # Convert to CSV-friendly format
    export_data = []
    for app in applications:
        export_data.append({
            "id": app["id"],
            "applicant_name": app["applicant_name"],
            "applicant_email": app.get("applicant_email", ""),
            "application_type": app["application_type"],
            "status": app["status"],
            "progress_percentage": app["progress_percentage"],
            "created_at": app["created_at"].isoformat(),
            "updated_at": app["updated_at"].isoformat(),
            "completed_documents": len(app.get("completed_documents", [])),
            "total_documents": len(app.get("required_documents", []))
        })
    
    return export_data

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    # Initialize default documents checklist
    existing_docs = await db.documents.count_documents({})
    if existing_docs == 0:
        default_documents = [
            {"id": str(uuid.uuid4()), "name": "Photo ID", "description": "Government issued photo identification", "is_uploaded": False},
            {"id": str(uuid.uuid4()), "name": "Proof of Income", "description": "Last 2 pay stubs or income verification", "is_uploaded": False},
            {"id": str(uuid.uuid4()), "name": "Social Security Card", "description": "Original or certified copy", "is_uploaded": False},
            {"id": str(uuid.uuid4()), "name": "Birth Certificates", "description": "For all household members", "is_uploaded": False},
            {"id": str(uuid.uuid4()), "name": "Landlord References", "description": "Previous landlord contact information", "is_uploaded": False},
            {"id": str(uuid.uuid4()), "name": "Bank Statements", "description": "Last 2 months of bank statements", "is_uploaded": False}
        ]
        await db.documents.insert_many(default_documents)
    
    # Initialize default resources
    existing_resources = await db.resources.count_documents({})
    if existing_resources == 0:
        default_resources = [
            {
                "id": str(uuid.uuid4()),
                "name": "Emergency Rental Assistance Program",
                "description": "Up to 3 months rent assistance for qualified households",
                "category": "housing",
                "phone": "434-555-0100",
                "eligibility": "Income below 80% AMI",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Danville Housing Authority",
                "description": "Public housing and Section 8 vouchers",
                "category": "housing",
                "phone": "434-555-0200",
                "hours": "Mon-Fri 8am-5pm",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Community Action Agency",
                "description": "Utility assistance, weatherization programs",
                "category": "utilities",
                "phone": "434-555-0300",
                "hours": "Walk-ins welcome Tue & Thu",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "LIHEAP Energy Assistance",
                "description": "Help with heating and cooling bills",
                "category": "utilities",
                "phone": "434-555-0400",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Danville Food Bank",
                "description": "Emergency food assistance",
                "category": "food",
                "phone": "434-555-0500",
                "hours": "Open Tue & Thu 10am-2pm",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Community Health Center",
                "description": "Healthcare services with sliding scale fees",
                "category": "health",
                "phone": "434-555-0600",
                "hours": "Mon-Fri 8am-6pm",
                "created_at": datetime.utcnow()
            }
        ]
        await db.resources.insert_many(default_resources)
    
    # Initialize default alerts
    existing_alerts = await db.alerts.count_documents({})
    if existing_alerts == 0:
        default_alerts = [
            {
                "id": str(uuid.uuid4()),
                "title": "🏠 New Affordable Housing Units Available",
                "message": "15 units now accepting applications at Riverside Apartments",
                "alert_type": "housing",
                "posted_date": datetime.utcnow(),
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "title": "📋 Section 8 Waiting List Opening",
                "message": "Housing Authority will open waiting list for 48 hours starting Dec 1",
                "alert_type": "housing",
                "posted_date": datetime.utcnow(),
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "title": "💡 Utility Assistance Funding Available",
                "message": "Additional LIHEAP funds available - apply before funds run out",
                "alert_type": "utilities",
                "posted_date": datetime.utcnow(),
                "is_active": True
            }
        ]
        await db.alerts.insert_many(default_alerts)
    
    # Initialize sample applications for Phase 2
    existing_applications = await db.applications.count_documents({})
    if existing_applications == 0:
        sample_applications = [
            {
                "id": str(uuid.uuid4()),
                "applicant_name": "Sarah Johnson",
                "applicant_email": "sarah.j@email.com",
                "applicant_phone": "434-555-0123",
                "application_type": "mission_180",
                "status": "under_review",
                "progress_percentage": 75,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "notes": "Awaiting final income verification",
                "required_documents": ["Photo ID", "Proof of Income", "Social Security Card", "Birth Certificates", "Landlord References", "Bank Statements"],
                "completed_documents": ["Photo ID", "Social Security Card", "Birth Certificates", "Bank Statements"]
            },
            {
                "id": str(uuid.uuid4()),
                "applicant_name": "Michael Davis",
                "applicant_email": "m.davis@email.com",
                "applicant_phone": "434-555-0456",
                "application_type": "mission_180",
                "status": "submitted",
                "progress_percentage": 25,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "notes": "Application recently submitted",
                "required_documents": ["Photo ID", "Proof of Income", "Social Security Card", "Birth Certificates", "Landlord References", "Bank Statements"],
                "completed_documents": ["Photo ID"]
            }
        ]
        await db.applications.insert_many(sample_applications)

# ================================
# SUPABASE MULTI-TENANT ENDPOINTS
# ================================

@api_router.get("/supabase/status")
async def supabase_status():
    """Check Supabase connection and configuration"""
    try:
        # Test basic Supabase connection
        client = get_supabase_client(service_role=True)
        
        # Test DNDC organization
        result = client.table('organizations').select('*').eq('id', DNDC_ORG_ID).execute()
        
        if result.data:
            org = result.data[0]
            return {
                "status": "connected",
                "supabase_url": os.environ.get('SUPABASE_URL', 'Not configured'),
                "dndc_organization": {
                    "id": org.get('id'),
                    "name": org.get('name'),
                    "slug": org.get('slug')
                },
                "tables_accessible": True
            }
        else:
            return {"status": "error", "message": "DNDC organization not found"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

@api_router.get("/organizations/{org_id}")
async def get_organization(org_id: str):
    """Get organization details"""
    try:
        service = get_supabase_service(org_id)
        org = await service.get_organization(org_id)
        if org:
            return org.dict()
        else:
            raise HTTPException(status_code=404, detail="Organization not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/organizations/{org_id}/resources", response_model=List[dict])
async def get_organization_resources(
    org_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """Get resources for a specific organization (multi-tenant)"""
    try:
        service = get_supabase_service(org_id)
        resources = await service.get_resources(category=category, search=search)
        return [resource.dict() for resource in resources]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/organizations/{org_id}/resources")
async def create_organization_resource(
    org_id: str,
    resource_data: MultiTenantResourceCreate
):
    """Create a new resource for an organization"""
    try:
        service = get_supabase_service(org_id)
        resource = await service.create_resource(resource_data)
        if resource:
            return resource.dict()
        else:
            raise HTTPException(status_code=400, detail="Failed to create resource")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/organizations/{org_id}/applications", response_model=List[dict])
async def get_organization_applications(org_id: str):
    """Get applications for a specific organization"""
    try:
        service = get_supabase_service(org_id)
        applications = await service.get_applications()
        return [app.dict() for app in applications]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/organizations/{org_id}/applications")
async def create_organization_application(
    org_id: str,
    app_data: MultiTenantApplicationCreate
):
    """Create a new application for an organization"""
    try:
        service = get_supabase_service(org_id)
        application = await service.create_application(app_data)
        if application:
            return application.dict()
        else:
            raise HTTPException(status_code=400, detail="Failed to create application")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/organizations/{org_id}/applications/{app_id}/status")
async def update_application_status(
    org_id: str,
    app_id: str,
    status: str,
    notes: Optional[str] = ""
):
    """Update application status"""
    try:
        service = get_supabase_service(org_id)
        success = await service.update_application_status(app_id, status, notes)
        if success:
            return {"message": "Application status updated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to update application status")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/organizations/{org_id}/alerts", response_model=List[dict])
async def get_organization_alerts(org_id: str, active_only: bool = True):
    """Get alerts for a specific organization"""
    try:
        service = get_supabase_service(org_id)
        alerts = await service.get_alerts(active_only=active_only)
        return [alert.dict() for alert in alerts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/organizations/{org_id}/alerts")
async def create_organization_alert(
    org_id: str,
    alert_data: MultiTenantAlertCreate
):
    """Create a new alert for an organization"""
    try:
        service = get_supabase_service(org_id)
        alert = await service.create_alert(alert_data)
        if alert:
            return alert.dict()
        else:
            raise HTTPException(status_code=400, detail="Failed to create alert")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/organizations/{org_id}/analytics")
async def get_organization_analytics(org_id: str):
    """Get analytics dashboard for an organization"""
    try:
        service = get_supabase_service(org_id)
        analytics = await service.get_analytics_dashboard()
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Convenience endpoints for DNDC (default organization)
@api_router.get("/dndc/resources", response_model=List[dict])
async def get_dndc_resources(category: Optional[str] = None, search: Optional[str] = None):
    """Get DNDC resources (convenience endpoint)"""
    return await get_organization_resources(DNDC_ORG_ID, category, search)

@api_router.post("/dndc/resources")
async def create_dndc_resource(resource_data: MultiTenantResourceCreate):
    """Create DNDC resource (convenience endpoint)"""
    return await create_organization_resource(DNDC_ORG_ID, resource_data)

@api_router.get("/dndc/applications")
async def get_dndc_applications():
    """Get DNDC applications (convenience endpoint)"""
    return await get_organization_applications(DNDC_ORG_ID)

@api_router.get("/dndc/alerts")
async def get_dndc_alerts(active_only: bool = True):
    """Get DNDC alerts (convenience endpoint)"""
    return await get_organization_alerts(DNDC_ORG_ID, active_only)

@api_router.get("/dndc/analytics")
async def get_dndc_analytics():
    """Get DNDC analytics (convenience endpoint)"""
    return await get_organization_analytics(DNDC_ORG_ID)

# ================================
# CDC PROGRAMS MANAGEMENT ENDPOINTS
# ================================

@api_router.get("/organizations/{org_id}/programs", response_model=List[dict])
async def get_organization_programs(
    org_id: str,
    status: Optional[str] = None,
    program_type: Optional[str] = None
):
    """Get programs for a specific organization"""
    try:
        service = get_supabase_service(org_id)
        
        # Build query
        query = service.supabase.table('programs').select('*').eq('organization_id', org_id)
        
        if status:
            query = query.eq('status', status)
        if program_type:
            query = query.eq('type', program_type)
            
        result = query.order('created_at', desc=True).execute()
        
        return result.data if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/organizations/{org_id}/programs")
async def create_organization_program(org_id: str, program_data: dict):
    """Create a new program for an organization"""
    try:
        service = get_supabase_service(org_id)
        
        # Get the admin user for this organization to use as created_by
        users_result = service.supabase.table('users').select('id').eq('organization_id', org_id).eq('role', 'admin').limit(1).execute()
        
        if not users_result.data:
            # If no admin user, get any user from the organization
            users_result = service.supabase.table('users').select('id').eq('organization_id', org_id).limit(1).execute()
        
        if not users_result.data:
            raise HTTPException(status_code=400, detail="No users found for organization")
        
        admin_user_id = users_result.data[0]['id']
        
        # Add organization_id and created_by to program data
        program_data['organization_id'] = org_id
        program_data['created_by'] = admin_user_id
        
        result = service.supabase.table('programs').insert(program_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create program")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/organizations/{org_id}/programs/{program_id}")
async def get_program_details(org_id: str, program_id: str):
    """Get detailed program information"""
    try:
        service = get_supabase_service(org_id)
        
        result = service.supabase.table('programs').select('*').eq('id', program_id).eq('organization_id', org_id).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=404, detail="Program not found")
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        # Check if it's a "not found" error from Supabase
        error_str = str(e).lower()
        if "not found" in error_str or "404" in error_str:
            raise HTTPException(status_code=404, detail="Program not found")
        else:
            raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/organizations/{org_id}/programs/{program_id}")
async def update_program(org_id: str, program_id: str, program_data: dict):
    """Update an existing program"""
    try:
        service = get_supabase_service(org_id)
        
        # Remove organization_id from update data to prevent changes
        program_data.pop('organization_id', None)
        program_data['updated_at'] = datetime.now().isoformat()
        
        result = service.supabase.table('programs').update(program_data).eq('id', program_id).eq('organization_id', org_id).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=404, detail="Program not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/organizations/{org_id}/programs/{program_id}")
async def delete_program(org_id: str, program_id: str):
    """Delete a program (archives it instead of hard delete)"""
    try:
        service = get_supabase_service(org_id)
        
        # Archive instead of delete to preserve application history
        result = service.supabase.table('programs').update({'status': 'archived'}).eq('id', program_id).eq('organization_id', org_id).execute()
        
        if result.data:
            return {"message": "Program archived successfully"}
        else:
            raise HTTPException(status_code=404, detail="Program not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Program Applications Endpoints
@api_router.get("/organizations/{org_id}/programs/{program_id}/applications")
async def get_program_applications(
    org_id: str, 
    program_id: str,
    status: Optional[str] = None
):
    """Get applications for a specific program"""
    try:
        service = get_supabase_service(org_id)
        
        query = service.supabase.table('program_applications').select('*').eq('program_id', program_id).eq('organization_id', org_id)
        
        if status:
            query = query.eq('status', status)
            
        result = query.order('submitted_at', desc=True).execute()
        
        return result.data if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/organizations/{org_id}/programs/{program_id}/applications")
async def submit_program_application(org_id: str, program_id: str, application_data: dict):
    """Submit a new application for a program"""
    try:
        service = get_supabase_service(org_id)
        
        # Verify program exists and is active
        program_result = service.supabase.table('programs').select('*').eq('id', program_id).eq('organization_id', org_id).execute()
        
        if not program_result.data:
            raise HTTPException(status_code=404, detail="Program not found")
        
        program = program_result.data[0]
        if program['status'] != 'active':
            raise HTTPException(status_code=400, detail="Program is not currently accepting applications")
        
        # Prepare application data
        app_data = {
            'program_id': program_id,
            'organization_id': org_id,
            'applicant_name': application_data.get('applicant_name'),
            'applicant_email': application_data.get('applicant_email'),
            'applicant_phone': application_data.get('applicant_phone'),
            'application_data': application_data.get('form_data', {}),
            'status': 'pending'
        }
        
        result = service.supabase.table('program_applications').insert(app_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to submit application")
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        # Check if it's a "not found" error from Supabase
        error_str = str(e).lower()
        if "not found" in error_str or "404" in error_str:
            raise HTTPException(status_code=404, detail="Program not found")
        else:
            raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/organizations/{org_id}/programs/{program_id}/applications/{app_id}")
async def update_application_status(
    org_id: str, 
    program_id: str, 
    app_id: str, 
    update_data: dict
):
    """Update application status and review notes"""
    try:
        service = get_supabase_service(org_id)
        
        update_data['updated_at'] = datetime.now().isoformat()
        if update_data.get('status') in ['approved', 'denied']:
            update_data['reviewed_at'] = datetime.now().isoformat()
        
        result = service.supabase.table('program_applications').update(update_data).eq('id', app_id).eq('organization_id', org_id).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=404, detail="Application not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/organizations/{org_id}/programs-dashboard")
async def get_programs_dashboard(org_id: str):
    """Get dashboard overview of all programs and applications"""
    try:
        service = get_supabase_service(org_id)
        
        # Get programs summary
        programs_result = service.supabase.table('programs').select('id, name, type, status').eq('organization_id', org_id).execute()
        
        # Get applications summary
        apps_result = service.supabase.table('program_applications').select('program_id, status').eq('organization_id', org_id).execute()
        
        # Calculate statistics
        programs = programs_result.data if programs_result.data else []
        applications = apps_result.data if apps_result.data else []
        
        dashboard_data = {
            'total_programs': len(programs),
            'active_programs': len([p for p in programs if p['status'] == 'active']),
            'total_applications': len(applications),
            'pending_applications': len([a for a in applications if a['status'] == 'pending']),
            'approved_applications': len([a for a in applications if a['status'] == 'approved']),
            'programs': programs,
            'recent_applications': applications[:10]  # Last 10 applications
        }
        
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# DNDC Programs Convenience Endpoints
@api_router.get("/dndc/programs")
async def get_dndc_programs(status: Optional[str] = None, program_type: Optional[str] = None):
    """Get DNDC programs (convenience endpoint)"""
    return await get_organization_programs(DNDC_ORG_ID, status, program_type)

@api_router.post("/dndc/programs")
async def create_dndc_program(program_data: dict):
    """Create DNDC program (convenience endpoint)"""
    return await create_organization_program(DNDC_ORG_ID, program_data)

@api_router.get("/dndc/programs/{program_id}")
async def get_dndc_program_details(program_id: str):
    """Get DNDC program details (convenience endpoint)"""
    return await get_program_details(DNDC_ORG_ID, program_id)

@api_router.put("/dndc/programs/{program_id}")
async def update_dndc_program(program_id: str, program_data: dict):
    """Update DNDC program (convenience endpoint)"""
    return await update_program(DNDC_ORG_ID, program_id, program_data)

@api_router.get("/dndc/programs-dashboard")
async def get_dndc_programs_dashboard():
    """Get DNDC programs dashboard (convenience endpoint)"""
    return await get_programs_dashboard(DNDC_ORG_ID)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include the API router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)