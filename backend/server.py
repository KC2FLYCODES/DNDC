from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()