-- Supabase SQL Schema for Hospital Management System
-- Run this in your Supabase SQL Editor

-- 1. Profiles / Users (Depends on auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SURGEON', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT', 'LAB_TECHNICIAN', 'PHARMACIST')),
  department TEXT,
  designation TEXT,
  phone TEXT,
  degree TEXT,
  specialization TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hospital Information
CREATE TABLE IF NOT EXISTS public.hospital_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  tagline TEXT,
  registration_number TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Patients
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn TEXT UNIQUE NOT NULL, 
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  dob DATE,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  address TEXT,
  guardian_name TEXT,
  father_name TEXT,
  father_phone TEXT,
  husband_name TEXT,
  husband_phone TEXT,
  tpa_id TEXT,
  tpa_validity DATE,
  status TEXT DEFAULT 'Active',
  registration_type TEXT DEFAULT 'OPD',
  needs_admission BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Beds & Wards
CREATE TABLE IF NOT EXISTS public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number TEXT NOT NULL,
  ward TEXT NOT NULL,
  bed_type TEXT NOT NULL,
  status TEXT DEFAULT 'Available',
  daily_rate DECIMAL(10, 2) DEFAULT 0.00,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments (OPD)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  token_number INTEGER,
  urgency TEXT DEFAULT 'Routine',
  status TEXT DEFAULT 'Scheduled',
  fee DECIMAL(10, 2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. IPD Admissions
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  bed_id UUID REFERENCES public.beds(id),
  doctor_id UUID REFERENCES public.profiles(id),
  admission_date TIMESTAMPTZ DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  reason TEXT,
  initial_deposit DECIMAL(10, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Admitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Clinical Notes & Vitals
CREATE TABLE IF NOT EXISTS public.patient_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES public.profiles(id),
  temperature DECIMAL(5, 2),
  blood_pressure TEXT,
  pulse INTEGER,
  respiration INTEGER,
  spo2 INTEGER,
  weight DECIMAL(5, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  note_type TEXT CHECK (note_type IN ('DOCTOR', 'NURSE')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Investigations & Lab Tests
CREATE TABLE IF NOT EXISTS public.lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, 
  price DECIMAL(10, 2) DEFAULT 0.00,
  department_id UUID REFERENCES public.departments(id)
);

CREATE TABLE IF NOT EXISTS public.test_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.lab_tests(id),
  requested_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'Pending',
  results JSONB,
  report_url TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 10. Pharmacy Inventory
CREATE TABLE IF NOT EXISTS public.pharmacy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  min_stock_level INTEGER DEFAULT 10, -- Alias for UI consistency
  unit TEXT, -- e.g., 'Tablets', 'Bottle'
  expiry_date DATE,
  purchase_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  mrp DECIMAL(10, 2),
  tax_percentage DECIMAL(5, 2) DEFAULT 0.00,
  hsn_code TEXT,
  batch_number TEXT,
  rack_number TEXT,
  manufacturer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10.1 Pharmacy Purchases (Tracking Stock Inflow)
CREATE TABLE IF NOT EXISTS public.pharmacy_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.pharmacy_items(id),
  supplier_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  expiry_date DATE,
  invoice_number TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.pharmacy_items(id),
  transaction_type TEXT CHECK (transaction_type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'EXPIRED')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  reference_id TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Billing & Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  payable_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'Unpaid',
  payment_method TEXT,
  tpa_approval_status TEXT,
  issued_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  tax_percentage DECIMAL(5, 2) DEFAULT 0.00,
  category TEXT,
  source_type TEXT, -- e.g., 'LAB_TEST', 'PHARMACY_ITEM', 'OT_PROCEDURE', 'BED_CHARGE'
  source_id UUID -- Link to the specific record in lab_tests, pharmacy_items, etc.
);

-- 12. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  paid_to TEXT,
  status TEXT DEFAULT 'Paid',
  recorded_by UUID REFERENCES public.profiles(id),
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. OT Management (Operation Theater)
CREATE TABLE IF NOT EXISTS public.ot_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  surgery_date DATE NOT NULL,
  surgery_time TIME NOT NULL,
  surgeon_id UUID REFERENCES public.profiles(id),
  anesthetist_id UUID REFERENCES public.profiles(id),
  ot_number TEXT,
  status TEXT DEFAULT 'Scheduled', -- Scheduled, In-Progress, Completed, Cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Nursing Observations (Specifically for Nursing Station)
CREATE TABLE IF NOT EXISTS public.nursing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  nurse_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  alert_level TEXT DEFAULT 'normal' CHECK (alert_level IN ('normal', 'moderate', 'high')),
  is_medication_intake BOOLEAN DEFAULT FALSE,
  is_patient_request BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Lab Test Groups (Master Setup)
CREATE TABLE IF NOT EXISTS public.lab_test_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('Pathology', 'Radiology')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Enhanced Lab Tests (Master Setup)
-- Note: Reference columns added to existing lab_tests handle the UI fields for Master Setup
ALTER TABLE public.lab_tests ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.lab_test_groups(id);
ALTER TABLE public.lab_tests ADD COLUMN IF NOT EXISTS unit TEXT; -- e.g., g/dL
ALTER TABLE public.lab_tests ADD COLUMN IF NOT EXISTS reference_range TEXT; -- e.g., 13.5 - 17.5
ALTER TABLE public.lab_tests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 18. Lab Packages (Master Setup)
CREATE TABLE IF NOT EXISTS public.lab_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.lab_packages(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.lab_tests(id) ON DELETE CASCADE
);

-- 19. Maternity Records (Birth & Delivery)
CREATE TABLE IF NOT EXISTS public.birth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES public.admissions(id), -- Link to specific ward stay
  delivery_date DATE NOT NULL,
  delivery_time TIME NOT NULL,
  baby_gender TEXT, -- 'male', 'female'
  baby_weight DECIMAL(5, 2), -- kg
  delivery_type TEXT, -- 'normal', 'c-section', etc.
  doctor_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure admission_id exists for existing tables
ALTER TABLE public.birth_records ADD COLUMN IF NOT EXISTS admission_id UUID REFERENCES public.admissions(id);

-- 20. External Reports (Uploaded from other centers)
CREATE TABLE IF NOT EXISTS public.external_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT, -- PDF, Image, etc.
  file_url TEXT NOT NULL,
  source_center TEXT, -- Name of the external laboratory/center
  uploaded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nursing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_test_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow authenticated read access as a starting point)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.patients;
CREATE POLICY "Enable read access for authenticated users" ON public.patients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.patients;
CREATE POLICY "Enable insert for authenticated users" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.patients;
CREATE POLICY "Enable update for authenticated users" ON public.patients FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.patients;
CREATE POLICY "Enable delete for authenticated users" ON public.patients FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.departments;
CREATE POLICY "Enable read access for authenticated users" ON public.departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.beds;
CREATE POLICY "Enable read access for authenticated users" ON public.beds FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.pharmacy_items;
CREATE POLICY "Enable read access for authenticated users" ON public.pharmacy_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ot_schedules;
CREATE POLICY "Enable read access for authenticated users" ON public.ot_schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.nursing_notes;
CREATE POLICY "Enable read access for authenticated users" ON public.nursing_notes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.lab_test_groups;
CREATE POLICY "Enable read access for authenticated users" ON public.lab_test_groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.lab_packages;
CREATE POLICY "Enable read access for authenticated users" ON public.lab_packages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.external_reports;
CREATE POLICY "Enable read access for authenticated users" ON public.external_reports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.hospital_info;
CREATE POLICY "Enable read access for authenticated users" ON public.hospital_info FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.admissions;
CREATE POLICY "Enable read access for authenticated users" ON public.admissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.patient_vitals;
CREATE POLICY "Enable read access for authenticated users" ON public.patient_vitals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.clinical_notes;
CREATE POLICY "Enable read access for authenticated users" ON public.clinical_notes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.lab_tests;
CREATE POLICY "Enable read access for authenticated users" ON public.lab_tests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.test_requests;
CREATE POLICY "Enable read access for authenticated users" ON public.test_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.invoices;
CREATE POLICY "Enable read access for authenticated users" ON public.invoices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.invoice_items;
CREATE POLICY "Enable read access for authenticated users" ON public.invoice_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.birth_records;
CREATE POLICY "Enable read access for authenticated users" ON public.birth_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.pharmacy_purchases;
CREATE POLICY "Enable read access for authenticated users" ON public.pharmacy_purchases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inventory_transactions;
CREATE POLICY "Enable read access for authenticated users" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.expenses;
CREATE POLICY "Enable read access for authenticated users" ON public.expenses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.audit_logs;
CREATE POLICY "Enable read access for authenticated users" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = '';

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_modtime ON public.patients;
CREATE TRIGGER update_patients_modtime BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_pharmacy_items_modtime ON public.pharmacy_items;
CREATE TRIGGER update_pharmacy_items_modtime BEFORE UPDATE ON public.pharmacy_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_modtime ON public.invoices;
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ot_schedules_modtime ON public.ot_schedules;
CREATE TRIGGER update_ot_schedules_modtime BEFORE UPDATE ON public.ot_schedules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_nursing_notes_modtime ON public.nursing_notes;
CREATE TRIGGER update_nursing_notes_modtime BEFORE UPDATE ON public.nursing_notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_tests_modtime ON public.lab_tests;
CREATE TRIGGER update_lab_tests_modtime BEFORE UPDATE ON public.lab_tests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_packages_modtime ON public.lab_packages;
CREATE TRIGGER update_lab_packages_modtime BEFORE UPDATE ON public.lab_packages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_birth_records_modtime ON public.birth_records;
CREATE TRIGGER update_birth_records_modtime BEFORE UPDATE ON public.birth_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_reports_modtime ON public.external_reports;
CREATE TRIGGER update_external_reports_modtime BEFORE UPDATE ON public.external_reports FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_vitals_modtime ON public.patient_vitals;
CREATE TRIGGER update_patient_vitals_modtime BEFORE UPDATE ON public.patient_vitals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- SEED DATA --

-- Initial Lab Groups
INSERT INTO public.lab_test_groups (name, category) VALUES
('Biochemistry', 'Pathology'),
('Hematology', 'Pathology'),
('Microbiology', 'Pathology'),
('Serology', 'Pathology'),
('Histopathology', 'Pathology'),
('X-Ray', 'Radiology'),
('Ultrasound', 'Radiology'),
('CT Scan', 'Radiology'),
('MRI', 'Radiology')
ON CONFLICT (name) DO NOTHING;

-- Initial Departments
INSERT INTO public.departments (name, description) VALUES
('General Medicine', 'Standard outpatient and inpatient care'),
('Cardiology', 'Heart and cardiovascular system care'),
('Orthopedics', 'Musculoskeletal system care'),
('Pediatrics', 'Children and adolescent medical care'),
('Obstetrics & Gynecology', 'Female reproductive health and childbirth'),
('Surgery', 'General and specialized surgical procedures'),
('Emergency', 'Critical care and immediate response'),
('Radiology', 'Diagnostic imaging services'),
('Pathology', 'Laboratory diagnostic services')
ON CONFLICT (name) DO NOTHING;

-- Initial Lab Tests
INSERT INTO public.lab_tests (name, category, price) VALUES
('CBC (Complete Blood Count)', 'Pathology', 150.00),
('LFT (Liver Function Test)', 'Pathology', 450.00),
('KFT (Kidney Function Test)', 'Pathology', 500.00),
('Blood Sugar (F/PP)', 'Pathology', 80.00),
('Lipid Profile', 'Pathology', 600.00),
('Urine Routine', 'Pathology', 100.00),
('Chest X-Ray', 'Radiology', 250.00),
('Ultrasound (Whole Abdomen)', 'Radiology', 800.00),
('CT Scan (Brain)', 'Radiology', 3500.00);

-- VIEWS --

-- Daily Revenue View
CREATE OR REPLACE VIEW public.daily_revenue 
WITH (security_invoker = true)
AS
SELECT 
  created_at::DATE as date,
  SUM(paid_amount) as total_revenue
FROM public.invoices
WHERE payment_status IN ('Fully Paid', 'Partially Paid')
GROUP BY created_at::DATE
ORDER BY date DESC;

-- Bed Occupancy View
CREATE OR REPLACE VIEW public.bed_occupancy_summary 
WITH (security_invoker = true)
AS
SELECT 
  ward,
  COUNT(*) as total_beds,
  SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied_beds,
  SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_beds
FROM public.beds
GROUP BY ward;

-- Maternity Ward Specific View
CREATE OR REPLACE VIEW public.maternity_ward_summary
WITH (security_invoker = true)
AS
SELECT 
  p.id as patient_id,
  p.name as patient_name,
  p.mrn,
  b.bed_number,
  a.admission_date,
  br.delivery_date,
  br.delivery_time,
  br.baby_gender,
  br.delivery_type,
  a.status as admission_status
FROM public.patients p
JOIN public.admissions a ON p.id = a.patient_id
JOIN public.beds b ON a.bed_id = b.id
LEFT JOIN public.birth_records br ON p.id = br.mother_id AND a.id = br.admission_id
WHERE b.ward ILIKE '%Maternity%' AND a.status = 'Admitted';

-- Patient 360 Activity Timeline View
CREATE OR REPLACE VIEW public.patient_timeline
WITH (security_invoker = true)
AS
SELECT patient_id, 'VITAL' as activity_type, 'Vitals recorded' as description, recorded_at as activity_date, (SELECT name FROM profiles WHERE id = recorded_by) as performed_by FROM public.patient_vitals
UNION ALL
SELECT patient_id, 'NOTE', 'Clinical note added: ' || note_type, created_at, (SELECT name FROM profiles WHERE id = author_id) FROM public.clinical_notes
UNION ALL
SELECT patient_id, 'TEST', 'Lab test requested', requested_at, (SELECT name FROM profiles WHERE id = requested_by) FROM public.test_requests
UNION ALL
SELECT patient_id, 'INVOICE', 'Bill generated: ' || invoice_number, created_at, (SELECT name FROM profiles WHERE id = issued_by) FROM public.invoices
UNION ALL
SELECT patient_id, 'ADMISSION', 'Patient admitted', admission_date, (SELECT name FROM profiles WHERE id = doctor_id) FROM public.admissions
UNION ALL
SELECT patient_id, 'SURGERY', 'OT Procedure: ' || procedure_name, created_at, (SELECT name FROM profiles WHERE id = surgeon_id) FROM public.ot_schedules;

-- Security Hardening for any pre-existing SECURITY DEFINER functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace) THEN
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
        ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;
    END IF;
END $$;
-- SQL Updates for Pharmacy System
-- Run these in your Supabase SQL Editor to update an existing database

-- 1. Update pharmacy_items table
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2);
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5, 2) DEFAULT 0.00;
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- 2. Update invoice_items table to track tax per item
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5, 2) DEFAULT 0.00;

-- 3. (Optional) Rename sale_price to selling_price for clarity if needed, 
-- but we'll stick to the existing column for compatibility
-- ALTER TABLE public.pharmacy_items RENAME COLUMN sale_price TO selling_price;

-- Example of how to populate initial data for a new item with these fields
/*
INSERT INTO public.pharmacy_items (
  name, 
  category, 
  stock_quantity, 
  unit, 
  purchase_price, 
  sale_price, 
  mrp, 
  tax_percentage, 
  hsn_code, 
  batch_number, 
  rack_number
) VALUES (
  'Paracetamol 500mg', 
  'Medicine', 
  100, 
  'Tablets', 
  8.00, 
  12.00, 
  15.50, 
  12.00, 
  '3004', 
  'BTCH123', 
  'A-101'
);
*/
