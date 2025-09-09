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
    # For now, we'll just mark it as uploaded
    update_result = await db.documents.update_one(
        {"id": document_id},
        {
            "$set": {
                "is_uploaded": True,
                "uploaded_at": datetime.utcnow(),
                "file_path": f"uploads/{file.filename}"
            }
        }
    )
    
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "File uploaded successfully", "filename": file.filename}

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