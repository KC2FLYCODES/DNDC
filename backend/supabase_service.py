from typing import List, Optional, Dict, Any
from datetime import datetime
from supabase_config import get_supabase_client
from supabase_models import *
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self, organization_id: str, user_token: Optional[str] = None):
        self.organization_id = organization_id
        self.supabase = get_supabase_client(service_role=False)
        if user_token:
            self.supabase.auth.set_session(user_token)
    
    # Organization management
    async def get_organization(self, org_id: str) -> Optional[Organization]:
        try:
            result = self.supabase.table('organizations').select('*').eq('id', org_id).execute()
            if result.data:
                return Organization(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error getting organization: {e}")
            return None
    
    async def create_organization(self, org_data: OrganizationCreate) -> Optional[Organization]:
        try:
            result = self.supabase.table('organizations').insert(org_data.dict()).execute()
            if result.data:
                return Organization(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error creating organization: {e}")
            return None
    
    # Resource management with multi-tenancy
    async def get_resources(self, category: Optional[str] = None, search: Optional[str] = None) -> List[MultiTenantResource]:
        try:
            query = self.supabase.table('resources').select('*').eq('organization_id', self.organization_id).eq('is_active', True)
            
            if category:
                query = query.eq('category', category)
            if search:
                query = query.or_(f'name.ilike.%{search}%,description.ilike.%{search}%')
            
            result = query.execute()
            return [MultiTenantResource(**resource) for resource in result.data]
        except Exception as e:
            logger.error(f"Error getting resources: {e}")
            return []
    
    async def create_resource(self, resource_data: MultiTenantResourceCreate) -> Optional[MultiTenantResource]:
        try:
            resource_dict = resource_data.dict()
            resource_dict['organization_id'] = self.organization_id
            
            result = self.supabase.table('resources').insert(resource_dict).execute()
            if result.data:
                return MultiTenantResource(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error creating resource: {e}")
            return None
    
    async def update_resource(self, resource_id: str, resource_data: dict) -> bool:
        try:
            result = self.supabase.table('resources').update(resource_data).eq('id', resource_id).eq('organization_id', self.organization_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error updating resource: {e}")
            return False
    
    async def delete_resource(self, resource_id: str) -> bool:
        try:
            result = self.supabase.table('resources').update({'is_active': False}).eq('id', resource_id).eq('organization_id', self.organization_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error deleting resource: {e}")
            return False
    
    # Application management with multi-tenancy
    async def get_applications(self) -> List[MultiTenantApplication]:
        try:
            result = self.supabase.table('applications').select('*').eq('organization_id', self.organization_id).order('created_at', desc=True).execute()
            return [MultiTenantApplication(**app) for app in result.data]
        except Exception as e:
            logger.error(f"Error getting applications: {e}")
            return []
    
    async def create_application(self, app_data: MultiTenantApplicationCreate) -> Optional[MultiTenantApplication]:
        try:
            app_dict = app_data.dict()
            app_dict['organization_id'] = self.organization_id
            app_dict['required_documents'] = [
                "Photo ID", "Proof of Income", "Social Security Card", 
                "Birth Certificates", "Landlord References", "Bank Statements"
            ]
            
            result = self.supabase.table('applications').insert(app_dict).execute()
            if result.data:
                return MultiTenantApplication(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error creating application: {e}")
            return None
    
    async def update_application_status(self, app_id: str, status: str, notes: str = "") -> bool:
        try:
            update_data = {
                'status': status,
                'notes': notes,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Auto-calculate progress
            status_progress = {
                "submitted": 25,
                "under_review": 50, 
                "approved": 100,
                "denied": 100
            }
            update_data['progress_percentage'] = status_progress.get(status, 0)
            
            result = self.supabase.table('applications').update(update_data).eq('id', app_id).eq('organization_id', self.organization_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error updating application: {e}")
            return False
    
    # Document management with file storage
    async def get_documents(self, application_id: Optional[str] = None) -> List[MultiTenantDocument]:
        try:
            query = self.supabase.table('documents').select('*').eq('organization_id', self.organization_id)
            if application_id:
                query = query.eq('application_id', application_id)
            
            result = query.execute()
            return [MultiTenantDocument(**doc) for doc in result.data]
        except Exception as e:
            logger.error(f"Error getting documents: {e}")
            return []
    
    async def upload_document_file(self, document_id: str, file_path: str, file_data: bytes, mime_type: str) -> bool:
        try:
            # Upload to Supabase Storage
            bucket_name = f"documents-{self.organization_id}"
            storage_path = f"{document_id}/{file_path}"
            
            self.supabase.storage.from_(bucket_name).upload(storage_path, file_data)
            
            # Update document record
            update_data = {
                'is_uploaded': True,
                'uploaded_at': datetime.utcnow().isoformat(),
                'file_path': storage_path,
                'mime_type': mime_type,
                'file_size': len(file_data)
            }
            
            result = self.supabase.table('documents').update(update_data).eq('id', document_id).eq('organization_id', self.organization_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            return False
    
    # Alerts management
    async def get_alerts(self, active_only: bool = True) -> List[MultiTenantAlert]:
        try:
            query = self.supabase.table('alerts').select('*').eq('organization_id', self.organization_id)
            if active_only:
                query = query.eq('is_active', True)
            
            result = query.order('created_at', desc=True).execute()
            return [MultiTenantAlert(**alert) for alert in result.data]
        except Exception as e:
            logger.error(f"Error getting alerts: {e}")
            return []
    
    async def create_alert(self, alert_data: MultiTenantAlertCreate) -> Optional[MultiTenantAlert]:
        try:
            alert_dict = alert_data.dict()
            alert_dict['organization_id'] = self.organization_id
            
            result = self.supabase.table('alerts').insert(alert_dict).execute()
            if result.data:
                return MultiTenantAlert(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
            return None
    
    # Contact messages
    async def get_contact_messages(self) -> List[MultiTenantContactMessage]:
        try:
            result = self.supabase.table('contact_messages').select('*').eq('organization_id', self.organization_id).order('created_at', desc=True).execute()
            return [MultiTenantContactMessage(**msg) for msg in result.data]
        except Exception as e:
            logger.error(f"Error getting contact messages: {e}")
            return []
    
    async def create_contact_message(self, message_data: MultiTenantContactMessageCreate) -> Optional[MultiTenantContactMessage]:
        try:
            message_dict = message_data.dict()
            message_dict['organization_id'] = self.organization_id
            
            result = self.supabase.table('contact_messages').insert(message_dict).execute()
            if result.data:
                return MultiTenantContactMessage(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error creating contact message: {e}")
            return None
    
    # Analytics and usage tracking
    async def track_usage(self, event_type: str, page: str, user_session: str, metadata: Dict[str, Any] = None) -> bool:
        try:
            metric_data = {
                'organization_id': self.organization_id,
                'event_type': event_type,
                'page': page,
                'user_session': user_session,
                'metadata': metadata or {}
            }
            
            result = self.supabase.table('usage_metrics').insert(metric_data).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error tracking usage: {e}")
            return False
    
    async def get_analytics_dashboard(self) -> Dict[str, Any]:
        try:
            # Get basic counts (in production, use more sophisticated queries)
            applications = await self.get_applications()
            documents = await self.get_documents()
            alerts = await self.get_alerts()
            
            total_applications = len(applications)
            completed_applications = len([app for app in applications if app.status in ['approved', 'denied']])
            uploaded_documents = len([doc for doc in documents if doc.is_uploaded])
            
            return {
                "applications": {
                    "total": total_applications,
                    "completed": completed_applications,
                    "completion_rate": (completed_applications / total_applications * 100) if total_applications > 0 else 0
                },
                "documents": {
                    "total": len(documents),
                    "uploaded": uploaded_documents,
                    "upload_rate": (uploaded_documents / len(documents) * 100) if documents else 0
                },
                "alerts": {
                    "active": len(alerts)
                }
            }
        except Exception as e:
            logger.error(f"Error getting analytics: {e}")
            return {}
    
    # Financial calculations with tracking
    async def save_financial_calculation(self, calc_type: str, input_data: Dict[str, Any], result_data: Dict[str, Any]) -> bool:
        try:
            calc_data = {
                'organization_id': self.organization_id,
                'calculation_type': calc_type,
                'input_data': input_data,
                'result_data': result_data
            }
            
            result = self.supabase.table('financial_calculations').insert(calc_data).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error saving financial calculation: {e}")
            return False