import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Printer,
  Share2,
  Image as ImageIcon,
  Download,
  CreditCard,
  Receipt,
  Edit,
  Trash2,
  User,
  UserPlus,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  FileCheck,
  Eye,
  Settings,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatCurrency } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { supabaseService } from '@/services/supabaseService';
import { useDataSync } from '@/hooks/useDataSync';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

function LabQuickRegisterForm({ onRegistered }: { onRegistered: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'male'
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    const mrn = `MRN${Math.floor(Math.random() * 90000) + 10000}`;
    
    const patientToAdd = {
      name: formData.name,
      phone: formData.phone,
      age: Number(formData.age) || 0,
      gender: formData.gender,
      mrn,
      status: 'Stable',
      registration_type: 'Quick-Lab'
    };

    const result = await supabaseService.createPatient(patientToAdd);
    setLoading(false);
    
    if (result) {
      toast.success(`Patient registered successfully! MRN: ${mrn}`);
      setFormData({ name: '', phone: '', age: '', gender: 'male' });
      onRegistered();
    } else {
      toast.error('Failed to register patient');
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input 
            placeholder="Enter patient name" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input 
            placeholder="Enter phone number" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Age</Label>
          <Input 
            type="number" 
            placeholder="Age" 
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select 
            value={formData.gender}
            onValueChange={(v) => setFormData({...formData, gender: v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-medical-blue w-full" onClick={handleRegister} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Complete Registration
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Lab() {
  const [activeTab, setActiveTab] = useState<'pathology' | 'radiology' | 'external'>('pathology');
  const [mainTab, setMainTab] = useState<'orders' | 'billing' | 'appointments' | 'setup'>('orders');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [labRates, setLabRates] = useState<any[]>([]);
  const [testOrders, setTestOrders] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    patientId: '',
    type: 'LAB', // 'LAB' or 'RADIOLOGY'
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    urgency: 'Routine'
  });
  
  // Test Setup states
  const [isTestSetupOpen, setIsTestSetupOpen] = useState(false);
  const [editingTestConfig, setEditingTestConfig] = useState<any>(null);
  const [testConfigData, setTestConfigData] = useState({
    name: '',
    category: 'Pathology',
    price: 0,
    range: '',
    unit: '',
    groupId: 'misc'
  });
  
  const [templateImage, setTemplateImage] = useState<string | null>(() => storage.get(STORAGE_KEYS.TEMPLATE_IMAGE, null));
  const [hospitalInfo, setHospitalInfo] = useState(() => storage.get(STORAGE_KEYS.HOSPITAL_INFO, {
    name: 'GLOBAL HOSPITAL',
    address: '123 Healthcare Way, Medical City',
    phone: '+91 98765 43210',
    email: 'accounts@dcglobal.com',
    logo: null as string | null
  }));

  const [externalReports, setExternalReports] = useState<{id: string, patentName: string, testName: string, date: string, url: string}[]>(() => storage.get(STORAGE_KEYS.EXTERNAL_REPORTS, []));
  const [radiologyFiles, setRadiologyFiles] = useState<{id: string, orderId: string, url: string, type: string}[]>(() => storage.get(STORAGE_KEYS.RADIOLOGY_FILES, []));

  // Lab Packages
  const LAB_PACKAGES = [
    { id: 'PKG1', name: 'Executive Health Checkup', price: 2500, tests: ['CBC', 'LFT', 'KFT', 'Lipid Profile', 'Blood Sugar'] },
    { id: 'PKG2', name: 'Diabetes Screening', price: 1200, tests: ['Blood Sugar (F/PP)', 'HbA1c', 'Urine Routine'] },
    { id: 'PKG3', name: 'Fever Profile', price: 1500, tests: ['CBC', 'Widal', 'Malaria Parasite', 'Urine Routine'] },
    { id: 'PKG4', name: 'Antenatal Profile (ANC)', price: 3500, tests: ['CBC', 'Blood Group', 'HIV', 'HBsAg', 'VDRL', 'Blood Sugar'] }
  ];

  const fetchData = async () => {
    setLoading(true);
    const [patientsData, testsData, ordersData, radiologyData, invoicesData, appointmentsData] = await Promise.all([
      supabaseService.getPatients(),
      supabaseService.getLabTests(),
      supabaseService.getLabTestRequests(),
      supabaseService.getRadiologyRecords(),
      supabaseService.getInvoices(),
      supabaseService.getAppointments()
    ]);

    if (patientsData) setPatients(patientsData);
    if (testsData) setLabRates(testsData);
    
    // Combine and normalize orders
    const pathOrders = (ordersData || []).map(o => ({ ...o, category: 'pathology' }));
    const radioOrders = (radiologyData || []).map(o => ({ 
      ...o, 
      category: 'radiology',
      result_value: o.result_notes // Alias result_notes to result_value for shared UI
    }));
    setTestOrders([...pathOrders, ...radioOrders]);

    if (invoicesData) setBills(invoicesData.filter(inv => inv.invoice_items?.some((item: any) => 
      ['lab', 'path', 'radio'].includes(item.category?.toLowerCase()))));
    
    if (appointmentsData) {
      setAppointments(appointmentsData.filter((a: any) => a.type === 'LAB' || a.type === 'RADIOLOGY'));
    }

    setLoading(false);
  };

  useDataSync(fetchData);

  // All states are declared once at the top of Lab function
  const [testGroups, setTestGroups] = useState(() => storage.get('lab_test_groups', [
    { id: 'heme', name: 'Hematology' },
    { id: 'biochem', name: 'Biochemistry' },
    { id: 'serology', name: 'Serology' },
    { id: 'urine', name: 'Urine Analysis' },
    { id: 'misc', name: 'Miscellaneous' }
  ]));

  const handleExternalUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const patient = patients.find(p => p.id === selectedPatientId);
        const newReport = {
          id: `EXT-${Date.now()}`,
          patentName: patient?.name || 'Walk-in Patient',
          testName: file.name.split('.')[0],
          date: new Date().toISOString(),
          url: event.target?.result as string
        };
        const updated = [newReport, ...externalReports];
        setExternalReports(updated);
        storage.set(STORAGE_KEYS.EXTERNAL_REPORTS, updated);
        toast.success('External report uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRadiologyUpload = (e: ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFile = {
          id: `RAD-IMG-${Date.now()}`,
          orderId: orderId,
          url: event.target?.result as string,
          type: 'X-Ray'
        };
        const updated = [newFile, ...radiologyFiles];
        setRadiologyFiles(updated);
        storage.set(STORAGE_KEYS.RADIOLOGY_FILES, updated);
        toast.success('Radiology scan uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  // Result entry state
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [resultData, setResultData] = useState({
    value: '',
    findings: '',
    clinicalNotes: '',
    status: 'Completed'
  });

  // Package state
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);

  // New states for search and dialog control
  const [isNewTestOpen, setIsNewTestOpen] = useState(false);
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  // New Test Order state
  const [newTestOrder, setNewTestOrder] = useState({
    patientId: '',
    category: 'pathology',
    testName: '',
    urgency: 'routine'
  });

  // Billing State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTests, setSelectedTests] = useState<{id: string, name: string, price: number}[]>([]);
  const [paymentMode, setPaymentMode] = useState('cash');

  useEffect(() => {
    storage.set(STORAGE_KEYS.LAB_BILLS, bills);
  }, [bills]);

  useEffect(() => {
    const handleStorage = () => {
      setPatients(storage.get(STORAGE_KEYS.PATIENTS, []));
      setTemplateImage(storage.get(STORAGE_KEYS.TEMPLATE_IMAGE, null));
      setHospitalInfo(storage.get(STORAGE_KEYS.HOSPITAL_INFO, hospitalInfo));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addTestToBill = (testId: string) => {
    const test = labRates.find((t: any) => (t.id || t.name) === testId);
    if (test) {
      setSelectedTests([...selectedTests, { id: test.id || test.name, name: test.name, price: test.price || test.rate }]);
    }
  };

  const removeTestFromBill = (index: number) => {
    const newTests = [...selectedTests];
    newTests.splice(index, 1);
    setSelectedTests(newTests);
  };

  const [discount, setDiscount] = useState(0);

  const totalBillAmount = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const finalBillAmount = totalBillAmount - (totalBillAmount * (discount / 100));

  const resetBilling = () => {
    setSelectedPatientId('');
    setSelectedTests([]);
    setPaymentMode('cash');
    setPatientSearchTerm('');
    setShowPatientResults(false);
    setDiscount(0);
  };

  const handleDeleteBill = async (id: string) => {
    const success = await supabaseService.deleteInvoice(id);
    if (success) {
      setBills(bills.filter(b => b.id !== id));
      toast.success('Lab bill removed');
    } else {
      toast.error('Failed to remove bill');
    }
  };

  const getResultStatus = (value: string, range: string) => {
    if (!range || !value) return 'normal';
    try {
      const cleanRange = range.replace(/[a-zA-Z]/g, '').trim();
      const parts = cleanRange.split('-').map(p => parseFloat(p.trim()));
      if (parts.length !== 2) return 'normal';
      const val = parseFloat(value);
      if (isNaN(val)) return 'normal';
      if (val < parts[0]) return 'low';
      if (val > parts[1]) return 'high';
    } catch (e) {
      return 'normal';
    }
    return 'normal';
  };

  const handleSaveResult = async () => {
    if (!editingResult) return;
    
    const updates = {
      result_value: resultData.value,
      clinical_notes: resultData.clinicalNotes,
      status: resultData.status,
      updated_at: new Date().toISOString()
    };

    const result = await supabaseService.updateLabTestRequest(editingResult.id, updates);
    if (result) {
      setTestOrders(testOrders.map(t => t.id === editingResult.id ? { ...t, ...result } : t));
      setIsResultDialogOpen(false);
      toast.success('Test results saved successfully');
    } else {
      toast.error('Failed to save results');
    }
  };

  const printReport = (test: any) => {
    const templateImage = storage.get(STORAGE_KEYS.TEMPLATE_IMAGE, null);
    const hospitalInfo = storage.get<{
      name?: string;
      address?: string;
      phone?: string;
      logo?: string | null;
    }>(STORAGE_KEYS.HOSPITAL_INFO, {});
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print report');
      return;
    }

    const reportHtml = `
      <html>
        <head>
          <title>Laboratory Report - ${test.id}</title>
          <style>
            @page { margin: 10mm; size: A4; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #1e293b;
              line-height: 1.5;
            }
            .template-bg {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: -1;
            }
            .content { 
              position: relative;
              padding-top: ${templateImage ? '260px' : '20px'}; 
              padding-bottom: ${templateImage ? '100px' : '20px'};
              margin: 0 40px;
              z-index: 10;
            }
            .hospital-header {
              text-align: center;
              margin-bottom: 30px;
              display: ${templateImage ? 'none' : 'block'};
            }
            .hospital-name { font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: -0.025em; }
            .report-title { 
              text-align: center; 
              font-size: 20px; 
              font-weight: 800; 
              margin: 20px 0; 
              color: #0f172a; 
              text-transform: uppercase;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .patient-card { 
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 30px;
              display: grid;
              grid-template-columns: 1.5fr 1fr;
              gap: 15px;
              background-color: #f8fafc;
            }
            .info-item { font-size: 14px; }
            .info-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; margin-right: 5px; }
            .info-value { font-weight: 700; color: #0f172a; }
            
            .report-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
            .report-table th { 
              text-align: left; 
              background-color: #f1f5f9;
              padding: 12px 15px; 
              color: #475569; 
              font-size: 11px; 
              text-transform: uppercase; 
              font-weight: 700;
              border-bottom: 2px solid #e2e8f0;
            }
            .report-table td { padding: 18px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .test-name { font-weight: 800; color: #1e293b; font-size: 15px; }
            .result-value { font-weight: 800; color: #2563eb; font-size: 16px; text-align: center; }
            
            .findings-section { 
              margin-top: 30px;
              padding: 20px;
              background-color: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .footer { 
              margin-top: 80px; 
              display: flex; 
              justify-content: space-between;
              align-items: flex-end;
              padding-bottom: 40px;
            }
            .sig-area { text-align: center; }
            .sig-line { border-top: 2px solid #0f172a; width: 180px; margin-bottom: 10px; }
            .sig-text { font-weight: 700; font-size: 14px; }
            .hospital-info { font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          ${templateImage ? `<div class="template-bg"><img src="${templateImage}" style="width: 100%;" /></div>` : ''}
          <div class="content">
            <div class="hospital-header">
              ${hospitalInfo.logo ? `<img src="${hospitalInfo.logo}" style="height: 60px; margin-bottom: 10px;" />` : ''}
              <div class="hospital-name">${hospitalInfo.name}</div>
              <div class="hospital-info">${hospitalInfo.address} | Tel: ${hospitalInfo.phone}</div>
            </div>

            <div class="report-title">Laboratory Investigation Report</div>

            <div class="patient-card">
              <div class="info-item"><span class="info-label">Patient Name:</span> <span class="info-value">${test.patient}</span></div>
              <div class="info-item" style="text-align: right;"><span class="info-label">Report Date:</span> <span class="info-value">${formatDate(test.date)}</span></div>
              <div class="info-item"><span class="info-label">Age / Gender:</span> <span class="info-value">45Y / Male</span></div>
              <div class="info-item" style="text-align: right;"><span class="info-label">Report ID:</span> <span class="info-value">#${test.id}</span></div>
              <div class="info-item"><span class="info-label">Ref By Dr:</span> <span class="info-value">${test.doctor}</span></div>
            </div>

            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Test Description</th>
                  <th style="text-align: center;">Result</th>
                  <th style="text-align: center;">Ref Range</th>
                  <th style="text-align: center;">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><div class="test-name">${test.test}</div></td>
                  <td><div class="result-value">${test.result || 'Pending'}</div></td>
                  <td style="text-align: center;">${test.range || '-'}</td>
                  <td style="text-align: center;">${test.unit || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div class="findings-section">
              <div class="info-label" style="margin-bottom: 8px; display: block;">Clinical Findings & Notes</div>
              <div style="font-size: 14px; color: #334155;">${test.findings || 'No significant abnormalities detected in the sample. Results should be clinically correlated.'}</div>
            </div>

            <div class="footer">
              <div class="sig-area">
                <div class="sig-line"></div>
                <div class="sig-text">Lab Technician</div>
              </div>
              <div class="sig-area">
                <div class="sig-line"></div>
                <div class="sig-text">Pathologist</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 700);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const printBill = (bill: any) => {
    const templateImage = storage.get(STORAGE_KEYS.TEMPLATE_IMAGE, null);
    const hospitalInfo = storage.get<{
      name?: string;
      address?: string;
      phone?: string;
      logo?: string | null;
    }>(STORAGE_KEYS.HOSPITAL_INFO, {});
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print bill');
      return;
    }

    const billHtml = `
      <html>
        <head>
          <title>Lab Bill - ${bill.id}</title>
          <style>
            @page { margin: 10mm; size: A4; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #1e293b;
              line-height: 1.5;
            }
            .template-bg {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: -1;
            }
            .content { 
              position: relative;
              padding-top: ${templateImage ? '260px' : '20px'}; 
              padding-bottom: ${templateImage ? '100px' : '20px'};
              margin: 0 40px;
              z-index: 10;
            }
            .hospital-header {
              text-align: center;
              margin-bottom: 30px;
              display: ${templateImage ? 'none' : 'block'};
              border-bottom: 2px solid #2563eb;
              padding-bottom: 15px;
            }
            .hospital-name { font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: -0.025em; }
            .bill-title { text-align: center; font-size: 22px; font-weight: 800; margin: 20px 0; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .bill-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 30px; 
              padding: 15px; 
              background-color: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .bill-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
            .bill-table th { text-align: left; background-color: #f1f5f9; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; font-weight: 700; }
            .bill-table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .total-section { text-align: right; margin-top: 30px; padding-top: 20px; border-top: 2px solid #0f172a; }
            .total-label { font-size: 16px; font-weight: 600; color: #64748b; }
            .total-amount { font-size: 24px; font-weight: 800; color: #0f172a; }
          </style>
        </head>
        <body>
          ${templateImage ? `<div class="template-bg"><img src="${templateImage}" style="width: 100%;" /></div>` : ''}
          <div class="content">
            <div class="hospital-header">
              ${hospitalInfo.logo ? `<img src="${hospitalInfo.logo}" style="height: 60px; margin-bottom: 10px;" />` : ''}
              <div class="hospital-name">${hospitalInfo.name}</div>
              <div style="font-size: 11px; color: #64748b;">${hospitalInfo.address} | Tel: ${hospitalInfo.phone}</div>
            </div>
            
            <div class="bill-title">Laboratory Invoice</div>
            
            <div class="bill-info">
              <div>
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Bill To:</div>
                <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${bill.patient}</div>
                <div style="font-size: 12px; color: #64748b;">Patient ID: #P-${Date.now().toString().slice(-4)}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Invoice Details:</div>
                <div style="font-size: 14px; font-weight: 700;">Inv No: ${bill.id}</div>
                <div style="font-size: 14px; font-weight: 700;">Date: ${formatDate(bill.date)}</div>
              </div>
            </div>

            <table class="bill-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Laboratory Investigations & Diagnostic Services</td>
                  <td style="text-align: right; font-weight: 700;">${formatCurrency(bill.amount)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total-section">
              <span class="total-label">Grand Total:</span>
              <span class="total-amount">${formatCurrency(bill.amount)}</span>
              <div style="font-size: 12px; color: #059669; font-weight: 700; margin-top: 5px;">Status: PAID</div>
            </div>

            <div style="margin-top: 80px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              Thank you for choosing Global Hospital Diagnostics. Get well soon!
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 700);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(billHtml);
    printWindow.document.close();
  };

  const handleExportLab = () => {
    const headers = ['Bill ID', 'Patient', 'Date', 'Amount', 'Status'];
    const rows = bills.map(b => [b.id, b.patients?.name || 'N/A', b.created_at, b.paid_amount, b.status]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'lab_billing.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Lab billing data exported');
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter(b => b.created_at?.startsWith(today));
    const totalCollection = todayBills.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
    const pendingBills = bills.filter(b => b.status === 'Pending').length;
    return {
      todayCollection: totalCollection,
      pendingCount: pendingBills,
      totalBilled: bills.length
    };
  }, [bills]);

  const filteredOrders = useMemo(() => {
    return testOrders.filter(order => {
      // Category filter
      if (activeTab === 'pathology' && order.category !== 'pathology') return false;
      if (activeTab === 'radiology' && order.category !== 'radiology') return false;
      if (activeTab === 'external') return false; // Handled by externalReports state separately in UI

      const searchStr = searchQuery.toLowerCase();
      const patient = patients.find(p => p.id === order.patient_id);
      
      return (
        order.test_name?.toLowerCase().includes(searchStr) ||
        patient?.name?.toLowerCase().includes(searchStr) ||
        patient?.mrn?.toLowerCase().includes(searchStr)
      );
    });
  }, [testOrders, activeTab, searchQuery, patients]);

  const labStats = useMemo(() => {
    return {
      pending: testOrders.filter(t => t.status === 'Ordered').length,
      processing: testOrders.filter(t => t.status === 'Processing').length,
      completed: testOrders.filter(t => t.status === 'Completed').length,
      critical: testOrders.filter(t => {
        const resValue = t.result_value || '';
        const refRange = t.reference_range || '';
        if (!resValue || !refRange) return false;
        
        // Basic check for numeric values out of range
        const val = parseFloat(resValue);
        if (isNaN(val)) return false;
        
        const rangeMatch = refRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
        if (rangeMatch) {
          const min = parseFloat(rangeMatch[1]);
          const max = parseFloat(rangeMatch[2]);
          return val < min || val > max;
        }
        return false;
      }).length
    };
  }, [testOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
        <span className="ml-2 text-sm text-muted-foreground font-medium">Loading Lab Data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab & Radiology</h1>
          <p className="text-muted-foreground">Diagnostic tests, sample collection, and separate counter billing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportLab}>
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                <UserPlus className="w-4 h-4" />
                Quick Register
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Lab Quick Registration</DialogTitle>
                <DialogDescription>Quickly register a patient for laboratory or radiology services.</DialogDescription>
              </DialogHeader>
              <LabQuickRegisterForm onRegistered={fetchData} />
            </DialogContent>
          </Dialog>
          <Button 
            variant={mainTab === 'setup' ? 'secondary' : 'outline'} 
            className="gap-2"
            onClick={() => setMainTab(mainTab === 'setup' ? 'orders' : 'setup')}
          >
            <Settings className="w-4 h-4" />
            Master Setup
          </Button>
          <Button 
            variant={mainTab === 'appointments' ? 'secondary' : 'outline'} 
            className="gap-2"
            onClick={() => setMainTab(mainTab === 'appointments' ? 'orders' : 'appointments')}
          >
            <Calendar className="w-4 h-4" />
            Appointments
          </Button>
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                <Clock className="w-4 h-4" />
                Book Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Book Diagnostic Slot</DialogTitle>
                <DialogDescription>Schedule a time for Lab or Radiology tests.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2 relative">
                  <Label>Patient</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Search patient..." 
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientResults(true);
                      }}
                    />
                    {showPatientResults && patientSearchTerm.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p => (
                          <div 
                            key={p.id} 
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                              setNewBooking({...newBooking, patientId: p.id});
                              setPatientSearchTerm(p.name);
                              setShowPatientResults(false);
                            }}
                          >
                            <p className="text-sm font-medium">{p.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={newBooking.type} onValueChange={(v) => setNewBooking({...newBooking, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAB">Laboratory</SelectItem>
                      <SelectItem value="RADIOLOGY">Radiology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={newBooking.date} onChange={(e) => setNewBooking({...newBooking, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input placeholder="10:00 AM" value={newBooking.time} onChange={(e) => setNewBooking({...newBooking, time: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button className="bg-medical-blue w-full" onClick={async () => {
                  if (!newBooking.patientId) return toast.error('Select patient');
                  const result = await supabaseService.createAppointment({
                    patient_id: newBooking.patientId,
                    type: newBooking.type,
                    appointment_date: newBooking.date,
                    appointment_time: newBooking.time,
                    urgency: newBooking.urgency,
                    status: 'Scheduled'
                  });
                  if (result) {
                    toast.success('Appointment booked');
                    setIsBookingOpen(false);
                    fetchData();
                  }
                }}>Confirm Booking</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            variant={mainTab === 'billing' ? 'secondary' : 'outline'} 
            className="gap-2"
            onClick={() => setMainTab(mainTab === 'billing' ? 'orders' : 'billing')}
          >
            <Receipt className="w-4 h-4" />
            {mainTab === 'billing' ? 'View Orders' : 'Lab Billing'}
          </Button>
          <Dialog open={isNewTestOpen} onOpenChange={(open) => {
            setIsNewTestOpen(open);
            if (!open) {
              setPatientSearchTerm('');
              setShowPatientResults(false);
              setNewTestOrder({ patientId: '', category: 'pathology', testName: '', urgency: 'routine' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-medical-blue gap-2" onClick={() => setIsNewTestOpen(true)}>
                <Plus className="w-4 h-4" />
                New Test Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Diagnostic Test Order</DialogTitle>
                <DialogDescription>Order pathology or radiology tests for a patient.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2 relative">
                  <Label>Patient (Search by Name or Phone)</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Start typing name or phone..." 
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientResults(true);
                        if (e.target.value === '') {
                          setNewTestOrder({...newTestOrder, patientId: ''});
                        }
                      }}
                      onFocus={() => setShowPatientResults(true)}
                    />
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {showPatientResults && patientSearchTerm.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto custom-scrollbar">
                      {patients.filter(p => 
                        p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
                        p.phone.includes(patientSearchTerm)
                      ).length > 0 ? (
                        patients.filter(p => 
                          p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
                          p.phone.includes(patientSearchTerm)
                        ).map(p => (
                          <div 
                            key={p.id} 
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                            onClick={() => {
                              setNewTestOrder({...newTestOrder, patientId: p.id});
                              setPatientSearchTerm(p.name);
                              setShowPatientResults(false);
                            }}
                          >
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.phone} • MRN: {p.mrn}</p>
                            </div>
                            {newTestOrder.patientId === p.id && <CheckCircle2 className="w-4 h-4 text-medical-blue" />}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                          No patients found.
                        </div>
                      )}
                    </div>
                  )}
 
                  {newTestOrder.patientId && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-blue-700 truncate">
                          {patients.find(pat => pat.id === newTestOrder.patientId)?.name}
                        </p>
                        <p className="text-[10px] text-blue-600 truncate">
                          Ph: {patients.find(pat => pat.id === newTestOrder.patientId)?.phone} • MRN: {patients.find(pat => pat.id === newTestOrder.patientId)?.mrn}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Test Category</Label>
                  <Select 
                    value={newTestOrder.category} 
                    onValueChange={(v) => setNewTestOrder({...newTestOrder, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pathology">Pathology (Blood/Urine/etc)</SelectItem>
                      <SelectItem value="radiology">Radiology (X-Ray/USG/CT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Select 
                    onValueChange={(v) => setNewTestOrder({...newTestOrder, testName: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Test" />
                    </SelectTrigger>
                    <SelectContent>
                      {labRates.filter(t => t.category.toLowerCase() === newTestOrder.category).map(t => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select 
                    value={newTestOrder.urgency} 
                    onValueChange={(v) => setNewTestOrder({...newTestOrder, urgency: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="stat">STAT (Emergency)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button 
                  className="bg-medical-blue" 
                  onClick={async () => {
                    if (!newTestOrder.patientId || !newTestOrder.testName) {
                      toast.error('Please select patient and enter test name');
                      return;
                    }
                    const masterTest = labRates.find((t: any) => t.name === newTestOrder.testName);
                    const isRadiology = masterTest?.category?.toLowerCase() === 'radiology' || 
                                       newTestOrder.testName.toLowerCase().includes('x-ray') || 
                                       newTestOrder.testName.toLowerCase().includes('scan');
                    
                    const newOrder = {
                      patient_id: newTestOrder.patientId,
                      test_name: newTestOrder.testName,
                      status: 'Ordered',
                      reference_range: masterTest?.reference_range || '',
                      unit: masterTest?.unit || '',
                      urgency: newTestOrder.urgency
                    };

                    const result = isRadiology 
                      ? await supabaseService.createRadiologyRecord({ ...newOrder, result_notes: '' })
                      : await supabaseService.createLabTestRequest(newOrder);

                    if (result) {
                      setTestOrders([{...result, category: isRadiology ? 'radiology' : 'pathology'}, ...testOrders]);
                      toast.success('Test order placed successfully');
                      setIsNewTestOpen(false);
                      fetchData();
                    } else {
                      toast.error('Failed to place order');
                    }
                  }}
                >
                  Place Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
 
      {mainTab === 'orders' ? (
        <>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            <Button 
              variant={activeTab === 'pathology' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('pathology')}
              className={activeTab === 'pathology' ? 'bg-white shadow-sm' : ''}
            >
              Pathology
            </Button>
            <Button 
              variant={activeTab === 'radiology' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('radiology')}
              className={activeTab === 'radiology' ? 'bg-white shadow-sm' : ''}
            >
              Radiology (X-Ray/USG)
            </Button>
            <Button 
              variant={activeTab === 'external' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('external')}
              className={activeTab === 'external' ? 'bg-white shadow-sm text-medical-blue' : ''}
            >
              External Reports
            </Button>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Pending Samples</p>
                <h3 className="text-xl font-bold text-amber-600">{labStats.pending}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">In Processing</p>
                <h3 className="text-xl font-bold text-blue-600">{labStats.processing}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Reports Ready</p>
                <h3 className="text-xl font-bold text-emerald-600">{labStats.completed}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Critical Results</p>
                <h3 className="text-xl font-bold text-rose-600">{labStats.critical}</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Test Orders</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search patient or MRN..." 
                    className="pl-10 bg-slate-50 border-none h-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="whitespace-nowrap">Order ID</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap">Test Name</TableHead>
                      <TableHead className="whitespace-nowrap">Ordered By</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTab === 'external' ? (
                      externalReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-40 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                              <div className="p-4 bg-slate-50 rounded-full">
                                <FileCheck className="w-10 h-10 text-slate-300" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">No external reports uploaded</p>
                                <p className="text-xs">Upload reports from other diagnostic centers here.</p>
                              </div>
                              <div className="relative">
                                <input 
                                  type="file" 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  onChange={handleExternalUpload}
                                  accept="image/*,application/pdf"
                                />
                                <Button variant="outline" size="sm" className="mt-2 text-medical-blue border-medical-blue hover:bg-blue-50">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload External PDF / Image
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        externalReports.map(report => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium text-medical-blue">#{report.id}</TableCell>
                            <TableCell>{report.patentName}</TableCell>
                            <TableCell>{report.testName}</TableCell>
                            <TableCell colSpan={2}>{formatDate(report.date)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => window.open(report.url, '_blank')}>
                                <Eye className="w-4 h-4 text-medical-blue" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    ) : filteredOrders.map((test: any) => {
                      const resStatus = getResultStatus(test.result_value || '', test.reference_range || '');
                      return (
                        <TableRow key={test.id} className="border-slate-50">
                          <TableCell className="font-medium text-medical-blue whitespace-nowrap">#{test.id.slice(0, 8)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div>
                              <p className="font-medium">{test.patients?.name}</p>
                              <p className="text-[10px] text-muted-foreground">{formatDate(test.created_at)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{test.test_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{test.profiles?.name || 'Self/Ordered'}</TableCell>
                          <TableCell className="whitespace-nowrap text-center">
                            {test.result_value ? (
                              <div className={`flex flex-col items-center ${
                                resStatus === 'high' ? 'text-rose-600 font-bold' : 
                                resStatus === 'low' ? 'text-amber-600 font-bold' : 
                                'text-slate-700'
                              }`}>
                                <span>{test.result_value} {test.unit}</span>
                                <span className="text-[9px] opacity-70">Ref: {test.reference_range}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="secondary" className={`border-none ${
                              test.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                              test.status === 'Processing' ? 'bg-blue-50 text-blue-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {test.status === 'Completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : 
                               test.status === 'Processing' ? <Clock className="w-3 h-3 mr-1" /> : 
                               <AlertCircle className="w-3 h-3 mr-1" />}
                              {test.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              {test.status !== 'Completed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs gap-1 border-medical-blue text-medical-blue"
                                  onClick={() => {
                                    setEditingResult(test);
                                    setResultData({
                                      value: test.result || '',
                                      findings: test.findings || '',
                                      clinicalNotes: test.clinicalNotes || '',
                                      status: 'Completed'
                                    });
                                    setIsResultDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                  Enter Result
                                </Button>
                              )}
                              {test.status === 'Completed' && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-medical-blue" onClick={() => printReport(test)}>
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printReport(test)}>
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {activeTab === 'radiology' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <ImageIcon className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                      <DialogTitle>Radiology Image Viewer</DialogTitle>
                                      <DialogDescription>Viewing digital X-Ray for {test.patient}</DialogDescription>
                                    </DialogHeader>
                                    <div className="aspect-square rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800 relative group">
                                      <img 
                                        src={radiologyFiles.find(f => f.orderId === test.id)?.url || "https://picsum.photos/seed/xray/800/800"} 
                                        alt="X-Ray" 
                                        className="w-full h-full object-contain opacity-80"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                         <div className="relative">
                                           <input 
                                              type="file" 
                                              className="absolute inset-0 opacity-0 cursor-pointer" 
                                              onChange={(e) => handleRadiologyUpload(e, test.id)}
                                              accept="image/*"
                                           />
                                           <Button variant="secondary" size="sm" className="gap-2">
                                             <Upload className="w-4 h-4" />
                                             Upload X-Ray / Scan
                                           </Button>
                                         </div>
                                      </div>
                                    </div>
                                    <DialogFooter className="flex justify-between sm:justify-between gap-2">
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">Close</Button>
                                      </DialogTrigger>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="gap-2">
                                          <Download className="w-4 h-4" />
                                          Download DICOM
                                        </Button>
                                        <Button className="bg-medical-blue" onClick={() => toast.success('Report shared with doctor')}>Share with Doctor</Button>
                                      </div>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : mainTab === 'setup' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Master Test Configuration</h2>
              <p className="text-xs text-muted-foreground">Define test groups, reference ranges, and units for reports.</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isTestSetupOpen} onOpenChange={(open) => {
                setIsTestSetupOpen(open);
                if (!open) {
                  setEditingTestConfig(null);
                  setTestConfigData({ name: '', category: 'Pathology', price: 0, range: '', unit: '', groupId: 'misc' });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-medical-blue gap-2" onClick={() => setIsTestSetupOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New Test Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingTestConfig ? 'Edit Test' : 'Add New Test Master'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Test Name</Label>
                        <Input 
                          placeholder="e.g. CBC, HbA1c" 
                          value={testConfigData.name}
                          onChange={e => setTestConfigData({...testConfigData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={testConfigData.category} onValueChange={v => setTestConfigData({...testConfigData, category: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pathology">Pathology</SelectItem>
                            <SelectItem value="Radiology">Radiology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Test Group</Label>
                        <Select value={testConfigData.groupId} onValueChange={v => setTestConfigData({...testConfigData, groupId: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {testGroups.map((g: any) => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Default Price (₹)</Label>
                        <Input 
                          type="number"
                          value={testConfigData.price}
                          onChange={e => setTestConfigData({...testConfigData, price: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input 
                          placeholder="e.g. g/dL, mg/dL" 
                          value={testConfigData.unit}
                          onChange={e => setTestConfigData({...testConfigData, unit: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Normal Reference Range</Label>
                        <Input 
                          placeholder="e.g. 13.5 - 17.5" 
                          value={testConfigData.range}
                          onChange={e => setTestConfigData({...testConfigData, range: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTestSetupOpen(false)}>Cancel</Button>
                    <Button className="bg-medical-blue" onClick={() => {
                      if (editingTestConfig) {
                        setLabRates(labRates.map((t: any) => t.id === editingTestConfig.id ? { ...t, ...testConfigData } : t));
                        toast.success('Test configuration updated');
                      } else {
                        const newMaster = {
                          ...testConfigData,
                          id: `lt-${Date.now()}`,
                          price: testConfigData.price // ensure price is saved as price
                        };
                        setLabRates([...labRates, newMaster]);
                        toast.success('New test master added');
                      }
                      setIsTestSetupOpen(false);
                    }}>
                      Save Configuration
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1 border-none shadow-sm h-fit">
              <CardHeader className="pb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground bg-slate-50/50">Test Groups</CardHeader>
              <CardContent className="p-2 space-y-1">
                {testGroups.map((group: any) => (
                  <div 
                    key={group.id} 
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm group cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <span className="text-sm font-medium">{group.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{labRates.filter((t: any) => t.groupId === group.id).length}</Badge>
                  </div>
                ))}
                <Separator className="my-2" />
                <Button variant="ghost" size="sm" className="w-full justify-start text-medical-blue h-8 text-xs font-semibold">
                  <Plus className="w-3 h-3 mr-2" />
                  Add New Group
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Master</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Range & Unit</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labRates.map((test: any) => (
                      <TableRow key={test.id || test.name}>
                        <TableCell>
                          <p className="font-bold text-sm">{test.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{test.category}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {testGroups.find((g: any) => g.id === test.groupId)?.name || 'Misc'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{test.range || 'N/A'}</p>
                          <p className="text-[10px] text-muted-foreground">{test.unit || 'No unit'}</p>
                        </TableCell>
                        <TableCell className="text-right font-bold">₹{test.price || test.rate}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingTestConfig(test);
                                setTestConfigData({
                                  name: test.name,
                                  category: test.category,
                                  price: test.price || test.rate,
                                  range: test.range,
                                  unit: test.unit,
                                  groupId: test.groupId
                                });
                                setIsTestSetupOpen(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : mainTab === 'appointments' ? (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Scheduled Diagnostic Slots</CardTitle>
            <CardDescription>Appointments booked specifically for Lab & Radiology tests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map((apt: any) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <Badge variant="outline" className={apt.type === 'RADIOLOGY' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'}>
                            {apt.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{apt.patients?.name || 'Loading...'}</TableCell>
                        <TableCell>{formatDate(apt.appointment_date)}</TableCell>
                        <TableCell>{apt.appointment_time}</TableCell>
                        <TableCell>
                          <Badge className={apt.status === 'Completed' ? 'bg-emerald-500' : 'bg-sky-500'}>
                            {apt.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">No appointments found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : mainTab === 'billing' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm text-white bg-gradient-to-br from-purple-600 to-indigo-700">
              <CardContent className="p-6">
                <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-1">Today's Lab Collection</p>
                <h3 className="text-3xl font-black">{formatCurrency(stats.todayCollection)}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm text-white bg-gradient-to-br from-amber-500 to-orange-600">
              <CardContent className="p-6">
                <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-1">Pending Lab Bills</p>
                <h3 className="text-3xl font-black">{stats.pendingCount}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm text-white bg-gradient-to-br from-blue-600 to-sky-700">
              <CardContent className="p-6">
                <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-1">Total Tests Billed</p>
                <h3 className="text-3xl font-black">{stats.totalBilled}</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Lab Billing History</CardTitle>
              <Dialog open={isNewBillOpen} onOpenChange={(open) => {
                setIsNewBillOpen(open);
                if (!open) resetBilling();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-medical-blue gap-2 h-9" onClick={() => setIsNewBillOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New Lab Bill
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Generate Lab Bill</DialogTitle>
                    <DialogDescription>Collect payment for lab services.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 relative">
                        <Label>Patient (Search Name/Phone)</Label>
                        <div className="relative">
                          <Input 
                            placeholder="Type name or phone..." 
                            value={patientSearchTerm}
                            onChange={(e) => {
                              setPatientSearchTerm(e.target.value);
                              setShowPatientResults(true);
                              if (e.target.value === '') {
                                setSelectedPatientId('');
                              }
                            }}
                            onFocus={() => setShowPatientResults(true)}
                            className="h-9"
                          />
                          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        {showPatientResults && patientSearchTerm.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-[180px] overflow-y-auto custom-scrollbar">
                            {patients.filter(p => 
                              p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
                              (p.phone && p.phone.includes(patientSearchTerm))
                            ).length > 0 ? (
                              patients.filter(p => 
                                p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
                                (p.phone && p.phone.includes(patientSearchTerm))
                              ).map(p => (
                                <div 
                                  key={p.id} 
                                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                                  onClick={() => {
                                    setSelectedPatientId(p.id);
                                    setPatientSearchTerm(p.name);
                                    setShowPatientResults(false);
                                  }}
                                >
                                  <div>
                                    <p className="text-sm font-medium">{p.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{p.phone || 'No phone'}</p>
                                  </div>
                                  {selectedPatientId === p.id && <CheckCircle2 className="w-3 h-3 text-medical-blue" />}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                                No patients found.
                              </div>
                            )}
                          </div>
                        )}

                        {selectedPatientId && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                              <User className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-blue-700 truncate">
                                {patients.find(pat => pat.id === selectedPatientId)?.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Add Test</Label>
                          <Select onValueChange={addTestToBill}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select test" />
                            </SelectTrigger>
                            <SelectContent>
                              {labRates.map((t: any) => (
                                <SelectItem key={t.id || t.name} value={t.id || t.name}>{t.name} (₹{t.price || t.rate})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Add Package</Label>
                          <Select onValueChange={(val) => {
                            const pkg = LAB_PACKAGES.find(p => p.id === val);
                            if (pkg) {
                              setSelectedTests([...selectedTests, { id: pkg.id, name: pkg.name, price: pkg.price }]);
                            }
                          }}>
                            <SelectTrigger className="h-9 border-medical-blue text-medical-blue font-semibold">
                              <Package className="w-3 h-3 mr-2" />
                              <SelectValue placeholder="Select package" />
                            </SelectTrigger>
                            <SelectContent>
                              {LAB_PACKAGES.map(pkg => (
                                <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} (₹{pkg.price})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="h-9">Test Name</TableHead>
                            <TableHead className="h-9 text-right">Price</TableHead>
                            <TableHead className="h-9 w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No tests added yet</TableCell>
                            </TableRow>
                          ) : (
                            selectedTests.map((test, idx) => (
                              <TableRow key={`${test.id}-${idx}`}>
                                <TableCell className="py-2">{test.name}</TableCell>
                                <TableCell className="py-2 text-right">{formatCurrency(test.price)}</TableCell>
                                <TableCell className="py-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-rose-500"
                                    onClick={() => removeTestFromBill(idx)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                        <span className="text-sm font-bold text-slate-700">₹{totalBillAmount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 px-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-medical-blue" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discount (%)</span>
                        </div>
                        <Input 
                          type="number" 
                          className="h-8 w-24 text-right text-xs font-bold border-slate-200" 
                          value={discount} 
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          min="0"
                          max="100"
                        />
                      </div>
                      <Separator className="bg-slate-200" />
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-medical-blue uppercase tracking-widest">Final Bill Amount</span>
                        <div className="text-right">
                          <p className="text-lg font-black text-medical-blue leading-none">₹{finalBillAmount}</p>
                          {discount > 0 && <p className="text-[9px] text-emerald-600 font-bold mt-1">SAVING ₹{totalBillAmount - finalBillAmount}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI / QR</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                    <Button 
                      className="bg-medical-blue" 
                      onClick={async () => {
                        const invoice = {
                          patient_id: selectedPatientId,
                          total_amount: totalBillAmount,
                          discount_amount: totalBillAmount - finalBillAmount,
                          paid_amount: finalBillAmount,
                          payment_status: 'Paid',
                          payment_method: paymentMode,
                          status: 'Settled',
                          type: 'Lab'
                        };
                        const invoiceItems = selectedTests.map(t => ({
                          item_name: t.name,
                          quantity: 1,
                          unit_price: t.price,
                          total_price: t.price,
                          category: 'LAB'
                        }));

                        const result = await supabaseService.createInvoice(invoice, invoiceItems);
                        if (result) {
                          toast.success('Lab payment collected successfully');
                          resetBilling();
                          setIsNewBillOpen(false);
                          fetchData();
                        } else {
                          toast.error('Failed to collect payment');
                        }
                      }}
                      disabled={!selectedPatientId || selectedTests.length === 0}
                    >
                      Collect {formatCurrency(finalBillAmount)}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="whitespace-nowrap">Bill ID</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id} className="border-slate-50">
                        <TableCell className="font-medium text-medical-blue whitespace-nowrap">#{bill.id.slice(0, 8)}</TableCell>
                        <TableCell className="whitespace-nowrap">{bill.patients?.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(bill.created_at)}</TableCell>
                        <TableCell className="font-bold whitespace-nowrap">{formatCurrency(bill.paid_amount)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none">
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printBill(bill)}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleDeleteBill(bill.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enter Test Results</DialogTitle>
            <DialogDescription>
              Patient: {editingResult?.patients?.name} | Test: {editingResult?.test_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Result Value</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={resultData.value} 
                      onChange={e => setResultData({...resultData, value: e.target.value})}
                      placeholder="e.g. 14.5"
                      className={`text-lg font-bold ${
                        getResultStatus(resultData.value, editingResult?.range) === 'high' ? 'border-rose-500 text-rose-600 bg-rose-50' :
                        getResultStatus(resultData.value, editingResult?.range) === 'low' ? 'border-amber-500 text-amber-600 bg-amber-50' :
                        ''
                      }`}
                    />
                    <span className="font-medium text-slate-500 shrink-0">{editingResult?.unit || ''}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Normal Range</span>
                    <Badge variant="outline" className="text-[10px]">{editingResult?.unit || 'No unit'}</Badge>
                  </div>
                  <p className="text-sm font-black text-slate-700">{editingResult?.range || 'Direct Observation'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Based on lab master configuration.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={resultData.status} onValueChange={v => setResultData({...resultData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed & Released</SelectItem>
                      <SelectItem value="Processing">Partially Ready</SelectItem>
                      <SelectItem value="High Risk">Flag Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {getResultStatus(resultData.value, editingResult?.range) !== 'normal' && resultData.value && (
                  <div className={`p-2 rounded-md flex items-center gap-2 animate-in fade-in duration-300 ${
                    getResultStatus(resultData.value, editingResult?.range) === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Result is {getResultStatus(resultData.value, editingResult?.range)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Findings / Remarks</Label>
              <Input 
                value={resultData.findings} 
                onChange={e => setResultData({...resultData, findings: e.target.value})}
                placeholder="Observed findings..."
              />
            </div>
            <div className="space-y-2">
              <Label>Clinical Notes</Label>
              <textarea 
                className="w-full min-h-[80px] p-2 bg-slate-50 border border-slate-200 rounded-md text-sm"
                value={resultData.clinicalNotes}
                onChange={e => setResultData({...resultData, clinicalNotes: e.target.value})}
                placeholder="Doctor's reference notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>Cancel</Button>
            <Button className="bg-medical-blue" onClick={handleSaveResult}>Save Results</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
