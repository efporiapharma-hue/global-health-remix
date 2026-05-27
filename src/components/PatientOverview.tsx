import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Bed, 
  History, 
  FileText, 
  CreditCard, 
  Pill, 
  Shield, 
  Stethoscope,
  Search,
  Share2,
  Printer,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Upload,
  Activity,
  ShoppingCart,
  Trash2,
  Loader2,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { toast } from 'sonner';
import { supabaseService } from '@/services/supabaseService';
import { useDataSync } from '@/hooks/useDataSync';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';

export default function PatientOverview({ userRole }: { userRole?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('id');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'All' | 'OPD/IPD' | 'Quick' | 'Quick-Lab' | 'Quick-Pharmacy'>('All');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{url: string, name: string} | null>(null);

  // Detail states
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [pharmacyBills, setPharmacyBills] = useState<any[]>([]);
  const [newPrescription, setNewPrescription] = useState({
    medicines: [{ name: '', dosage: '', frequency: '' }],
    diagnosis: '',
    advice: ''
  });
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string} | null>(null);

  const isFinancialVisible = userRole !== 'DOCTOR' && userRole !== 'NURSE';
  const setLoading = setIsLoading;

  const fetchInitialData = async () => {
    setIsLoading(true);
    const [pts, bds, stf] = await Promise.all([
      supabaseService.getPatients(),
      supabaseService.getBeds(),
      supabaseService.getStaff()
    ]);
    if (pts) setPatients(pts);
    if (bds) setBeds(bds);
    if (stf) setStaff(stf);
    setIsLoading(false);
  };

  useDataSync(fetchInitialData);

  useEffect(() => {
    if (patientIdFromUrl) {
      const patient = patients.find(p => p.id === patientIdFromUrl);
      if (patient) {
        setSelectedPatient(patient);
        fetchPatientDetails(patientIdFromUrl);
      }
    } else {
      setSelectedPatient(null);
    }
  }, [patientIdFromUrl, patients]);

  const fetchPatientDetails = async (id: string) => {
    const [appts, bills, rx, vts, labs, claims] = await Promise.all([
      supabaseService.getAppointments(), // Ideally should be getAppointments(id)
      supabaseService.getInvoices(),      // Ideally should be getInvoices(id)
      supabaseService.getPrescriptions(id),
      supabaseService.getPatientVitals(id),
      supabaseService.getLabTestRequests(), // Ideally should be getLabTestRequests(id)
      supabaseService.getInsuranceClaims()   // Ideally should be getInsuranceClaims(id)
    ]);

    if (appts) setAppointments(appts.filter((a: any) => a.patient_id === id));
    if (bills) setBilling(bills.filter((b: any) => b.patient_id === id));
    if (rx) setPrescriptions(rx);
    if (vts) setVitals(vts);
    if (labs) setLabOrders(labs.filter((l: any) => l.patient_id === id));
    if (claims) setInsuranceClaims(claims.filter((c: any) => c.patient_id === id));
  };

  const filteredPatients = useMemo(() => {
    let result = patients;
    
    if (activeCategory !== 'All') {
      result = result.filter(p => p.registration_type === activeCategory);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.mrn && p.mrn.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query))
      );
    }
    
    return result;
  }, [searchQuery, patients, activeCategory]);

  const handleShareWhatsApp = () => {
    if (!selectedPatient) return;
    
    const shareUrl = `${window.location.origin}/patient-overview?id=${selectedPatient.id}`;
    const doctor = staff.find(u => u.id === selectedPatient.attending_doctor_id);
    const claim = insuranceClaims.find(c => c.patient_id === selectedPatient.id);
    
    const patientData = `
*Patient Overview: ${selectedPatient.name}*
*MRN:* ${selectedPatient.mrn || 'N/A'}
*Age/Gender:* ${selectedPatient.age}Y / ${selectedPatient.gender}
*Attending Doctor:* ${doctor?.name || 'Dr. Rajesh Sharma'}
*Status:* ${selectedPatient.status}
*Current Dues:* ${formatCurrency(calculateDues(selectedPatient.id))}
*Insurance Status:* ${claim?.status || 'N/A'}

View full details at: ${shareUrl}
    `.trim();

    const encodedText = encodeURIComponent(patientData);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    toast.success('Sharing to WhatsApp...');
  };

  const handlePrintBlankPrescription = () => {
    if (!selectedPatient) return;

    const patientVitals = vitals.find((v: any) => v.patient_id === selectedPatient.id);
    const doctor = staff.find(u => u.id === selectedPatient.attending_doctor_id);

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
      toast.error('Please allow popups to print prescription');
      return;
    }

    const prescriptionHtml = `
      <html>
        <head>
          <title>Prescription - ${selectedPatient.name}</title>
          <style>
            @page { margin: 10mm; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 20px;
              color: #333;
            }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .hosp-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .hosp-sub { font-size: 14px; color: #666; margin-top: 5px; }
            
            .patient-box { display: grid; grid-template-cols: 1fr 1fr; gap: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 20px; }
            .info-item { font-size: 13px; }
            .info-label { font-weight: bold; color: #64748b; margin-right: 5px; }
            
            .vitals-bar { display: flex; justify-content: space-between; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px; background: #fff; }
            .vital-item { text-align: center; flex: 1; border-right: 1px solid #e2e8f0; }
            .vital-item:last-child { border-right: none; }
            .vital-val { font-weight: bold; font-size: 16px; margin-top: 2px; }
            .vital-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            
            .rx-symbol { font-size: 40px; font-weight: bold; color: #2563eb; margin: 20px 0; font-family: 'Times New Roman', serif; }
            
            .blank-lines { margin-top: 40px; }
            .line-group { margin-bottom: 300px; }
            .section-title { font-weight: bold; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
            
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
            .doc-sig { text-align: center; }
            .sig-line { width: 200px; border-top: 1px solid #000; margin-top: 60px; }
            
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hosp-name">GLOBAL HOSPITAL</div>
            <div class="hosp-sub">& MATERNITY CENTER</div>
            <div style="font-size: 12px; margin-top: 5px;">Plot 12, Medical Square, City Center • Tel: +91 1234567890</div>
          </div>

          <div class="patient-box">
            <div class="info-item"><span class="info-label">Patient:</span> ${selectedPatient.name}</div>
            <div class="info-item"><span class="info-label">MRN:</span> ${selectedPatient.mrn || 'N/A'}</div>
            <div class="info-item"><span class="info-label">Age/Gender:</span> ${selectedPatient.age}Y / ${selectedPatient.gender}</div>
            <div class="info-item"><span class="info-label">Date:</span> ${new Date().toLocaleDateString('en-IN')}</div>
            <div class="info-item"><span class="info-label">Doctor:</span> ${doctor?.name || 'Dr. Consultant'}</div>
            <div class="info-item"><span class="info-label">Dept:</span> ${doctor?.department || 'OPD'}</div>
          </div>

          <div class="vitals-bar">
            <div class="vital-item">
              <div class="vital-label">BP</div>
              <div class="vital-val">${patientVitals?.bp || '___/___'}</div>
            </div>
            <div class="vital-item">
              <div class="vital-label">Pulse</div>
              <div class="vital-val">${patientVitals?.pulse || '___'} bpm</div>
            </div>
            <div class="vital-item">
              <div class="vital-label">Temp</div>
              <div class="vital-val">${patientVitals?.temp || '___ °F'}</div>
            </div>
            <div class="vital-item">
              <div class="vital-label">SpO2</div>
              <div class="vital-val">${patientVitals?.spo2 || '___'}%</div>
            </div>
            <div class="vital-item">
              <div class="vital-label">Weight</div>
              <div class="vital-val">___ kg</div>
            </div>
          </div>

          <div class="rx-symbol">Rx</div>

          <div class="blank-lines">
            <div class="section-title">Clinical Notes / Diagnosis</div>
            <div style="height: 100px;"></div>
            
            <div class="section-title">Medicines & Advice</div>
            <div style="height: 400px; border: 1px dashed #e2e8f0; border-radius: 8px; position: relative;">
               <div style="position: absolute; top: 10px; left: 10px; color: #cbd5e1; font-size: 12px;">Doctor's Signature Space</div>
            </div>
          </div>

          <div class="footer">
            <div style="font-size: 10px; color: #94a3b8;">
              * Disclaimer: This is a system generated prescription template.<br>
              Valid only when signed and stamped by the attending doctor.
            </div>
            <div class="doc-sig">
              <div class="sig-line"></div>
              <div style="font-weight: bold; margin-top: 5px;">Doctor's Signature</div>
              <div style="font-size: 10px;">${doctor?.name || 'Dr. Consultant'}</div>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(prescriptionHtml);
    printWindow.document.close();
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    const newRx = {
      patient_id: selectedPatient.id,
      doctor_id: selectedPatient.attending_doctor_id,
      prescription_date: new Date().toISOString(),
      diagnosis: newPrescription.diagnosis,
      advice: newPrescription.advice,
      medicines: newPrescription.medicines.filter(m => m.name.trim() !== '')
    };

    const result = await supabaseService.createPrescription(newRx);
    if (result) {
      setPrescriptions([result, ...prescriptions]);
      setIsPrescriptionOpen(false);
      setNewPrescription({
        medicines: [{ name: '', dosage: '', frequency: '' }],
        diagnosis: '',
        advice: ''
      });
      toast.success('Prescription saved successfully');
    } else {
      toast.error('Failed to save prescription');
    }
    setLoading(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFile({
          name: file.name,
          url: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUpload = () => {
    if (!selectedPatient || !uploadedFile) return;

    const newRecord = {
      id: `rx-up-${Date.now()}`,
      patientId: selectedPatient.id,
      doctorId: 'd1',
      date: new Date().toISOString(),
      medicines: [],
      attachmentUrl: uploadedFile.url,
      attachmentName: uploadedFile.name,
    };

    setPrescriptions([newRecord, ...prescriptions]);
    setIsUploadOpen(false);
    setUploadedFile(null);
    toast.success('Old record uploaded successfully');
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedPatient.name} and all associated records? This action cannot be undone.`)) {
      return;
    }

    try {
      // Sync with Supabase if connected
      if (selectedPatient.supabase_id && import.meta.env.VITE_SUPABASE_URL) {
        const { supabaseService } = await import('../services/supabaseService');
        await supabaseService.deletePatient(selectedPatient.supabase_id);
      }

      const updatedPatients = patients.filter((p: any) => p.id !== selectedPatient.id);
      setPatients(updatedPatients);
      storage.set(STORAGE_KEYS.PATIENTS, updatedPatients);
      
      // Clear URL params and selection
      setSearchParams({});
      setSelectedPatient(null);
      
      toast.success('Patient record deleted successfully');
      
      // Dispatch storage event to update other components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete patient record');
    }
  };

  const calculateDues = (patientId: string) => {
    const patientBills = billing.filter(b => b.patient_id === patientId);
    const total = patientBills.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
    const paid = patientBills.reduce((acc, b) => acc + (Number(b.paid_amount) || 0), 0);
    return total - paid;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-medical-blue" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading Patient 360 Ecosystem...</p>
        </div>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Patient 360 Overview</h1>
          <p className="text-muted-foreground text-sm">Search and select a patient to view their complete medical and financial history.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search by Patient Name, MRN, or Phone Number..." 
              className="pl-10 h-12 text-lg shadow-sm border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['All', 'OPD/IPD', 'Quick', 'Quick-Lab', 'Quick-Pharmacy'] as const).map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full px-4 h-8 ${activeCategory === cat ? 'bg-medical-blue' : 'text-slate-500'}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className="hover:ring-2 hover:ring-medical-blue/20 transition-all cursor-pointer border-none shadow-sm"
              onClick={() => setSearchParams({ id: patient.id })}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-medical-blue font-bold text-lg">
                  {patient.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-slate-800 truncate">{patient.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold bg-slate-100 text-slate-500 border-none">
                      {patient.mrn || 'N/A'}
                    </Badge>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {patient.phone || 'No phone'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const patientAppointments = useMemo(() => appointments.filter(a => a.patient_id === selectedPatient?.id), [appointments, selectedPatient]);
  const patientBills = useMemo(() => billing.filter(b => b.patient_id === selectedPatient?.id), [billing, selectedPatient]);
  const patientClaims = useMemo(() => insuranceClaims.filter(c => c.patient_id === selectedPatient?.id), [insuranceClaims, selectedPatient]);
  const currentBed = useMemo(() => beds.find(b => b.patient_id === selectedPatient?.id), [beds, selectedPatient]);
  const dues = useMemo(() => selectedPatient ? calculateDues(selectedPatient.id) : 0, [selectedPatient, billing]);

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSearchParams({})}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">{selectedPatient.name}</h1>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{selectedPatient.mrn || 'N/A'} • {selectedPatient.age}Y / {selectedPatient.gender}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 border-medical-blue text-medical-blue hover:bg-blue-50" onClick={() => setIsPrescriptionOpen(true)}>
            <Plus className="w-4 h-4" />
            Write Prescription
          </Button>
          <Button variant="outline" className="gap-2 border-slate-300" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4" />
            Upload Old Record
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrintBlankPrescription}>
            <FileText className="w-4 h-4" />
            Blank Prescription
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
          <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2" onClick={handleShareWhatsApp}>
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
          </Button>
          {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
            <Button variant="destructive" className="gap-2" onClick={handleDeletePatient}>
              <Trash2 className="w-4 h-4" />
              Delete Patient
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Quick Stats */}
        <div className="space-y-6">
          {/* Quick Vitals Display */}
          <Card className="border-none shadow-sm bg-medical-blue/5 border-l-4 border-medical-blue">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-medical-blue" />
                  <p className="text-sm font-black text-medical-blue uppercase tracking-wider">Live Vitals</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white border-medical-blue/20">
                  {vitals.length > 0 ? 'Updated' : 'Default'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">BP</p>
                  <p className="text-base font-black text-slate-800">{vitals[0]?.bp || '120/80'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pulse</p>
                  <p className="text-base font-black text-slate-800">{vitals[0]?.pulse || '78'} bpm</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Temp</p>
                  <p className="text-base font-black text-slate-800">{vitals[0]?.temp || '98.6'} °F</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">SpO2</p>
                  <p className="text-base font-black text-slate-800">{vitals[0]?.spo2 || '98'} %</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-medical-blue text-white pb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl border border-white/30">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-white">Patient Profile</CardTitle>
                  <Badge className="bg-white/20 text-white border-none mt-1">{selectedPatient.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 -mt-4 bg-white rounded-t-3xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                  <p className="text-sm font-medium">{selectedPatient.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</p>
                  <p className="text-sm font-medium">{selectedPatient.bloodGroup || 'N/A'}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                  <p className="text-sm font-medium">{selectedPatient.address}</p>
                </div>
                {selectedPatient.fatherName && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Father's Info</p>
                    <p className="text-sm font-medium">{selectedPatient.fatherName}</p>
                    {selectedPatient.fatherPhone && <p className="text-[10px] text-slate-500">{selectedPatient.fatherPhone}</p>}
                  </div>
                )}
                {selectedPatient.husbandName && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Husband's Info</p>
                    <p className="text-sm font-medium">{selectedPatient.husbandName}</p>
                    {selectedPatient.husbandPhone && <p className="text-[10px] text-slate-500">{selectedPatient.husbandPhone}</p>}
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attending Doctors</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {staff.find(u => u.id === selectedPatient.attending_doctor_id)?.name || 'Dr. Rajesh Sharma'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {staff.find(u => u.id === selectedPatient.attending_doctor_id)?.department || 'General Medicine'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isFinancialVisible && (
            <Card className="border-none shadow-sm bg-rose-50 border-l-4 border-rose-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Outstanding Dues</p>
                  <h3 className="text-2xl font-bold text-rose-700">{formatCurrency(dues)}</h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-100 text-rose-600">
                  <CreditCard className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          )}

          {currentBed && (
            <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-blue-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Current Admission</p>
                  <h3 className="text-xl font-bold text-blue-700">Bed {currentBed.number}</h3>
                  <p className="text-[10px] text-blue-500 font-medium">{currentBed.ward}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <Bed className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle & Right Column: Detailed History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Appointments */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-medical-blue" />
                  <CardTitle className="text-lg">Appointments</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[250px] overflow-y-auto custom-scrollbar">
                  <div className="p-4 space-y-3">
                    {patientAppointments.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8 italic">No appointment history</p>
                    ) : (
                      patientAppointments.map(app => (
                        <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <p className="text-sm font-bold">{formatDate(app.date)}</p>
                            <p className="text-[10px] text-slate-500">{app.time} • {app.type}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">{app.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical History / Notes */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-medical-blue" />
                  <CardTitle className="text-lg">Medical History</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[250px] overflow-y-auto custom-scrollbar">
                  <div className="p-4 space-y-4">
                    <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-medical-blue border-4 border-white shadow-sm"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">12-Apr-2024</p>
                        <p className="text-sm font-bold">Acute Bronchitis</p>
                        <p className="text-xs text-slate-600 mt-1">Patient admitted with difficulty breathing. Started on nebulization.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white shadow-sm"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">20-Mar-2024</p>
                        <p className="text-sm font-bold">Routine Checkup</p>
                        <p className="text-xs text-slate-600 mt-1">General consultation. BP stable. Advised lifestyle changes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lab & Radiology Results */}
            <Card className="border-none shadow-sm h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Lab & Radiology</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="h-[250px] overflow-y-auto custom-scrollbar">
                  <div className="p-4 space-y-3">
                    {labOrders.filter(o => o.patientId === selectedPatient.id).length === 0 ? (
                      <div className="text-center py-10 opacity-30 flex flex-col items-center">
                        <Activity className="w-8 h-8 mb-2" />
                        <p className="text-xs font-bold uppercase">No reports available</p>
                      </div>
                    ) : (
                      labOrders.filter(o => o.patientId === selectedPatient.id).map(order => (
                        <div key={order.id} className={`p-3 rounded-xl border border-slate-100 ${order.status === 'Completed' ? 'bg-emerald-50/30' : 'bg-slate-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-slate-800 leading-tight">{order.test}</p>
                            <Badge className={`text-[9px] border-none uppercase ${
                              order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(order.date)}</p>
                            {order.result && (
                              <div className="text-right">
                                <p className="text-xs font-black text-medical-blue">{order.result} {order.unit}</p>
                                <p className="text-[9px] text-slate-400">Ref: {order.range}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pharmacy History */}
            <Card className="border-none shadow-sm h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">Pharmacy History</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="h-[250px] overflow-y-auto custom-scrollbar">
                  <div className="p-4 space-y-3">
                    {pharmacyBills.filter(b => b.patientId === selectedPatient.id).length === 0 ? (
                      <div className="text-center py-10 opacity-30 flex flex-col items-center">
                        <ShoppingCart className="w-8 h-8 mb-2" />
                        <p className="text-xs font-bold uppercase">No purchase history</p>
                      </div>
                    ) : (
                      pharmacyBills.filter(b => b.patientId === selectedPatient.id).map(bill => (
                        <div key={bill.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex justify-between mb-2">
                            <p className="text-xs font-black text-slate-800">#{bill.id.toUpperCase()}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(bill.date)}</p>
                          </div>
                          <div className="space-y-1">
                            {bill.items.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-[10px]">
                                <span className="text-slate-600 font-bold">{item.name} x{item.quantity}</span>
                                <span className="text-slate-400 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Amount</span>
                            <span className="text-xs font-black text-emerald-600">{formatCurrency(bill.totalAmount)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-medical-blue" />
                  <CardTitle className="text-lg">Recent Prescriptions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[250px] overflow-y-auto custom-scrollbar">
                  <div className="p-4 space-y-3">
                    {prescriptions.filter(rx => rx.patientId === selectedPatient.id).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8 italic">No prescription history</p>
                    ) : (
                      prescriptions.filter(rx => rx.patientId === selectedPatient.id).map(rx => (
                        <div key={rx.id} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold text-blue-600 uppercase">
                              {staff.find(u => u.id === rx.doctor_id || u.id === rx.doctorId)?.name || 'Doctor'}
                            </p>
                            <p className="text-[10px] text-slate-400">{formatDate(rx.date)}</p>
                          </div>
                          <div className="space-y-1">
                            {rx.medicines.map((m, i) => (
                              <p key={i} className="text-xs font-bold">{m.name} ({m.dosage}) - {m.frequency}</p>
                            ))}
                          </div>
                          {rx.attachmentUrl && (
                            <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between">
                              <span className="text-[10px] text-blue-600 font-medium truncate max-w-[100px]">
                                {rx.attachmentName || 'Prescription PDF'}
                              </span>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-medical-blue hover:bg-blue-100 px-2"
                                  onClick={() => {
                                    setPreviewData({ url: rx.attachmentUrl!, name: rx.attachmentName || 'Prescription' });
                                    setIsPreviewOpen(true);
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-slate-500 hover:bg-slate-100 px-2"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = rx.attachmentUrl!;
                                    link.download = rx.attachmentName || 'prescription.pdf';
                                    link.click();
                                  }}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Claims */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-medical-blue" />
                  <CardTitle className="text-lg">Insurance Claims</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[250px] overflow-y-auto custom-scrollbar">
                  <div className="p-4 space-y-3">
                    {patientClaims.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8 italic">No insurance claims found</p>
                    ) : (
                      patientClaims.map(claim => (
                        <div key={claim.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold">{claim.company}</p>
                              <p className="text-[10px] text-slate-500">{claim.id}</p>
                            </div>
                            <Badge className={`${claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} border-none text-[9px] uppercase`}>
                              {claim.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-medical-blue mt-2">{formatCurrency(claim.amount)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing & Payments */}
            {isFinancialVisible && (
              <Card className="border-none shadow-sm md:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-medical-blue" />
                    <CardTitle className="text-lg">Billing & Payment Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Billed</p>
                        <p className="text-lg font-bold">{formatCurrency(patientBills.reduce((acc, b) => acc + b.totalAmount, 0))}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total Paid</p>
                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(patientBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0))}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                        <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Total Dues</p>
                        <p className="text-lg font-bold text-rose-700">{formatCurrency(dues)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {patientBills.map(bill => (
                        <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {bill.status === 'Paid' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-sm font-bold">Invoice #{bill.invoice_number || bill.id.toUpperCase()}</p>
                               <p className="text-[10px] text-slate-500">{formatDate(bill.created_at)} • {bill.payment_method || 'N/A'}</p>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-bold">{formatCurrency(bill.total_amount)}</p>
                             <Badge variant="outline" className="text-[9px] uppercase">{bill.payment_status}</Badge>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Dialog */}
      <Dialog open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Write New Prescription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input 
                placeholder="Initial diagnosis..."
                value={newPrescription.diagnosis}
                onChange={e => setNewPrescription({...newPrescription, diagnosis: e.target.value})}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Medicines</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-medical-blue h-8"
                  onClick={() => setNewPrescription({
                    ...newPrescription, 
                    medicines: [...newPrescription.medicines, { name: '', dosage: '', frequency: '' }]
                  })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Medicine
                </Button>
              </div>
              {newPrescription.medicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6 space-y-1">
                    <Input 
                      placeholder="Medicine name" 
                      value={med.name}
                      onChange={e => {
                        const meds = [...newPrescription.medicines];
                        meds[idx].name = e.target.value;
                        setNewPrescription({...newPrescription, medicines: meds});
                      }}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Input 
                      placeholder="Dosage" 
                      value={med.dosage}
                      onChange={e => {
                        const meds = [...newPrescription.medicines];
                        meds[idx].dosage = e.target.value;
                        setNewPrescription({...newPrescription, medicines: meds});
                      }}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Input 
                      placeholder="Freq" 
                      value={med.frequency}
                      onChange={e => {
                        const meds = [...newPrescription.medicines];
                        meds[idx].frequency = e.target.value;
                        setNewPrescription({...newPrescription, medicines: meds});
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>General Advice</Label>
              <textarea 
                className="w-full min-h-[100px] p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                placeholder="Special instructions or advice..."
                value={newPrescription.advice}
                onChange={e => setNewPrescription({...newPrescription, advice: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrescriptionOpen(false)}>Cancel</Button>
            <Button className="bg-medical-blue" onClick={handleSavePrescription}>Save Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Old Record Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Upload Old Prescription / Record</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center space-y-6">
            {!uploadedFile ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 hover:bg-slate-50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                />
                <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-600">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
              </div>
            ) : (
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-medical-blue">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-800 truncate">{uploadedFile.name}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase">Ready to save</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setUploadedFile(null)}>
                  <Plus className="w-4 h-4 rotate-45" />
                </Button>
              </div>
            )}
            
            <p className="text-xs text-slate-500 italic">
              Note: This record will be attached to the patient's medical history for future reference.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button className="bg-medical-blue" disabled={!uploadedFile} onClick={handleSaveUpload}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-medical-blue" />
              {previewData?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 relative overflow-hidden">
            {(previewData?.url.startsWith('data:application/pdf') || previewData?.name?.toLowerCase().endsWith('.pdf')) ? (
              <object
                data={previewData.url}
                type="application/pdf"
                className="w-full h-full border-none"
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">PDF Preview Not Available</p>
                    <p className="text-sm text-slate-500 max-w-xs">Your browser might be blocking the inline preview. You can still download the file to view it.</p>
                  </div>
                  <Button className="bg-medical-blue" onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewData.url;
                    link.download = previewData.name;
                    link.click();
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              </object>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img 
                  src={previewData?.url} 
                  alt="Prescription Preview" 
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
          <DialogFooter className="p-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
            <Button className="bg-medical-blue" onClick={() => {
              if (previewData) {
                const link = document.createElement('a');
                link.href = previewData.url;
                link.download = previewData.name;
                link.click();
              }
            }}>
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
