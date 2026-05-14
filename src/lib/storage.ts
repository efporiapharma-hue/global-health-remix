
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading storage key "${key}":`, error);
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing storage key "${key}":`, error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }
};

export const STORAGE_KEYS = {
  PATIENTS: 'hms_patients',
  APPOINTMENTS: 'hms_appointments',
  BILLING: 'hms_billing',
  LAB_BILLS: 'hms_lab_bills',
  INVENTORY: 'hms_inventory',
  EXPENSES: 'hms_expenses',
  INSURANCE: 'hms_insurance',
  NURSING_TASKS: 'hms_nursing_tasks',
  BEDS: 'hms_beds',
  PHARMACY_BILLS: 'hms_pharmacy_billing',
  PRESCRIPTIONS: 'hms_prescriptions',
  TEMPLATE_IMAGE: 'hms_template_image',
  BED_RATES: 'hms_bed_rates',
  OT_RATES: 'hms_ot_rates',
  LAB_RATES: 'hms_lab_rates',
  MATERIAL_RATES: 'hms_material_rates',
  HOSPITAL_INFO: 'hms_hospital_info',
  USERS: 'hms_users',
  AUDIT_LOGS: 'hms_audit_logs',
  SESSION_USER: 'hms_session_user',
  AUTH_STATUS: 'hms_auth_status',
  LAB_TEST_ORDERS: 'hms_lab_test_orders',
  EXTERNAL_REPORTS: 'hms_external_reports',
  RADIOLOGY_FILES: 'hms_radiology_files',
  PATIENT_VITALS: 'hms_patient_vitals',
};
