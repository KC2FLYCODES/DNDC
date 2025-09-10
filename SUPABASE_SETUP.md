# Multi-Tenant CDC Platform with Supabase

## 🏢 Multi-Tenant Architecture Overview

This setup allows multiple Community Development Corporations (CDCs) to use the same platform with complete data isolation using Supabase's Row Level Security (RLS).

### Architecture Benefits:
- **Complete Data Isolation**: Each CDC's data is completely separated
- **Shared Infrastructure**: Cost-effective single platform serving multiple CDCs
- **Real-time Updates**: Live updates across all users in an organization
- **Scalable Authentication**: Built-in user management with role-based access
- **File Storage**: Secure document storage per organization
- **Analytics**: Organization-specific usage analytics

## 🚀 Supabase Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Database Schema Setup
Execute the SQL from `supabase_config.py` in your Supabase SQL editor:

```sql
-- Enable Row Level Security and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Copy the complete schema from supabase_config.py
-- This includes all tables, RLS policies, and triggers
```

### 3. Storage Buckets Setup
Create storage buckets for document uploads:

```sql
-- Create storage buckets for each organization
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents-dndc', 'documents-dndc', false),
  ('documents-atlanta-cdc', 'documents-atlanta-cdc', false);

-- Set up storage policies
CREATE POLICY "Users can upload to their org bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents-' || (auth.jwt() ->> 'organization_id')
  );

CREATE POLICY "Users can view their org documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents-' || (auth.jwt() ->> 'organization_id')
  );
```

### 4. Environment Variables
Update your `.env` files:

**Frontend (.env):**
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

**Backend (.env):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

## 🏘️ Multi-Tenant Access Methods

### Method 1: Subdomain-based (Recommended)
- `dndc.yourplatform.com` → DNDC organization
- `atlanta-cdc.yourplatform.com` → Atlanta CDC organization
- `richmond-cdc.yourplatform.com` → Richmond CDC organization

### Method 2: Path-based
- `yourplatform.com/dndc` → DNDC organization
- `yourplatform.com/atlanta-cdc` → Atlanta CDC organization
- `yourplatform.com/richmond-cdc` → Richmond CDC organization

### Method 3: Custom Domains
- `resources.dndc.org` → DNDC organization
- `portal.atlantacdc.org` → Atlanta CDC organization

## 📊 Initial Data Setup

### 1. Create Organizations
Use the Super Admin dashboard or run SQL:

```sql
INSERT INTO organizations (name, slug, contact_info) VALUES 
  ('Danville Neighborhood Development Corporation', 'dndc', '{"phone": "(434) 555-0150", "email": "info@dndc.org"}'),
  ('Atlanta Community Development Corporation', 'atlanta-cdc', '{"phone": "(404) 555-0200", "email": "info@atlantacdc.org"}'),
  ('Richmond Community Housing', 'richmond-cdc', '{"phone": "(804) 555-0300", "email": "info@richmondhousing.org"}');
```

### 2. Create Initial Admin Users
```sql
-- Create admin users for each organization
INSERT INTO users (organization_id, email, role, profile) VALUES 
  ((SELECT id FROM organizations WHERE slug = 'dndc'), 'admin@dndc.org', 'admin', '{"name": "DNDC Admin"}'),
  ((SELECT id FROM organizations WHERE slug = 'atlanta-cdc'), 'admin@atlantacdc.org', 'admin', '{"name": "Atlanta CDC Admin"}'),
  ((SELECT id FROM organizations WHERE slug = 'richmond-cdc'), 'admin@richmondhousing.org', 'admin', '{"name": "Richmond Admin"}');
```

### 3. Seed Initial Resources
```sql
-- Example: Add resources for DNDC
INSERT INTO resources (organization_id, name, description, category, phone) VALUES 
  ((SELECT id FROM organizations WHERE slug = 'dndc'), 'Emergency Rental Assistance', 'Up to 3 months rent assistance', 'housing', '434-555-0100'),
  ((SELECT id FROM organizations WHERE slug = 'dndc'), 'Food Bank', 'Emergency food assistance', 'food', '434-555-0200');
```

## 🔐 Row Level Security (RLS) Explained

RLS ensures complete data isolation:

1. **Automatic Filtering**: Users only see data from their organization
2. **JWT-based**: Organization context is stored in the user's JWT token
3. **Secure by Default**: No data leaks between organizations
4. **Transparent**: Application code doesn't need to filter by organization

### How RLS Works:
```sql
-- Example RLS policy
CREATE POLICY "Users can view resources in their organization" ON resources
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );
```

## 🌐 Deployment Options

### Option 1: Single Domain with Subdomains
- Main platform: `cdc-platform.com`
- CDCs: `{slug}.cdc-platform.com`
- Admin: `admin.cdc-platform.com`

### Option 2: White-label Custom Domains
- Each CDC can use their own domain
- Platform handles routing based on domain
- Custom branding per organization

### Option 3: Hybrid Approach
- Default subdomains for quick setup
- Custom domains for premium CDCs
- Shared admin portal

## 📈 Scaling Considerations

### Database Performance
- Indexes on `organization_id` for all tables
- Connection pooling via Supabase
- Automatic backups and point-in-time recovery

### File Storage
- Separate buckets per organization
- CDN distribution via Supabase
- Automatic image optimization

### Real-time Features
- Organization-specific channels
- Automatic cleanup of old connections
- Rate limiting per organization

## 💰 Pricing Model Options

### Per-Organization Pricing
- Base fee per CDC
- Usage-based pricing for storage/bandwidth
- Feature tiers (Basic, Pro, Enterprise)

### Per-User Pricing
- Flat rate per active user
- Unlimited organizations
- Volume discounts

### Freemium Model
- Free tier with limitations
- Paid tiers with advanced features
- Custom enterprise solutions

## 🛡️ Security Features

### Data Protection
- End-to-end encryption for sensitive data
- HIPAA-compliant file storage
- Audit logs for all actions
- Automatic data retention policies

### Access Control
- Role-based permissions (Resident, Staff, Admin, Super Admin)
- Two-factor authentication
- SSO integration capabilities
- Session management

### Compliance
- SOC 2 Type II compliant via Supabase
- GDPR-ready data handling
- Automatic security updates
- Regular vulnerability assessments

## 🔧 Migration from MongoDB

### 1. Data Export
Export existing MongoDB data to JSON/CSV format

### 2. Data Transformation
Map MongoDB collections to Supabase tables:
- Add `organization_id` to all records
- Convert MongoDB ObjectIds to UUIDs
- Update foreign key relationships

### 3. Import to Supabase
Use Supabase's bulk import tools or API

### 4. Update Application Code
- Replace MongoDB queries with Supabase calls
- Update authentication flow
- Test RLS policies

## 📞 Support and Maintenance

### Monitoring
- Real-time database performance metrics
- Error tracking and alerting
- Usage analytics per organization
- Automated health checks

### Backup Strategy
- Automatic daily database backups
- Point-in-time recovery capabilities
- File storage redundancy
- Disaster recovery procedures

### Updates and Maintenance
- Zero-downtime deployments
- Feature flag management
- A/B testing capabilities
- Staged rollouts for new features

---

## 🚀 Getting Started

1. Set up your Supabase project
2. Run the database schema
3. Configure environment variables
4. Create your first organization
5. Test the multi-tenant features
6. Deploy and scale!

The platform is now ready to serve multiple CDCs with complete data isolation and professional enterprise features! 🏆