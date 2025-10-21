# Supabase Multi-Tenant Architecture Guide

## Overview

Your DNDC Resource Hub uses **Supabase** (PostgreSQL database) for multi-tenant functionality, allowing multiple organizations to use the same platform while keeping their data completely isolated.

---

## 🏢 Multi-Tenant Architecture Explained

### What is Multi-Tenancy?

**Multi-tenancy** means multiple organizations (tenants) can use your application, each with their own:
- Separate data (programs, users, applications)
- Custom branding (logos, colors)
- Independent admin access
- Isolated settings and configurations

**Example:**
- **DNDC** uses the platform → sees only DNDC programs and data
- **ABC Housing** uses the platform → sees only their programs and data
- **XYZ Community Center** uses the platform → sees only their programs and data

All organizations share the same codebase but have completely separated data.

---

## 🗄️ Database Structure

### Current Supabase Tables:

#### 1. **organizations** table
Stores information about each tenant organization:
```sql
- id (UUID, primary key)
- organization_name (text)
- slug (text, unique) - URL identifier
- created_at (timestamp)
- settings (jsonb) - logo, theme colors, etc.
```

#### 2. **programs** table  
Stores housing/assistance programs:
```sql
- id (UUID, primary key)
- organization_id (UUID, foreign key to organizations)
- program_name (text)
- program_description (text)
- program_type (text)
- eligibility_criteria (text)
- created_at (timestamp)
```

**Key Point:** Every program has an `organization_id` that links it to a specific organization.

---

## 🔐 Row Level Security (RLS)

Supabase uses **Row Level Security** to automatically filter data:

```sql
-- Example RLS policy for programs table
CREATE POLICY "Users can only see their organization's programs"
ON programs
FOR SELECT
USING (organization_id = current_organization_id());
```

This means:
- When **DNDC admin** queries programs → only sees DNDC programs
- When **ABC Housing admin** queries programs → only sees ABC Housing programs
- **Complete data isolation** at the database level

---

## 👤 Creating a Super Admin Account

### Option 1: Super Admin (View All Organizations)

To create an admin that can view ALL organizations:

#### Step 1: Add a super_admins table to Supabase

```sql
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grant super admin privileges
INSERT INTO super_admins (email, full_name) 
VALUES ('your-email@example.com', 'Your Name');
```

#### Step 2: Update RLS policies to allow super admin access

```sql
-- Modify programs policy to allow super admins
CREATE POLICY "Super admins can see all programs"
ON programs
FOR SELECT
USING (
  -- Either it's their organization OR they're a super admin
  organization_id = current_organization_id() 
  OR 
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE email = auth.email()
  )
);
```

#### Step 3: Add super admin UI in your frontend

Create a toggle in admin dashboard:
- "View as Organization: DNDC" (normal admin view)
- "View as Organization: All" (super admin view - see all data)

---

### Option 2: Testing Organization

To create a test organization for experimentation:

#### Step 1: Insert test organization via Supabase Dashboard

Go to: https://supabase.com/dashboard → Your Project → Table Editor → organizations

```sql
INSERT INTO organizations (id, organization_name, slug, settings)
VALUES (
  uuid_generate_v4(),
  'Test Organization',
  'test-org',
  '{"logoUrl": "https://via.placeholder.com/200x80/5CB85C/FFFFFF?text=Test+Org", "primaryColor": "#5CB85C"}'
);
```

#### Step 2: Create test programs for this organization

```sql
-- Get the test org ID first
SELECT id FROM organizations WHERE slug = 'test-org';

-- Insert test programs (replace <test-org-id> with actual ID)
INSERT INTO programs (organization_id, program_name, program_description, program_type)
VALUES 
  ('<test-org-id>', 'Test Housing Program', 'A test housing program', 'housing'),
  ('<test-org-id>', 'Test Rental Assistance', 'Test rental assistance program', 'rental_assistance');
```

#### Step 3: Switch between organizations in your app

Update the `MultiTenantWrapper.js` to allow switching:

```javascript
// In your admin panel, add organization switcher
const [currentOrganization, setCurrentOrganization] = useState('dndc');

// Load data based on selected organization
useEffect(() => {
  fetchOrganizations();
}, [currentOrganization]);
```

---

## 🚀 How It Works in Your App

### Current Setup (DNDC Only):

```javascript
// MultiTenantWrapper.js
const currentOrganization = 'dndc'; // Hardcoded to DNDC
```

All queries fetch data for DNDC organization only.

### Multi-Tenant Setup (Multiple Organizations):

