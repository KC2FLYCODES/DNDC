#!/usr/bin/env python3
"""
Supabase SQL Setup Guide - Complete SQL commands for manual execution
"""
import os
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')

print(f"🚀 SUPABASE SQL SETUP GUIDE")
print(f"=" * 50)
print(f"Project URL: {SUPABASE_URL}")
print(f"")
print(f"📋 Follow these steps:")
print(f"1. Go to: {SUPABASE_URL}")
print(f"2. Click 'SQL Editor' in the left sidebar")
print(f"3. Click '+ New query'")
print(f"4. Copy and execute the SQL below (each step separately):")
print(f"")

# Complete SQL schema in organized steps
sql_commands = [
    {
        "step": 1,
        "title": "Enable UUID Extension",
        "sql": 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    },
    {
        "step": 2,
        "title": "Create Organizations Table",
        "sql": """CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    logo_url TEXT,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);"""
    },
    {
        "step": 3,
        "title": "Create Users Table",
        "sql": """CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'resident',
    profile JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);"""
    },
    {
        "step": 4,
        "title": "Create Resources Table",
        "sql": """CREATE TABLE IF NOT EXISTS resources (
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
);"""
    },
    {
        "step": 5,
        "title": "Create Applications Table",
        "sql": """CREATE TABLE IF NOT EXISTS applications (
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
);"""
    },
    {
        "step": 6,
        "title": "Create Documents Table",
        "sql": """CREATE TABLE IF NOT EXISTS documents (
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
);"""
    },
    {
        "step": 7,
        "title": "Create Alerts Table",
        "sql": """CREATE TABLE IF NOT EXISTS alerts (
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
);"""
    },
    {
        "step": 8,
        "title": "Create Contact Messages Table",
        "sql": """CREATE TABLE IF NOT EXISTS contact_messages (
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
);"""
    },
    {
        "step": 9,
        "title": "Enable Row Level Security",
        "sql": """ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;"""
    },
    {
        "step": 10,
        "title": "Create RLS Policies",
        "sql": """-- RLS Policies for Organizations
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
    );"""
    },
    {
        "step": 11,
        "title": "Create Indexes for Performance",
        "sql": """CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_resources_organization_id ON resources(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_organization_id ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_organization_id ON contact_messages(organization_id);"""
    },
    {
        "step": 12,
        "title": "Create Initial DNDC Organization",
        "sql": """-- Insert DNDC organization
INSERT INTO organizations (name, slug, contact_info) VALUES 
  ('Danville Neighborhood Development Corporation', 'dndc', 
   '{"phone": "(434) 555-0150", "email": "info@dndc.org", "address": "Danville, VA"}')
ON CONFLICT (slug) DO NOTHING;

-- Insert admin user for DNDC
INSERT INTO users (organization_id, email, role, profile) VALUES 
  ((SELECT id FROM organizations WHERE slug = 'dndc'), 
   'admin@dndc.org', 
   'admin', 
   '{"name": "DNDC Admin", "department": "Administration"}')
ON CONFLICT (email) DO NOTHING;"""
    }
]

# Print all SQL commands
for cmd in sql_commands:
    print(f"\n{'='*60}")
    print(f"STEP {cmd['step']}: {cmd['title']}")
    print(f"{'='*60}")
    print(cmd['sql'])

print(f"\n{'='*60}")
print(f"SETUP COMPLETE!")
print(f"{'='*60}")
print(f"After executing all steps:")
print(f"1. Go to 'Table Editor' in Supabase to verify tables were created")
print(f"2. You should see: organizations, users, resources, applications, documents, alerts, contact_messages")
print(f"3. The 'organizations' table should have 1 row with DNDC data")
print(f"4. Return to the application - Supabase integration will be ready!")