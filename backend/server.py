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