1. **User logs in** → System identifies their organization (from their email domain or manual assignment)
2. **Organization context is set** → All subsequent queries filter by organization_id
3. **User sees only their data** → Programs, applications, etc. for their organization only
4. **Complete isolation** → Cannot access or see other organizations' data

---

## 📝 Adding a New Organization (Step-by-Step)

### Via Supabase Dashboard:

1. Go to: https://supabase.com/dashboard
2. Navigate to: Table Editor → organizations
3. Click "Insert row"
4. Fill in:
   - `id`: (auto-generated)
   - `organization_name`: "New Housing Organization"
   - `slug`: "new-housing-org"
   - `settings`: `{"logoUrl": "...", "primaryColor": "#..."}`
5. Click "Save"

### Via SQL Editor:

```sql
INSERT INTO organizations (organization_name, slug, settings)
VALUES (
  'Community Housing Alliance',
  'cha',
  '{
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#5CB85C",
    "secondaryColor": "#007bff"
  }'
);
```

---

## 🧪 Testing Multi-Tenancy

### Test Scenario 1: Create Two Organizations

1. Create Organization A (DNDC)
2. Create Organization B (Test Org)
3. Add 3 programs for Organization A
4. Add 3 programs for Organization B
5. Switch context between organizations
6. Verify each organization only sees their own programs

### Test Scenario 2: Super Admin View

1. Create super admin account
2. Login as super admin
3. Verify you can see all organizations' data
4. Switch between organization views
5. Test data filtering works correctly

---

## 🔧 Configuration in Your App

### Current Environment Variables:

```env
# Frontend (.env)
REACT_APP_SUPABASE_URL=https://tbgzelmgdvkgdepirdzn.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...

# Backend (.env)
SUPABASE_URL=https://tbgzelmgdvkgdepirdzn.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci... (server-side only)
```

### Files Using Supabase:

- `/app/frontend/src/lib/supabase.js` - Client initialization
- `/app/frontend/src/components/ProgramManagement.js` - CRUD operations
- `/app/backend/supabase_config.py` - Server-side config
- `/app/backend/supabase_service.py` - Backend API integration

---

## 📊 Data Flow Diagram

```
User Login
    ↓
Identify Organization (DNDC, Test Org, etc.)
    ↓
Set Organization Context (organization_id)
    ↓
All Queries Filter by organization_id
    ↓
User Sees Only Their Organization's Data
    ↓
[RLS Policies Enforce Isolation at Database Level]
```

---

## 🎯 Summary

### For DNDC (Current Setup):
- Your app is configured for **DNDC** as the primary organization
- `organization_id` = "97fef08b-4fde-484d-b334-4b9450f9a280" (DNDC's ID)
- All programs, applications, etc. belong to DNDC

### For Multi-Tenant Future:
- Easy to add more organizations via Supabase
- Each organization gets isolated data
- RLS policies handle security automatically
- Super admin can view all organizations for testing/management

### Creating Super Admin:
1. Add your email to `super_admins` table in Supabase
2. Update RLS policies to grant access
3. Add organization switcher in admin UI
4. Can now view all organizations or test specific ones

---

## 🔗 Useful Supabase Links

- **Dashboard**: https://supabase.com/dashboard
- **Docs**: https://supabase.com/docs
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Multi-tenancy Guide**: https://supabase.com/docs/guides/database/multi-tenancy

---

## ❓ Common Questions

**Q: Can I add organizations without code changes?**  
A: Yes! Just insert into the `organizations` table via Supabase dashboard.

**Q: How do I test with multiple organizations?**  
A: Create test organizations in Supabase, then add an organization switcher in your admin panel.

**Q: Is data truly isolated?**  
A: Yes! RLS policies enforce isolation at the database level. One organization cannot access another's data.

**Q: Can I create a super admin?**  
A: Yes! Add your email to a `super_admins` table and update RLS policies accordingly.

**Q: Do I need to deploy for each organization?**  
A: No! Single deployment serves all organizations. Each gets their own subdomain or uses organization slug in URL.

---

## 🚀 Next Steps

1. **Create Test Organization**: Add a test org in Supabase to experiment
2. **Add Super Admin Table**: Create `super_admins` table for yourself
3. **Build Organization Switcher**: Add UI to switch between organizations
4. **Test Data Isolation**: Verify RLS policies work correctly
5. **Deploy**: Your multi-tenant platform is ready!

---

**Need Help?**  
- Supabase Support: https://supabase.com/support
- Database issues: Check Supabase logs and RLS policies
- Frontend context issues: Verify `MultiTenantWrapper.js` organization detection
