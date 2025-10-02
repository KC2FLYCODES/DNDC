-- Programs Management Schema for CDC Platform
-- Add to existing Supabase database

-- Programs table for configurable CDC programs
CREATE TABLE IF NOT EXISTS programs (
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
CREATE TABLE IF NOT EXISTS program_applications (
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

-- Enable RLS for programs tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Programs
CREATE POLICY "Users can view programs in their organization" ON programs
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Program Applications  
CREATE POLICY "Users can view applications in their organization" ON program_applications
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_programs_organization_id ON programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_type ON programs(type);
CREATE INDEX IF NOT EXISTS idx_program_applications_program_id ON program_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_organization_id ON program_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_status ON program_applications(status);

-- Sample program data for DNDC
INSERT INTO programs (organization_id, name, type, description, eligibility_criteria, financial_terms, required_documents, faqs, created_by) VALUES 
((SELECT id FROM organizations WHERE slug = 'dndc'), 
 'Mission 180 Forgivable Loan Program', 
 'forgivable_loan',
 'The Mission 180 Forgivable Loan Program helps qualifying homeowners make critical repairs and improvements to their homes. Loans are forgiven over time based on continued residency.',
 '[
   {"criteria": "Household income at or below 80% of Area Median Income"},
   {"criteria": "Must own and occupy property as primary residence"},
   {"criteria": "Property must be located within Danville city limits"},
   {"criteria": "Must complete homeowner education course"}
 ]',
 '{
   "maximum_amount": 50000,
   "loan_term": 15,
   "interest_rate": 0,
   "forgiveness_structure": "Loan forgiven at rate of 1/15th per year of continued occupancy"
 }',
 '{"Photo ID", "Proof of Income", "Property Deed", "Tax Returns", "Insurance Information"}',
 '[
   {"question": "How much can I borrow?", "answer": "Up to $50,000 depending on income and scope of repairs needed."},
   {"question": "Do I have to pay the loan back?", "answer": "The loan is forgiven at 1/15th per year as long as you continue to live in the home."},
   {"question": "What repairs are covered?", "answer": "Health and safety repairs, accessibility improvements, energy efficiency upgrades, and structural repairs."}
 ]',
 (SELECT id FROM users WHERE email = 'admin@dndc.org'))
ON CONFLICT DO NOTHING;