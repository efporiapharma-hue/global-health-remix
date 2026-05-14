import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const supabaseService = {
  // Patients
  getPatients: async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching patients:', error.message);
      return null;
    }
  },

  createPatient: async (patient: any) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([patient])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating patient:', error.message);
      return null;
    }
  },

  updatePatient: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error updating patient:', error.message);
      return null;
    }
  },

  deletePatient: async (id: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting patient:', error.message);
      return false;
    }
  },

  // Appointments
  getAppointments: async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(name, mrn, age, gender)')
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching appointments:', error.message);
      return null;
    }
  },

  createAppointment: async (appointment: any) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointment])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating appointment:', error.message);
      return null;
    }
  },

  // Prescriptions
  getPrescriptions: async (patientId?: string) => {
    try {
      let query = supabase
        .from('prescriptions')
        .select('*, patients(name, mrn)');
      
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error.message);
      return null;
    }
  },

  createPrescription: async (prescription: any) => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert([prescription])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating prescription:', error.message);
      return null;
    }
  },

  // Invoices / Billing
  getInvoices: async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(name, mrn, phone, email), invoice_items(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching invoices:', error.message);
      return null;
    }
  },

  createInvoice: async (invoice: any, items: any[]) => {
    try {
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .insert([invoice])
        .select();
      
      if (invError) throw invError;
      
      const invoiceId = invData[0].id;
      const itemsToInsert = items.map(item => ({ ...item, invoice_id: invoiceId }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
      
      return invData[0];
    } catch (error: any) {
      console.error('Error creating invoice:', error.message);
      return null;
    }
  },

  deleteInvoice: async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting invoice:', error.message);
      return false;
    }
  },

  // Lab Tests & Orders
  getLabTests: async () => {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching lab tests:', error.message);
      return null;
    }
  },

  getLabTestRequests: async () => {
    try {
      const { data, error } = await supabase
        .from('test_requests')
        .select('*, patients(name, mrn), profiles:requested_by(name)')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching lab test requests:', error.message);
      return null;
    }
  },

  createLabTestRequest: async (request: any) => {
    try {
      const { data, error } = await supabase
        .from('test_requests')
        .insert([request])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating lab test request:', error.message);
      return null;
    }
  },

  updateLabTestRequest: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('test_requests')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error updating lab test request:', error.message);
      return null;
    }
  },

  deleteLabTestRequest: async (id: string) => {
    try {
      const { error } = await supabase
        .from('test_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting lab test request:', error.message);
      return false;
    }
  },

  // Hospital Info
  getHospitalInfo: async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_info')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || {
        name: 'Medicare Multispeciality Hospital',
        address: '123 Health Ave, Medical District, New Delhi, India 110001',
        phone: '+91 11 2345 6789',
        email: 'info@medicarehospital.com',
        website: 'www.medicarehospital.com'
      };
    } catch (error: any) {
      console.error('Error fetching hospital info:', error.message);
      return null;
    }
  },

  // Staff / Profiles
  getStaff: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching staff:', error.message);
      return null;
    }
  },

  createStaff: async (profile: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating staff:', error.message);
      return null;
    }
  },

  updateStaff: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error updating staff:', error.message);
      return null;
    }
  },

  deleteStaff: async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting staff:', error.message);
      return false;
    }
  },

  // Maternity
  getDeliveries: async () => {
    try {
      const { data, error } = await supabase
        .from('maternity_deliveries')
        .select('*, patients(name, mrn), profiles:surgeon_id(name)')
        .order('delivery_date', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching deliveries:', error.message);
      return null;
    }
  },

  createDelivery: async (delivery: any) => {
    try {
      const { data, error } = await supabase
        .from('maternity_deliveries')
        .insert([delivery])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating delivery:', error.message);
      return null;
    }
  },

  getNewborns: async () => {
    try {
      const { data, error } = await supabase
        .from('maternity_newborns')
        .select('*, patients:mother_id(name, mrn)')
        .order('birth_date_time', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching newborns:', error.message);
      return null;
    }
  },

  // OT (Operation Theatre)
  getOTRooms: async () => {
    try {
      const { data, error } = await supabase
        .from('ot_rooms')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching OT rooms:', error.message);
      return null;
    }
  },

  getOTSchedules: async () => {
    try {
      const { data, error } = await supabase
        .from('ot_schedules')
        .select('*, patients(name, mrn), profiles:surgeon_id(name), ot_rooms(name)')
        .order('operation_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching OT schedules:', error.message);
      return null;
    }
  },

  createOTSchedule: async (schedule: any) => {
    try {
      const { data, error } = await supabase
        .from('ot_schedules')
        .insert([schedule])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating OT schedule:', error.message);
      return null;
    }
  },

  deleteOTRecord: async (id: string) => {
    try {
      const { error } = await supabase
        .from('ot_schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting OT record:', error.message);
      return false;
    }
  },

  // Insurance
  getInsuranceClaims: async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*, patients(name, mrn)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching insurance claims:', error.message);
      return null;
    }
  },

  createInsuranceClaim: async (claim: any) => {
    try {
      const { data, error } = await supabase
        .from('insurance_claims')
        .insert([claim])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating insurance claim:', error.message);
      return null;
    }
  },

  deleteInsuranceClaim: async (id: string) => {
    try {
      const { error } = await supabase
        .from('insurance_claims')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting insurance claim:', error.message);
      return false;
    }
  },

  // Nursing Station
  getNursingTasks: async (ward?: string) => {
    try {
      let query = supabase
        .from('nursing_notes')
        .select('*, patients(name, mrn, age, gender)');
      
      if (ward) {
        // Since there's no ward column in nursing_notes usually, 
        // we might need to join with admissions or beds if we want to filter by ward
        // For now, let's just return all notes
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching nursing tasks:', error.message);
      return null;
    }
  },

  getNurseShifts: async () => {
    try {
      const { data, error } = await supabase
        .from('nurse_shifts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching nurse shifts:', error.message);
      return null;
    }
  },

  updateNursingTask: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('nursing_notes')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error updating nursing task:', error.message);
      return null;
    }
  },

  deleteNursingTask: async (id: string) => {
    try {
      const { error } = await supabase
        .from('nursing_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting nursing task:', error.message);
      return false;
    }
  },

  createNursingTask: async (task: any) => {
    try {
      const { data, error } = await supabase
        .from('nursing_notes')
        .insert([task])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating nursing task:', error.message);
      return null;
    }
  },

  getNursingHandovers: async (ward?: string) => {
    try {
      let query = supabase
        .from('nursing_handovers')
        .select('*, outgoing_nurse:outgoing_nurse_id(name), incoming_nurse:incoming_nurse_id(name)');
      
      if (ward) {
        query = query.eq('ward', ward);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching handovers:', error.message);
      return null;
    }
  },

  createNursingHandover: async (handover: any) => {
    try {
      const { data, error } = await supabase
        .from('nursing_handovers')
        .insert([handover])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating handover:', error.message);
      return null;
    }
  },

  // Expenses
  getExpenses: async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching expenses:', error.message);
      return null;
    }
  },

  createExpense: async (expense: any) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating expense:', error.message);
      return null;
    }
  },

  deleteExpense: async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting expense:', error.message);
      return false;
    }
  },

  // Beds
  getBeds: async () => {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select('*')
        .order('bed_number', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching beds:', error.message);
      return null;
    }
  },

  createBed: async (bed: any) => {
    try {
      const { data, error } = await supabase
        .from('beds')
        .insert([bed])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating bed:', error.message);
      return null;
    }
  },

  updateBedStatus: async (id: string, status: string, patientId?: string | null) => {
    try {
      const { data, error } = await supabase
        .from('beds')
        .update({ status, patient_id: patientId })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error updating bed status:', error.message);
      return null;
    }
  },

  deleteBed: async (id: string) => {
    try {
      const { error } = await supabase
        .from('beds')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting bed:', error.message);
      return false;
    }
  },

  // Admissions
  createAdmission: async (admission: any) => {
    try {
      const { data, error } = await supabase
        .from('admissions')
        .insert([admission])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating admission:', error.message);
      return null;
    }
  },

  dischargePatient: async (admissionId: string, dischargeDate: string) => {
    try {
      const { data, error } = await supabase
        .from('admissions')
        .update({ status: 'Discharged', discharge_date: dischargeDate })
        .eq('id', admissionId)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error discharging patient:', error.message);
      return null;
    }
  },

  // Vitals
  getPatientVitals: async (patientId?: string) => {
    try {
      let query = supabase
        .from('patient_vitals')
        .select('*');
      
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query.order('recorded_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching vitals:', error.message);
      return null;
    }
  },

  updateVitals: async (vitals: any) => {
    try {
      const { data, error } = await supabase
        .from('patient_vitals')
        .insert([vitals])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error updating vitals:', error.message);
      return null;
    }
  },

  // Clinical Notes
  getClinicalNotes: async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clinical_notes')
        .select('*, profiles(name)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching clinical notes:', error.message);
      return null;
    }
  },

  createClinicalNote: async (note: any) => {
    try {
      const { data, error } = await supabase
        .from('clinical_notes')
        .insert([note])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating clinical note:', error.message);
      return null;
    }
  },

  // Pharmacy
  getPharmacyItems: async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_items')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching pharmacy items:', error.message);
      return null;
    }
  },

  createPharmacyItem: async (item: any) => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_items')
        .insert([item])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error creating pharmacy item:', error.message);
      return null;
    }
  },

  updatePharmacyItem: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_items')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error updating pharmacy item:', error.message);
      return null;
    }
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      // Get counts from various tables
      const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      const { count: appointmentCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
      const { count: admissionCount } = await supabase.from('admissions').select('*', { count: 'exact', head: true });
      
      // Get total revenue
      const { data: revenueData } = await supabase.from('invoices').select('paid_amount');
      const totalRevenue = revenueData?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0;

      return {
        patientCount: patientCount || 0,
        appointmentCount: appointmentCount || 0,
        admissionCount: admissionCount || 0,
        totalRevenue
      };
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error.message);
      return null;
    }
  }
};
