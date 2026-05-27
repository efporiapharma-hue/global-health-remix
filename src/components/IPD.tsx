import { useState, useEffect } from 'react';
import { 
  Bed as BedIcon, 
  UserPlus, 
  Plus,
  Search, 
  Filter, 
  MoreVertical, 
  Activity,
  History,
  FileText,
  LogOut,
  Download,
  Edit,
  Trash2,
  Stethoscope,
  ClipboardList,
  Pill,
  FlaskConical,
  CheckCircle2,
  Printer,
  ArrowLeftRight,
  Receipt,
  User,
  AlertCircle,
  Loader2
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MOCK_BED_RATES, MOCK_USERS, MOCK_PATIENTS } from '@/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabaseService } from '@/services/supabaseService';
import { useDataSync } from '@/hooks/useDataSync';

export default function IPD() {
  const [view, setView] = useState<'beds' | 'admissions'>('beds');
  const [beds, setBeds] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bedsData, patientsData, admissionsData] = await Promise.all([
        supabaseService.getBeds(),
        supabaseService.getPatients(),
        supabaseService.getAdmissions()
      ]);
      if (bedsData) setBeds(bedsData);
      if (patientsData) setPatients(patientsData);
      if (admissionsData) setAdmissions(admissionsData);
    } catch (error) {
      console.error('Error fetching IPD data:', error);
      toast.error('Failed to load IPD data');
    } finally {
      setLoading(false);
    }
  };

  useDataSync(fetchData);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    patientId: '',
    bp: '',
    pulse: '',
    temp: '',
    spo2: ''
  });
  const [transferData, setTransferData] = useState({ patientId: '', fromBedId: '', toBedId: '' });
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [newBed, setNewBed] = useState({ number: '', ward: '', type: 'General' });
  
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({ 
    patientId: '', 
    doctorId: '', 
    ward: '', 
    bedId: '',
    urgency: 'Routine'
  });

  const currentUser = storage.get(STORAGE_KEYS.SESSION_USER, null);
  const isAccountant = currentUser?.role === 'ACCOUNTANT';

  const logAudit = (action: string, entityId: string, details: any) => {
    const logs = storage.get(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'System',
      role: currentUser?.role || 'User',
      action,
      entityId,
      details
    };
    storage.set(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs].slice(0, 500));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergency': return 'bg-rose-500 text-white animate-pulse';
      case 'Urgent': return 'bg-amber-500 text-white';
      case 'Routine': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const handleAddBed = async () => {
    if (!newBed.number || !newBed.ward) {
      toast.error('Please fill in all fields');
      return;
    }
    const synced = await supabaseService.createBed({
      bed_number: newBed.number,
      ward: newBed.ward,
      bed_type: newBed.type,
      status: 'Available',
      daily_rate: MOCK_BED_RATES.find(r => r.type === newBed.type)?.rate || 0
    });

    if (synced) {
      setBeds([...beds, synced]);
      setNewBed({ number: '', ward: '', type: 'General' });
      setIsAddBedOpen(false);
      toast.success('New bed added successfully');
    } else {
      toast.error('Failed to add bed');
    }
  };

  const handleDeleteBed = async (id: string) => {
    const success = await supabaseService.deleteBed(id);
    if (success) {
      setBeds(beds.filter(b => b.id !== id));
      toast.success('Bed removed');
    } else {
      toast.error('Failed to remove bed');
    }
  };

  const handleExportIPD = () => {
    const headers = ['Bed Number', 'Ward', 'Status', 'Patient MRN'];
    const rows = beds.map(b => [
      b.number,
      b.ward,
      b.status,
      b.patientId ? patients.find(p => p.id === b.patientId)?.mrn : 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'ipd_bed_status.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('IPD data exported');
  };

  const handleDischarge = async (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;
    const patient = patients.find(p => p.id === bed.patient_id);
    
    // Find and discharge the active admission record as well
    const activeAdmission = admissions.find(a => a.bed_id === bedId && a.patient_id === bed.patient_id && a.status === 'Admitted');
    if (activeAdmission) {
      await supabaseService.dischargePatient(activeAdmission.id, new Date().toISOString());
    }

    const updatedBed = await supabaseService.updateBedStatus(bedId, 'Available', null);
    if (updatedBed) {
      setBeds(beds.map(b => b.id === bedId ? updatedBed : b));
      // Refresh admissions state
      const updatedAdmissions = await supabaseService.getAdmissions();
      if (updatedAdmissions) setAdmissions(updatedAdmissions);
      toast.success('Patient discharged and bed freed');
    } else {
      toast.error('Failed to discharge patient');
    }
  };

  const pendingAdmissions = patients.filter(p => p.needsAdmission);

  const handleTransfer = async () => {
    if (!transferData.toBedId) {
      toast.error('Please select a target bed');
      return;
    }

    const successFrom = await supabaseService.updateBedStatus(transferData.fromBedId, 'Available', null);
    const successTo = await supabaseService.updateBedStatus(transferData.toBedId, 'Occupied', transferData.patientId);

    if (successFrom && successTo) {
      setBeds(beds.map(b => {
        if (b.id === transferData.fromBedId) return successFrom;
        if (b.id === transferData.toBedId) return successTo;
        return b;
      }));
      setIsTransferOpen(false);
      toast.success('Patient transferred successfully');
    } else {
      toast.error('Failed to complete transfer');
    }
  };

  const calculateBedCharges = (patientId: string) => {
    const bed = beds.find(b => b.patientId === patientId);
    if (!bed) return 0;
    const rate = MOCK_BED_RATES.find(r => r.type === bed.type)?.rate || 0;
    // Mocking 3 days of stay for demonstration
    return rate * 3;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
        <p className="text-muted-foreground animate-pulse">Loading IPD records...</p>
      </div>
    );
  }

  const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
  const totalBeds = beds.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAdmissions = admissions.filter(a => {
    if (!a.admission_date) return false;
    return a.admission_date.startsWith(todayStr);
  }).length;

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '09:30 AM';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IPD Management</h1>
          <p className="text-muted-foreground">Manage admissions, bed allocation, and inpatient care.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Input 
              placeholder="Filter by name or phone..." 
              className="pl-9 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExportIPD}>
            <Download className="w-4 h-4" />
            Export Status
          </Button>
          {!isAccountant && (
            <Dialog open={isAddBedOpen} onOpenChange={setIsAddBedOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" onClick={() => setIsAddBedOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Bed
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Add New Bed</DialogTitle>
                  <DialogDescription>Add a new bed to a ward or department.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Bed Number</Label>
                    <Input placeholder="e.g. 105" value={newBed.number} onChange={(e) => setNewBed({...newBed, number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ward / Department</Label>
                    <Select value={newBed.ward} onValueChange={(v) => setNewBed({...newBed, ward: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Ward A">General Ward A</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="Maternity">Maternity Ward</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bed Type</Label>
                    <Select value={newBed.type} onValueChange={(v) => setNewBed({...newBed, type: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="Maternity">Maternity</SelectItem>
                        <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button className="bg-medical-blue flex-1" onClick={handleAddBed}>Add Bed</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {!isAccountant && (
            <Dialog open={isAdmissionOpen} onOpenChange={setIsAdmissionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-medical-blue gap-2" onClick={() => setIsAdmissionOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                  New Admission
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>New IPD Admission</DialogTitle>
                  <DialogDescription>Allocate a bed and register a new inpatient.</DialogDescription>
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
                            setAdmissionForm({...admissionForm, patientId: ''});
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
                                setAdmissionForm({...admissionForm, patientId: p.id});
                                setPatientSearchTerm(p.name);
                                setShowPatientResults(false);
                              }}
                            >
                              <div>
                                <p className="text-sm font-medium">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">{p.phone} • MRN: {p.mrn}</p>
                              </div>
                              {admissionForm.patientId === p.id && <CheckCircle2 className="w-4 h-4 text-medical-blue" />}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                            No patients found.
                          </div>
                        )}
                      </div>
                    )}

                    {admissionForm.patientId && patients.find(p => p.id === admissionForm.patientId) && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-blue-700 truncate">
                            {patients.find(p => p.id === admissionForm.patientId)?.name}
                          </p>
                          <p className="text-[10px] text-blue-600 truncate">
                            {patients.find(p => p.id === admissionForm.patientId)?.age} yrs • {patients.find(p => p.id === admissionForm.patientId)?.gender} • MRN: {patients.find(p => p.id === admissionForm.patientId)?.mrn}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-100"
                          onClick={() => {
                            setAdmissionForm({...admissionForm, patientId: ''});
                            setPatientSearchTerm('');
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Attending Doctor</Label>
                    <Select 
                      value={admissionForm.doctorId}
                      onValueChange={(v) => setAdmissionForm({...admissionForm, doctorId: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_USERS.filter(u => u.role === 'DOCTOR' || u.role === 'SUPER_ADMIN' || u.role === 'SURGEON').map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{doc.name} {doc.degree ? ` - ${doc.degree}` : ''}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {doc.department} {doc.specialization ? `• ${doc.specialization}` : ''}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ward / Department</Label>
                    <Select 
                      value={admissionForm.ward}
                      onValueChange={(v) => setAdmissionForm({...admissionForm, ward: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Ward A">General Ward A</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="Maternity">Maternity Ward</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bed Number</Label>
                    <Select 
                      value={admissionForm.bedId}
                      onValueChange={(v) => setAdmissionForm({...admissionForm, bedId: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bed" />
                      </SelectTrigger>
                      <SelectContent>
                        {beds.filter(b => b.status === 'Available' && (!admissionForm.ward || b.ward === admissionForm.ward)).map(b => (
                          <SelectItem key={b.id} value={b.id}>Bed {b.number} ({b.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Admission Urgency</Label>
                    <Select 
                      value={admissionForm.urgency}
                      onValueChange={(v) => setAdmissionForm({...admissionForm, urgency: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Routine">🟢 Routine</SelectItem>
                        <SelectItem value="Urgent">🟡 Urgent</SelectItem>
                        <SelectItem value="Emergency">🔴 Emergency</SelectItem>
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
                        if (!admissionForm.patientId || !admissionForm.bedId) {
                          toast.error('Please select patient and bed');
                          return;
                        }

                        const syncedAdmission = await supabaseService.createAdmission({
                          patient_id: admissionForm.patientId,
                          bed_id: admissionForm.bedId,
                          doctor_id: admissionForm.doctorId || null,
                          ward: admissionForm.ward,
                          urgency: admissionForm.urgency,
                          status: 'Admitted'
                        });

                        if (syncedAdmission) {
                          // Update bed status in Supabase
                          const updatedBed = await supabaseService.updateBedStatus(admissionForm.bedId, 'Occupied', admissionForm.patientId);
                          
                          // Update patient status in Supabase
                          await supabaseService.updatePatient(admissionForm.patientId, { 
                            needs_admission: false, 
                            status: 'Admitted' 
                          });

                          // Update local state
                          setPatients(patients.map(p => 
                            p.id === admissionForm.patientId ? { ...p, needs_admission: false, status: 'Admitted' } : p
                          ));

                          setAdmissions([syncedAdmission, ...admissions]);

                          if (updatedBed) {
                            setBeds(beds.map(b => b.id === admissionForm.bedId ? updatedBed : b));
                          }

                          toast.success('Patient admitted successfully');
                          setIsAdmissionOpen(false);
                          setAdmissionForm({ patientId: '', doctorId: '', ward: '', bedId: '', urgency: 'Routine' });
                          setPatientSearchTerm('');
                        } else {
                          toast.error('Failed to record admission');
                        }
                      }}
                    >
                      Confirm Admission
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {pendingAdmissions.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">{pendingAdmissions.length} Pending IPD Transfer Requests</h4>
              <p className="text-xs text-amber-700 font-medium">Patients marked for admission from OPD require bed allocation.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {pendingAdmissions.map(p => (
              <Button 
                key={p.id}
                variant="outline" 
                size="sm" 
                className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100 font-bold px-4 h-9"
                onClick={() => {
                  setAdmissionForm({ ...admissionForm, patientId: p.id });
                  setPatientSearchTerm(p.name);
                  setIsAdmissionOpen(true);
                }}
              >
                Admit {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <BedIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{occupiedBeds} / {totalBeds}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase">Beds Occupied</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-teal-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-100 text-teal-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayAdmissions}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase">Today's Admissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <Button 
          variant={view === 'beds' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('beds')}
          className={view === 'beds' ? 'bg-white shadow-sm font-bold' : 'font-medium'}
        >
          Bed Status
        </Button>
        <Button 
          variant={view === 'admissions' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('admissions')}
          className={view === 'admissions' ? 'bg-white shadow-sm font-bold' : 'font-medium'}
        >
          Active Admissions
        </Button>
      </div>

      {view === 'beds' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {beds.filter(bed => {
            if (!searchQuery) return true;
            const patient = bed.patient_id ? patients.find(p => p.id === bed.patient_id) : null;
            if (!patient) return bed.bed_number.includes(searchQuery);
            return patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   patient.phone.includes(searchQuery) ||
                   patient.mrn.toLowerCase().includes(searchQuery.toLowerCase());
          }).map((bed) => {
            const patient = bed.patient_id ? patients.find(p => p.id === bed.patient_id) : null;
            const doctor = patient?.attending_doctor_id ? MOCK_USERS.find(u => u.id === patient.attending_doctor_id) : null;
            return (
              <Card key={bed.id} className={`border-none shadow-sm transition-all hover:ring-2 hover:ring-medical-blue/10 ${bed.status === 'Occupied' ? 'bg-white' : 'bg-slate-50/50'}`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight ${
                      bed.status === 'Available' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                      bed.status === 'Occupied' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                      'text-amber-600 bg-amber-50 border-amber-100'
                    }`}>
                      {bed.status}
                    </Badge>
                      <div className="flex gap-1">
                        {bed.urgency && (
                          <Badge className={`${getUrgencyColor(bed.urgency as string)} text-[9px] border-none`}>
                            {bed.urgency}
                          </Badge>
                        )}
                        {bed.status === 'Occupied' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-medical-blue" 
                              title="Patient 360 Overview"
                              onClick={() => window.location.href = `/patient-overview?id=${patient?.id}`}
                            >
                              <Activity className="w-3 h-3" />
                            </Button>
                            {!isAccountant && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-amber-500" 
                                title="Transfer Bed"
                                onClick={() => {
                                  setTransferData({ patientId: bed.patient_id!, fromBedId: bed.id, toBedId: '' });
                                  setIsTransferOpen(true);
                                }}
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                              </Button>
                            )}
                            {!isAccountant && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => handleDischarge(bed.id)}>
                                <LogOut className="w-3 h-3" />
                              </Button>
                            )}
                          </>
                        )}
                        {!isAccountant && (
                          <>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => handleDeleteBed(bed.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                  </div>
                  <CardTitle className="text-lg mt-2 font-bold">Bed {bed.bed_number}</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-wider">{bed.ward}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {patient ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold truncate">{patient.name}</p>
                          <p className="text-[10px] text-muted-foreground">{patient.phone} • {patient.mrn}</p>
                        </div>
                      </div>

                      {doctor && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Attending Doctor</p>
                          <p className="text-[11px] font-medium text-slate-700">{doctor.name}</p>
                          <p className="text-[9px] text-slate-500">{doctor.department} • {doctor.specialization}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[10px] gap-1"
                          onClick={() => {
                            const currentVitals = storage.get(STORAGE_KEYS.PATIENT_VITALS, []);
                            const patientVitals = currentVitals.find((v: any) => v.patientId === patient.id);
                            setVitalsForm({
                              patientId: patient.id,
                              bp: patientVitals?.bp || '120/80',
                              pulse: patientVitals?.pulse || '78',
                              temp: patientVitals?.temp || '98.6',
                              spo2: patientVitals?.spo2 || '98'
                            });
                            setIsVitalsOpen(true);
                          }}
                        >
                          <Activity className="w-3 h-3" />
                          Vitals
                        </Button>

                        <Dialog open={isVitalsOpen} onOpenChange={setIsVitalsOpen}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Patient Vitals - {patients.find(p => p.id === vitalsForm.patientId)?.name}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Blood Pressure</Label>
                                <Input 
                                  value={vitalsForm.bp} 
                                  onChange={(e) => setVitalsForm({...vitalsForm, bp: e.target.value})}
                                  placeholder="e.g. 120/80"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Pulse Rate (bpm)</Label>
                                <Input 
                                  value={vitalsForm.pulse} 
                                  onChange={(e) => setVitalsForm({...vitalsForm, pulse: e.target.value})}
                                  placeholder="e.g. 78"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Temperature (°F)</Label>
                                <Input 
                                  value={vitalsForm.temp} 
                                  onChange={(e) => setVitalsForm({...vitalsForm, temp: e.target.value})}
                                  placeholder="e.g. 98.6"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">SpO2 (%)</Label>
                                <Input 
                                  value={vitalsForm.spo2} 
                                  onChange={(e) => setVitalsForm({...vitalsForm, spo2: e.target.value})}
                                  placeholder="e.g. 98"
                                />
                              </div>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                              <Button variant="outline" onClick={() => setIsVitalsOpen(false)} className="flex-1">Cancel</Button>
                              <Button className="bg-medical-blue flex-1" onClick={() => {
                                const currentVitals = storage.get(STORAGE_KEYS.PATIENT_VITALS, []);
                                const otherVitals = currentVitals.filter((v: any) => v.patientId !== vitalsForm.patientId);
                                const newVitals = [
                                  {
                                    ...vitalsForm,
                                    id: `v-${Date.now()}`,
                                    timestamp: new Date().toISOString()
                                  },
                                  ...otherVitals
                                ];
                                storage.set(STORAGE_KEYS.PATIENT_VITALS, newVitals);
                                window.dispatchEvent(new Event('storage'));
                                logAudit('VITALS_UPDATE', vitalsForm.patientId, vitalsForm);
                                toast.success('Vitals updated successfully');
                                setIsVitalsOpen(false);
                              }}>Update Vitals</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[10px] gap-1"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsChartOpen(true);
                          }}
                        >
                          <FileText className="w-3 h-3" />
                          Patient Chart
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center justify-center text-slate-300">
                      <BedIcon className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ready for Admission</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Patient</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Bed Details</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Urgency</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Doctor</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Admission Date</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beds.filter(b => b.status === 'Occupied').map(bed => {
                  const patient = patients.find(p => p.id === bed.patient_id);
                  const doctor = patient?.attending_doctor_id ? MOCK_USERS.find(u => u.id === patient.attending_doctor_id) : null;
                  const admission = admissions.find(a => a.bed_id === bed.id && a.patient_id === bed.patient_id && a.status === 'Admitted');
                  return (
                    <TableRow key={bed.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {patient?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{patient?.name}</p>
                            <p className="text-[10px] text-slate-500">{patient?.mrn}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-medical-blue">Bed {bed.bed_number}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{bed.ward} ({bed.bed_type})</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getUrgencyColor(bed.urgency as string)} text-[9px] border-none`}>
                          {bed.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{doctor?.name || 'Assigned Soon'}</p>
                        <p className="text-[10px] text-slate-400">{doctor?.department || 'General'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium text-slate-600">
                          {admission?.admission_date ? formatDate(admission.admission_date) : 'Recently'}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {admission?.admission_date ? formatTime(admission.admission_date) : ''}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-medical-blue" onClick={() => { setSelectedPatient(patient!); setIsChartOpen(true); }}>
                            <FileText className="w-4 h-4" />
                          </Button>
                          {!isAccountant && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleDischarge(bed.id)}>
                              <LogOut className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {/* Patient Chart Dialog */}
      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Patient Clinical Chart</DialogTitle>
                <DialogDescription>
                  {selectedPatient?.name} ({selectedPatient?.mrn}) • Bed {beds.find(b => b.patient_id === selectedPatient?.id)?.bed_number}
                </DialogDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                IPD Admission
              </Badge>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="doctor" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-5 bg-slate-100/50 p-1">
                <TabsTrigger value="doctor" className="text-xs gap-2">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Doctor
                </TabsTrigger>
                <TabsTrigger value="nurse" className="text-xs gap-2">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Nurse
                </TabsTrigger>
                <TabsTrigger value="prescription" className="text-xs gap-2">
                  <Pill className="w-3.5 h-3.5" />
                  Prescription
                </TabsTrigger>
                <TabsTrigger value="tests" className="text-xs gap-2">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Tests
                </TabsTrigger>
                <TabsTrigger value="billing" className="text-xs gap-2">
                  <Receipt className="w-3.5 h-3.5" />
                  Charges
                </TabsTrigger>
              </TabsList>
            </div>

          <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
            <TabsContent value="doctor" className="mt-0 space-y-4">
                <div className="space-y-4">
                  {selectedPatient?.attending_doctor_id && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="h-12 w-12 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Attending Clinician</p>
                        <p className="text-base font-bold text-blue-900 truncate">
                          {MOCK_USERS.find(u => u.id === selectedPatient.attending_doctor_id)?.name}
                        </p>
                        <p className="text-xs text-blue-700 font-medium truncate">
                          {MOCK_USERS.find(u => u.id === selectedPatient.attending_doctor_id)?.department} 
                          {MOCK_USERS.find(u => u.id === selectedPatient.attending_doctor_id)?.specialization ? ` • ${MOCK_USERS.find(u => u.id === selectedPatient.attending_doctor_id)?.specialization}` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-medical-blue"></div>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-medical-blue uppercase">Dr. Rajesh Sharma</p>
                      <p className="text-[10px] text-slate-400">12-Apr-2024 09:30 AM</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Patient showing improvement in respiratory symptoms. Lung sounds are clearer. 
                      Continue nebulization therapy. Monitor oxygen saturation every 2 hours.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-medical-blue/30"></div>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Dr. Rajesh Sharma</p>
                      <p className="text-[10px] text-slate-400">11-Apr-2024 06:15 PM</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Initial assessment completed. Patient admitted with acute bronchitis. 
                      Started on IV antibiotics and hydration.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Add Doctor's Note</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 transition-all"
                      placeholder="Enter clinical observations, diagnosis updates, or instructions..."
                    />
                    {!isAccountant && (
                      <div className="flex justify-end mt-2">
                        <Button size="sm" className="bg-medical-blue" onClick={() => toast.success('Doctor note saved')}>
                          Save Doctor Note
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nurse" className="mt-0 space-y-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-emerald-600 uppercase">Nurse Meena</p>
                      <p className="text-[10px] text-slate-400">12-Apr-2024 11:00 AM</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Patient's temperature recorded at 99.1°F. Administered prescribed oral medications. 
                      Patient complained of mild headache. Encouraged fluid intake.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Add Nurse's Note</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 transition-all"
                      placeholder="Enter nursing observations, care provided, or patient complaints..."
                    />
                    {!isAccountant && (
                      <div className="flex justify-end mt-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('Nurse note saved')}>
                          Save Nurse Note
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="prescription" className="mt-0 space-y-4">
                <Card className="border-slate-100 shadow-none">
                  <CardHeader className="p-4 bg-slate-50 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Active Prescription</p>
                      <p className="text-sm font-bold text-slate-800">Dr. Rajesh Sharma</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-medical-blue gap-1.5">
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Tab. Augmentin 625mg</p>
                          <p className="text-[10px] text-slate-500">Antibiotic • Twice a day (1-0-1)</p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-none">5 Days</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Syp. Ascoril LS</p>
                          <p className="text-[10px] text-slate-500">Cough Syrup • 5ml Thrice a day</p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-none">3 Days</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Tab. Pan 40mg</p>
                          <p className="text-[10px] text-slate-500">Antacid • Once a day (Empty stomach)</p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-none">7 Days</Badge>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">General Advice</p>
                      <p className="text-xs text-slate-600 italic">Complete bed rest. Avoid cold drinks. Steam inhalation twice daily.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tests" className="mt-0 space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Recommended Tests</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <FlaskConical className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Complete Blood Count (CBC)</p>
                            <p className="text-[10px] text-slate-500">Recommended by Dr. Rajesh Sharma</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-50 text-amber-600 border-none">Pending</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Chest X-Ray (PA View)</p>
                            <p className="text-[10px] text-slate-500">Completed on 11-Apr-2024</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none">Result Ready</Badge>
                      </div>
                    </div>
                  </div>

                  {!isAccountant && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Recommend New Test</Label>
                      <div className="flex gap-2">
                        <Select>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select test type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cbc">CBC (Blood Test)</SelectItem>
                            <SelectItem value="lft">Liver Function Test</SelectItem>
                            <SelectItem value="kft">Kidney Function Test</SelectItem>
                            <SelectItem value="xray">X-Ray Chest</SelectItem>
                            <SelectItem value="mri">MRI Brain</SelectItem>
                            <SelectItem value="ct">CT Scan Abdomen</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button className="bg-medical-blue" onClick={() => toast.success('Test recommended successfully')}>
                          Recommend
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="billing" className="mt-0 space-y-4">
                <Card className="border-slate-100 shadow-none">
                  <CardHeader className="p-4 bg-slate-50">
                    <CardTitle className="text-sm">Estimated Bed Charges</CardTitle>
                    <CardDescription className="text-xs">Based on current ward occupancy</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-medium">Bed Type</p>
                        <p className="text-xs text-muted-foreground">{beds.find(b => b.patient_id === selectedPatient?.id)?.bed_type} Bed</p>
                      </div>
                      <p className="text-sm font-bold">
                        {formatCurrency(MOCK_BED_RATES.find(r => r.type === beds.find(b => b.patient_id === selectedPatient?.id)?.bed_type)?.rate || 0)} / Day
                      </p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-medium">Occupancy</p>
                        <p className="text-xs text-muted-foreground">Admitted on 10-Apr-2024</p>
                      </div>
                      <p className="text-sm font-bold">3 Days</p>
                    </div>
                    <div className="flex justify-between items-center py-4 bg-medical-blue/5 px-3 rounded-lg">
                      <p className="font-bold text-medical-blue">Total Bed Charges</p>
                      <p className="text-lg font-bold text-medical-blue">{formatCurrency(calculateBedCharges(selectedPatient?.id))}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      * Final charges will be calculated at the time of discharge based on actual hours.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="p-4 border-t bg-slate-50 flex justify-end">
            <DialogTrigger asChild>
              <Button variant="outline">Close Chart</Button>
            </DialogTrigger>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bed Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Transfer Patient</DialogTitle>
            <DialogDescription>
              Transfer {MOCK_PATIENTS.find(p => p.id === transferData.patientId)?.name} to another bed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Bed</Label>
              <Input disabled value={`Bed ${beds.find(b => b.id === transferData.fromBedId)?.bed_number} (${beds.find(b => b.id === transferData.fromBedId)?.ward})`} />
            </div>
            <div className="space-y-2">
              <Label>Target Bed</Label>
              <Select value={transferData.toBedId} onValueChange={(v) => setTransferData({...transferData, toBedId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target bed" />
                </SelectTrigger>
                <SelectContent>
                  {beds.filter(b => b.status === 'Available').map(b => (
                    <SelectItem key={b.id} value={b.id}>Bed {b.bed_number} - {b.ward} ({b.bed_type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button className="bg-medical-blue" onClick={handleTransfer}>Confirm Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
