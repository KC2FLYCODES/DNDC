import os
from supabase import create_client, Client
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'your-anon-key')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'your-service-role-key')

# Create Supabase clients
def get_supabase_client(service_role: bool = False) -> Client:
    """
    Get Supabase client
    service_role=True for admin operations that bypass RLS
    service_role=False for user operations with RLS enabled
    """
    key = SUPABASE_SERVICE_KEY if service_role else SUPABASE_ANON_KEY
    return create_client(SUPABASE_URL, key)

# Database Schema for Multi-Tenant Architecture
"""
-- Enable Row Level Security and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (CDC tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier (e.g., 'dndc', 'atlanta-cdc')
    domain VARCHAR(255), -- Custom domain if any
    settings JSONB DEFAULT '{}',
    logo_url TEXT,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Users table (CDC staff and residents)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'resident', -- 'resident', 'staff', 'admin', 'super_admin'
    profile JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    hours VARCHAR(255),
    eligibility TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255),
    applicant_phone VARCHAR(50),
    application_type VARCHAR(100) DEFAULT 'mission_180',
    status VARCHAR(50) DEFAULT 'submitted',
    progress_percentage INTEGER DEFAULT 0,
    notes TEXT,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    required_documents JSONB DEFAULT '[]',
    completed_documents JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT,
    file_size INTEGER,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    is_uploaded BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(50) DEFAULT 'info',
    deadline TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage metrics table
CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    page VARCHAR(100),
    user_session VARCHAR(255),
    user_id UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial calculations table
CREATE TABLE financial_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    calculation_type VARCHAR(50) NOT NULL, -- 'loan', 'income', 'utility'
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs table for configurable CDC programs
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'forgivable_loan', 'emergency_repair', 'weatherization', 'down_payment_assistance', 'accessibility', 'custom'
    description TEXT,
    eligibility_criteria JSONB DEFAULT '[]',
    geographic_scope TEXT,
    financial_terms JSONB DEFAULT '{}',
    required_documents TEXT[] DEFAULT '{}',
    faqs JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'archived'
    application_deadline DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_template BOOLEAN DEFAULT FALSE
);

-- Program applications table
CREATE TABLE program_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255),
    applicant_phone VARCHAR(50),
    application_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'denied', 'withdrawn'
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organizations (only accessible by super admins or the organization itself)
CREATE POLICY "Organizations can view their own data" ON organizations
    FOR ALL USING (
        auth.jwt() ->> 'organization_id' = id::text
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Users
CREATE POLICY "Users can view users in their organization" ON users
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Resources
CREATE POLICY "Users can view resources in their organization" ON resources
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Applications
CREATE POLICY "Users can view applications in their organization" ON applications
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Documents
CREATE POLICY "Users can view documents in their organization" ON documents
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Alerts
CREATE POLICY "Users can view alerts in their organization" ON alerts
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Contact Messages
CREATE POLICY "Users can view contact messages in their organization" ON contact_messages
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Usage Metrics
CREATE POLICY "Users can view usage metrics in their organization" ON usage_metrics
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Financial Calculations
CREATE POLICY "Users can view financial calculations in their organization" ON financial_calculations
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_resources_organization_id ON resources(organization_id);
CREATE INDEX idx_applications_organization_id ON applications(organization_id);
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX idx_contact_messages_organization_id ON contact_messages(organization_id);
CREATE INDEX idx_usage_metrics_organization_id ON usage_metrics(organization_id);
CREATE INDEX idx_financial_calculations_organization_id ON financial_calculations(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""