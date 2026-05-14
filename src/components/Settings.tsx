import React, { useState, ChangeEvent, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Upload,
  ShieldCheck,
  Users,
  Stethoscope,
  Printer,
  UserPlus,
  Lock,
  Receipt,
  Scissors,
  Image as ImageIcon,
  Layout,
  History,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MOCK_USERS, MOCK_PATIENTS, MOCK_BED_RATES, MOCK_OT_RATES, MOCK_LAB_TESTS, MOCK_MATERIAL_RATES } from '@/mockData';
import { storage, STORAGE_KEYS } from '@/lib/storage';

export default function Settings({ currentUser, onUserUpdate }: { currentUser?: any, onUserUpdate?: (user: any) => void }) {
  const [templateImage, setTemplateImage] = useState<string | null>(() => storage.get(STORAGE_KEYS.TEMPLATE_IMAGE, null));
  const isAccountant = currentUser?.role === 'ACCOUNTANT';

  // Profile State
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '+91 98765 43210'
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '+91 98765 43210'
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = () => {
    if (onUserUpdate && currentUser) {
      const updatedUser = { ...currentUser, ...profileData };
      
      // Update in our users list too
      const updatedUsersList = users.map((u: any) => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsersList);
      
      onUserUpdate(updatedUser);
      storage.set(STORAGE_KEYS.SESSION_USER, updatedUser);
      toast.success('Profile updated successfully');
    }
  };

  useEffect(() => {
    storage.set(STORAGE_KEYS.TEMPLATE_IMAGE, templateImage);
  }, [templateImage]);

  const handleTemplateUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplateImage(reader.result as string);
        toast.success('Document template updated successfully');
      };
      reader.readAsDataURL(file);
    }
  };
  // Hospital Info State
  const [hospitalInfo, setHospitalInfo] = useState(() => storage.get(STORAGE_KEYS.HOSPITAL_INFO, {
    name: 'GLOBAL HOSPITAL',
    address: '123, Medical Square, City Center',
    gst: '27AAAAA0000A1Z5',
    phone: '+91 98765 43210',
    email: 'contact@globalhospital.com',
    logo: null as string | null
  }));

  useEffect(() => {
    storage.set(STORAGE_KEYS.HOSPITAL_INFO, hospitalInfo);
  }, [hospitalInfo]);

  // Departments & Specialties
  const [departments, setDepartments] = useState(['General Medicine', 'Orthopedics', 'Pediatrics', 'Gynaecology', 'Cardiology', 'Pathology', 'Radiology', 'Accounts']);
  const [specialties, setSpecialties] = useState(['Surgery', 'Consultation', 'Emergency', 'Diagnostics']);
  const [newDept, setNewDept] = useState('');
  const [newSpec, setNewSpec] = useState('');

  // User Management
  const [users, setUsers] = useState(() => storage.get(STORAGE_KEYS.USERS, MOCK_USERS));
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'DOCTOR', department: '', password: '' });

  useEffect(() => {
    storage.set(STORAGE_KEYS.USERS, users);
  }, [users]);

  // Rates State
  const [bedRates, setBedRates] = useState(() => storage.get(STORAGE_KEYS.BED_RATES, MOCK_BED_RATES));
  const [otRates, setOtRates] = useState(() => storage.get(STORAGE_KEYS.OT_RATES, MOCK_OT_RATES));
  const [labRates, setLabRates] = useState(() => storage.get(STORAGE_KEYS.LAB_RATES, MOCK_LAB_TESTS));
  const [materialRates, setMaterialRates] = useState(() => storage.get(STORAGE_KEYS.MATERIAL_RATES, MOCK_MATERIAL_RATES));
  
  const [newBedRate, setNewBedRate] = useState({ type: '', rate: '' });
  const [newOtRate, setNewOtRate] = useState({ type: '', rate: '' });
  const [newLabRate, setNewLabRate] = useState({ name: '', category: 'Pathology' as 'Pathology' | 'Radiology', price: '' });
  const [newMaterialRate, setNewMaterialRate] = useState({ name: '', category: 'Disposable' as 'Disposable' | 'Material', price: '' });

  useEffect(() => {
    storage.set(STORAGE_KEYS.BED_RATES, bedRates);
    storage.set(STORAGE_KEYS.OT_RATES, otRates);
    storage.set(STORAGE_KEYS.LAB_RATES, labRates);
    storage.set(STORAGE_KEYS.MATERIAL_RATES, materialRates);
  }, [bedRates, otRates, labRates, materialRates]);

  // Prescription State
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    notes: ''
  });

  const handleSaveHospitalInfo = () => {
    storage.set(STORAGE_KEYS.HOSPITAL_INFO, hospitalInfo);
    toast.success('Hospital information updated and saved successfully');
  };

  const handleAddDept = () => {
    if (newDept && !departments.includes(newDept)) {
      setDepartments([...departments, newDept]);
      setNewDept('');
      toast.success('Department added');
    }
  };

  const handleAddSpec = () => {
    if (newSpec && !specialties.includes(newSpec)) {
      setSpecialties([...specialties, newSpec]);
      setNewSpec('');
      toast.success('Specialty added');
    }
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || (!editingUserId && !newUser.password)) {
      toast.error('Please fill in all user details');
      return;
    }

    if (editingUserId) {
      // Update existing user
      const updatedUsers = users.map((u: any) => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            department: newUser.department,
            // Only update password if provided
            ...(newUser.password ? { password: newUser.password } : {})
          };
        }
        return u;
      });
      setUsers(updatedUsers);
      setEditingUserId(null);
      
      // If we're updating the current user, sync the app state
      if (editingUserId === currentUser?.id) {
        const updatedUser = updatedUsers.find((u: any) => u.id === editingUserId);
        if (onUserUpdate && updatedUser) {
          onUserUpdate(updatedUser);
        }
      }
      
      toast.success('User account updated successfully');
    } else {
      // Add new user
      const userToAdd = {
        id: `u-${Date.now()}`,
        ...newUser,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
      };
      setUsers([...users, userToAdd as any]);
      toast.success(`${newUser.role} account created successfully`);
    }
    
    setNewUser({ name: '', email: '', role: 'DOCTOR', department: '', password: '' });
  };

  const handleAddMedicine = () => {
    setNewPrescription({
      ...newPrescription,
      medicines: [...newPrescription.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const handleSavePrescription = () => {
    if (!newPrescription.patientId || !newPrescription.doctorId) {
      toast.error('Please select patient and doctor');
      return;
    }
    setPrescriptions([...prescriptions, { ...newPrescription, id: `pr-${Date.now()}`, date: new Date().toLocaleDateString() }]);
    toast.success('Prescription saved successfully');
  };

  const handleAddBedRate = () => {
    if (!newBedRate.type || !newBedRate.rate) return;
    setBedRates([...bedRates, { type: newBedRate.type, rate: parseInt(newBedRate.rate) }]);
    setNewBedRate({ type: '', rate: '' });
    toast.success('Bed rate added');
  };

  const handleAddOtRate = () => {
    if (!newOtRate.type || !newOtRate.rate) return;
    setOtRates([...otRates, { type: newOtRate.type, rate: parseInt(newOtRate.rate) }]);
    setNewOtRate({ type: '', rate: '' });
    toast.success('OT rate added');
  };

  const handleAddLabRate = () => {
    if (!newLabRate.name || !newLabRate.price) return;
    setLabRates([...labRates, { id: `lt-${Date.now()}`, name: newLabRate.name, category: newLabRate.category, price: parseInt(newLabRate.price) }]);
    setNewLabRate({ ...newLabRate, name: '', price: '' });
    toast.success('Lab/Radiology rate added');
  };

  const handleAddMaterialRate = () => {
    if (!newMaterialRate.name || !newMaterialRate.price) return;
    setMaterialRates([...materialRates, { name: newMaterialRate.name, price: parseInt(newMaterialRate.price), category: newMaterialRate.category }]);
    setNewMaterialRate({ ...newMaterialRate, name: '', price: '' });
    toast.success('Material rate added');
  };

  const printPrescription = (pres: any) => {
    const patient = MOCK_PATIENTS.find(p => p.id === pres.patientId);
    const doctor = users.find(u => u.id === pres.doctorId);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print prescription');
      return;
    }

    const prescriptionHtml = `
      <html>
        <head>
          <title>Prescription - ${patient?.name}</title>
          <style>
            @page { margin: 15mm; size: A4; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #1e293b;
              line-height: 1.6;
              -webkit-print-color-adjust: exact;
            }
            .template-bg {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: -100;
              opacity: 0.1;
            }
            .content { 
              position: relative;
              padding-top: ${templateImage ? '240px' : '20px'}; 
              margin: 0 30px;
              z-index: 10;
            }
            .hospital-header {
              text-align: center;
              margin-bottom: 40px;
              display: ${templateImage ? 'none' : 'block'};
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            .hospital-name { font-size: 32px; font-weight: 800; color: #2563eb; letter-spacing: -0.025em; margin-bottom: 5px; }
            .hospital-info { font-size: 13px; color: #64748b; font-weight: 500; }
            .rx-symbol { font-size: 60px; font-weight: 800; margin: 20px 0 10px 0; color: #2563eb; font-family: serif; }
            
            .patient-card { 
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 40px;
              display: grid;
              grid-template-columns: 1.5fr 1fr;
              gap: 20px;
              background-color: #f8fafc;
            }
            .info-item { font-size: 15px; }
            .info-label { color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 10px; margin-right: 8px; letter-spacing: 0.05em; }
            .info-value { font-weight: 800; color: #0f172a; }
            
            .medicine-table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
            .medicine-table th { 
              text-align: left; 
              background-color: #f1f5f9;
              padding: 15px; 
              color: #475569; 
              font-size: 11px; 
              text-transform: uppercase; 
              font-weight: 800;
              border-bottom: 2px solid #cbd5e1;
            }
            .medicine-table td { padding: 18px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .med-name { font-weight: 800; color: #1e293b; font-size: 16px; }
            
            .advice-section { 
              margin-top: 40px;
              padding: 25px;
              border-left: 5px solid #2563eb;
              background-color: #f0f7ff;
              border-radius: 0 12px 12px 0;
              page-break-inside: avoid;
            }
            .footer { 
              margin-top: 100px; 
              text-align: center;
              padding-bottom: 100px;
              page-break-inside: avoid;
            }
            .sig-section { display: flex; justify-content: space-between; margin-top: 80px; }
            .sig-box { width: 220px; text-align: center; }
            .sig-line { border-top: 2px solid #0f172a; margin-bottom: 10px; }
            .sig-label { font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; }
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

            <div class="patient-card">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="info-item"><span class="info-label">Patient:</span> <span class="info-value" style="font-size: 20px;">${patient?.name}</span></div>
                <div class="info-item"><span class="info-label">MRN / ID:</span> <span class="info-value">${patient?.mrn}</span></div>
                <div class="info-item"><span class="info-label">Age/Gender:</span> <span class="info-value">${patient?.age} Y / ${patient?.gender}</span></div>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; gap: 8px;">
                <div class="info-item"><span class="info-label">Prescription Date:</span> <span class="info-value">${pres.date || new Date().toLocaleDateString()}</span></div>
                <div class="info-item"><span class="info-label">Doctor:</span> <span class="info-value">${doctor?.name}</span></div>
                <div class="info-item"><span class="info-label">Pres ID:</span> <span class="info-value">#${pres.id.split('-').pop()?.toUpperCase()}</span></div>
              </div>
            </div>

            <div class="rx-symbol">Rx</div>

            <table class="medicine-table">
              <thead>
                <tr>
                  <th style="width: 40%">Medicine & Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th style="text-align: right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${pres.medicines.map((m: any) => `
                  <tr>
                    <td>
                      <div class="med-name">${m.name}</div>
                      <div style="font-size: 12px; color: #64748b; font-weight: 600;">${m.dosage}</div>
                    </td>
                    <td><span style="font-weight: 700; color: #2563eb;">${m.frequency}</span></td>
                    <td><span style="font-weight: 600;">${m.duration}</span></td>
                    <td style="text-align: right; font-weight: 800;"> - </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="advice-section">
              <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em;">Diagnosis & Notes</p>
              <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">${pres.diagnosis}</div>
              <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${pres.notes}</p>
            </div>

            <div class="footer">
              <div class="sig-section">
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <div class="sig-label">Patient Signature</div>
                </div>
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <div class="sig-label">Physician Stamp & Signature</div>
                  <div style="font-size: 11px; font-weight: 700; margin-top: 5px;">${doctor?.name}</div>
                </div>
              </div>
              <div style="margin-top: 60px; color: #94a3b8; font-size: 11px;">This document is for medical use only. Keep safely.</div>
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

    printWindow.document.write(prescriptionHtml);
    printWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Hospital Settings & Configuration</h1>
          <p className="text-muted-foreground">Manage hospital identity, departments, users, and prescriptions.</p>
        </div>
      </div>

      <Tabs defaultValue="hospital" className="space-y-6">
        <TabsList className="bg-white border shadow-sm p-1 h-auto flex-wrap justify-start">
          <TabsTrigger value="profile" className="gap-2"><UserPlus className="w-4 h-4" /> My Profile</TabsTrigger>
          {!isAccountant && <TabsTrigger value="hospital" className="gap-2"><Building2 className="w-4 h-4" /> Hospital Info</TabsTrigger>}
          {!isAccountant && <TabsTrigger value="departments" className="gap-2"><Stethoscope className="w-4 h-4" /> Departments</TabsTrigger>}
          <TabsTrigger value="rates" className="gap-2"><Receipt className="w-4 h-4" /> Rates & Billing</TabsTrigger>
          {!isAccountant && <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> User Panel</TabsTrigger>}
          {!isAccountant && <TabsTrigger value="templates" className="gap-2"><Layout className="w-4 h-4" /> Templates</TabsTrigger>}
          <TabsTrigger value="prescriptions" className="gap-2"><FileText className="w-4 h-4" /> Prescriptions</TabsTrigger>
          {currentUser?.role === 'SUPER_ADMIN' && (
            <TabsTrigger value="audit" className="gap-2"><History className="w-4 h-4" /> Audit Logs</TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Update your personal information and login details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-24 h-24 border-2 border-white shadow-md">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback>{currentUser?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="h-8 text-xs">Change Avatar</Button>
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email / Username</Label>
                    <Input 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={currentUser?.role.replace('_', ' ')} disabled className="bg-slate-50" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button className="bg-medical-blue gap-2" onClick={handleUpdateProfile}>
                  <Save className="w-4 h-4" />
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hospital Info Tab */}
        <TabsContent value="hospital">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Hospital Information</CardTitle>
              <CardDescription>Configure your hospital's public identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden">
                    {hospitalInfo.logo ? (
                      <img src={hospitalInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold uppercase">Upload Logo</span>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs">Change Logo</Button>
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hospital Name</Label>
                    <Input value={hospitalInfo.name} onChange={(e) => setHospitalInfo({...hospitalInfo, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input value={hospitalInfo.gst} onChange={(e) => setHospitalInfo({...hospitalInfo, gst: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input value={hospitalInfo.address} onChange={(e) => setHospitalInfo({...hospitalInfo, address: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={hospitalInfo.phone} onChange={(e) => setHospitalInfo({...hospitalInfo, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={hospitalInfo.email} onChange={(e) => setHospitalInfo({...hospitalInfo, email: e.target.value})} />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button className="bg-medical-blue gap-2" onClick={handleSaveHospitalInfo}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Manage hospital departments and wards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Add new department..." value={newDept} onChange={(e) => setNewDept(e.target.value)} />
                  <Button className="bg-medical-blue" onClick={handleAddDept}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-sm font-medium">{dept}</span>
                      {!isAccountant && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setDepartments(departments.filter(d => d !== dept))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
                <CardDescription>Define medical specialties and services.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Add new specialty..." value={newSpec} onChange={(e) => setNewSpec(e.target.value)} />
                  <Button className="bg-medical-blue" onClick={handleAddSpec}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2">
                  {specialties.map((spec) => (
                    <div key={spec} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-sm font-medium">{spec}</span>
                      {!isAccountant && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setSpecialties(specialties.filter(s => s !== spec))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rates & Billing Tab */}
        <TabsContent value="rates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-medical-blue" />
                  <CardTitle>IPD Bed Rates</CardTitle>
                </div>
                <CardDescription>Set daily charges for different bed categories.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAccountant && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="Bed Type (e.g. Deluxe)" 
                      value={newBedRate.type} 
                      onChange={(e) => setNewBedRate({...newBedRate, type: e.target.value})} 
                    />
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Rate / Day" 
                        value={newBedRate.rate} 
                        onChange={(e) => setNewBedRate({...newBedRate, rate: e.target.value})} 
                      />
                      <Button className="bg-medical-blue" onClick={handleAddBedRate}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {bedRates.map((rate) => (
                    <div key={rate.type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-sm font-bold">{rate.type}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Bed Category</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-medical-blue">₹{rate.rate} / Day</span>
                        {!isAccountant && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setBedRates(bedRates.filter(r => r.type !== rate.type))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-medical-blue" />
                  <CardTitle>OT Charges</CardTitle>
                </div>
                <CardDescription>Fixed charges for different types of surgeries.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAccountant && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="OT Type (e.g. Major)" 
                      value={newOtRate.type} 
                      onChange={(e) => setNewOtRate({...newOtRate, type: e.target.value})} 
                    />
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Fixed Charge" 
                        value={newOtRate.rate} 
                        onChange={(e) => setNewOtRate({...newOtRate, rate: e.target.value})} 
                      />
                      <Button className="bg-medical-blue" onClick={handleAddOtRate}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {otRates.map((rate) => (
                    <div key={rate.type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-sm font-bold">{rate.type}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Surgery Type</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-medical-blue">₹{rate.rate}</span>
                        {!isAccountant && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setOtRates(otRates.filter(r => r.type !== rate.type))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-medical-blue" />
                  <CardTitle>Service Master (Lab & Radiology)</CardTitle>
                </div>
                <CardDescription>Manage rates for all diagnostic tests.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAccountant && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input 
                      placeholder="Test Name" 
                      value={newLabRate.name} 
                      onChange={(e) => setNewLabRate({...newLabRate, name: e.target.value})} 
                      className="md:col-span-2"
                    />
                    <Select value={newLabRate.category} onValueChange={(v: any) => setNewLabRate({...newLabRate, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pathology">Pathology</SelectItem>
                        <SelectItem value="Radiology">Radiology</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Price" 
                        value={newLabRate.price} 
                        onChange={(e) => setNewLabRate({...newLabRate, price: e.target.value})} 
                      />
                      <Button className="bg-medical-blue" onClick={handleAddLabRate}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {labRates.map((rate: any) => (
                      <div key={rate.id || rate.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-sm font-bold">{rate.name}</span>
                          <Badge variant="outline" className="ml-2 text-[9px] uppercase">{rate.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-medical-blue">₹{rate.price}</span>
                          {!isAccountant && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setLabRates(labRates.filter((r: any) => (r.id || r.name) !== (rate.id || rate.name)))}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layout className="w-5 h-5 text-medical-blue" />
                  <CardTitle>Materials & Supplies</CardTitle>
                </div>
                <CardDescription>Manage rates for disposables and materials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAccountant && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input 
                      placeholder="Material Name" 
                      value={newMaterialRate.name} 
                      onChange={(e) => setNewMaterialRate({...newMaterialRate, name: e.target.value})} 
                      className="md:col-span-2"
                    />
                    <Select value={newMaterialRate.category} onValueChange={(v: any) => setNewMaterialRate({...newMaterialRate, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Disposable">Disposable</SelectItem>
                        <SelectItem value="Material">Material</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Price" 
                        value={newMaterialRate.price} 
                        onChange={(e) => setNewMaterialRate({...newMaterialRate, price: e.target.value})} 
                      />
                      <Button className="bg-medical-blue" onClick={handleAddMaterialRate}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {materialRates.map((rate: any) => (
                      <div key={rate.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-sm font-bold">{rate.name}</span>
                          <Badge variant="outline" className="ml-2 text-[9px] uppercase">{rate.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-medical-blue">₹{rate.price}</span>
                          {!isAccountant && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setMaterialRates(materialRates.filter((r: any) => r.name !== rate.name))}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Panel Tab */}
        <TabsContent value="users">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management Panel</CardTitle>
                <CardDescription>Assign IDs, passwords, and roles to hospital staff.</CardDescription>
              </div>
              <Button className="bg-medical-blue gap-2" onClick={() => {
                const element = document.getElementById('user-creation-form');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
                toast.info('Fill the form below to register a new user');
              }}>
                <UserPlus className="w-4 h-4" />
                Add New User
              </Button>
            </CardHeader>
            <CardContent>
              <div id="user-creation-form" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="e.g. Dr. Rajesh Sharma" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email / Username</Label>
                  <Input placeholder="rajesh@hospital.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                    <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="NURSE">Nurse</SelectItem>
                      <SelectItem value="RECEPTION">Receptionist</SelectItem>
                      <SelectItem value="PATHOLOGY">Pathology Head</SelectItem>
                      <SelectItem value="RADIOLOGY">Radiology Head</SelectItem>
                      <SelectItem value="ACCOUNTS">Accounts Officer</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={newUser.department} onValueChange={(v) => setNewUser({...newUser, department: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button className="bg-medical-blue flex-1 gap-2" onClick={handleAddUser}>
                    <ShieldCheck className="w-4 h-4" />
                    {editingUserId ? 'Update Account' : 'Create Account'}
                  </Button>
                  {editingUserId && (
                    <Button variant="outline" onClick={() => {
                      setEditingUserId(null);
                      setNewUser({ name: '', email: '', role: 'DOCTOR', department: '', password: '' });
                    }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Active User Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <img src={user.avatar} alt={user.name} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">{user.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">{user.role}</Badge>
                          <span className="text-[10px] text-slate-400 font-medium truncate">{user.department}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-medical-blue" onClick={() => {
                          setEditingUserId(user.id);
                          setNewUser({
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            department: user.department || '',
                            password: '' // Don't pre-fill password for security
                          });
                          const element = document.getElementById('user-creation-form');
                          if (element) element.scrollIntoView({ behavior: 'smooth' });
                          toast.info('Modifying existing user: ' + user.name);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => {
                          if (user.id === currentUser?.id) {
                            toast.error('Cannot delete yourself!');
                            return;
                          }
                          setUsers(users.filter((u: any) => u.id !== user.id));
                          toast.success('User account removed');
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Document Letterhead Template</CardTitle>
              <CardDescription>Upload a background image for prescriptions, bills, and reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 gap-4">
                {templateImage ? (
                  <div className="relative group w-full max-w-md">
                    <img src={templateImage} alt="Template" className="w-full rounded-lg shadow-lg border border-slate-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg gap-2">
                      <Button variant="secondary" size="sm" onClick={() => document.getElementById('template-upload')?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Replace
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setTemplateImage(null)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-500">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-600">No template uploaded</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Upload a high-quality JPG or PNG of your hospital letterhead.</p>
                    </div>
                    <Button className="bg-medical-blue gap-2" onClick={() => document.getElementById('template-upload')?.click()}>
                      <Upload className="w-4 h-4" />
                      Upload Letterhead
                    </Button>
                  </div>
                )}
                <input 
                  type="file" 
                  id="template-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleTemplateUpload} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Printer className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-bold text-blue-700">Usage Information</p>
                  </div>
                  <div className="text-xs text-blue-600/80 leading-relaxed">
                    This image will be used as the background/header for:
                    <ul className="list-disc list-inside mt-1 ml-1">
                      <li>OPD Prescriptions</li>
                      <li>Billing Invoices</li>
                      <li>Diagnostic Reports</li>
                      <li>Discharge Summaries</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-bold text-amber-700">Blank Prescription</p>
                  </div>
                  <p className="text-xs text-amber-600/80 mb-3">Print a blank prescription using your letterhead template.</p>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-2 border-amber-200 hover:bg-amber-100" onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Blank Prescription</title>
                          <style>
                            @page { margin: 0; }
                            body { margin: 0; padding: 0; }
                          </style>
                        </head>
                        <body onload="window.print(); window.close();">
                          <img src="${templateImage}" style="width: 100%; height: auto;" />
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}>
                    <Printer className="w-3 h-3" />
                    Print Blank
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="prescriptions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle>New Prescription</CardTitle>
                <CardDescription>Create and print a medical prescription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Patient</Label>
                    <Input value={MOCK_PATIENTS.find(p => p.id === newPrescription.patientId)?.name || ''} readOnly className="bg-slate-50" placeholder="Selected via list below/trigger" />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Doctor</Label>
                    <Select value={newPrescription.doctorId} onValueChange={(v) => setNewPrescription({...newPrescription, doctorId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role === 'DOCTOR' || u.role === 'SUPER_ADMIN').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Diagnosis</Label>
                    <Input placeholder="e.g. Acute Viral Fever" value={newPrescription.diagnosis} onChange={(e) => setNewPrescription({...newPrescription, diagnosis: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">Medicines</Label>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleAddMedicine}>
                      <Plus className="w-3 h-3" />
                      Add Medicine
                    </Button>
                  </div>
                  
                  {newPrescription.medicines.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Input placeholder="Medicine Name" value={med.name} onChange={(e) => {
                        const meds = [...newPrescription.medicines];
                        meds[idx].name = e.target.value;
                        setNewPrescription({...newPrescription, medicines: meds});
                      }} />
                      <Input placeholder="Dosage" value={med.dosage} onChange={(e) => {
                        const meds = [...newPrescription.medicines];
                        meds[idx].dosage = e.target.value;
                        setNewPrescription({...newPrescription, medicines: meds});
                      }} />
                      <Input placeholder="Freq" value={med.frequency} onChange={(e) => {
                        const meds = [...newPrescription.medicines];
                        meds[idx].frequency = e.target.value;
                        setNewPrescription({...newPrescription, medicines: meds});
                      }} />
                      <div className="flex gap-2">
                        <Input placeholder="Duration" value={med.duration} onChange={(e) => {
                          const meds = [...newPrescription.medicines];
                          meds[idx].duration = e.target.value;
                          setNewPrescription({...newPrescription, medicines: meds});
                        }} />
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500" onClick={() => {
                          const meds = newPrescription.medicines.filter((_, i) => i !== idx);
                          setNewPrescription({...newPrescription, medicines: meds});
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Input value={newPrescription.notes} onChange={(e) => setNewPrescription({...newPrescription, notes: e.target.value})} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewPrescription({
                    patientId: '', doctorId: '', diagnosis: '', medicines: [{ name: '', dosage: '', frequency: '', duration: '' }], notes: ''
                  })}>Reset</Button>
                  <Button className="bg-medical-blue" onClick={handleSavePrescription}>Save Prescription</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Recent Prescriptions</CardTitle>
                <CardDescription>Print saved prescriptions.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-3">
                    {prescriptions.map((pres) => {
                      const p = MOCK_PATIENTS.find(pat => pat.id === pres.patientId);
                      return (
                        <div key={pres.id} className="p-3 bg-white border rounded-lg flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-sm font-bold">{p?.name}</p>
                            <p className="text-[10px] text-muted-foreground">{pres.date}</p>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => printPrescription(pres)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {currentUser?.role === 'SUPER_ADMIN' && (
          <TabsContent value="audit">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Audit Logs</CardTitle>
                    <CardDescription>Review all major billing updates and deletions for accountability.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => storage.set(STORAGE_KEYS.AUDIT_LOGS, [])}>
                    Clear Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {(() => {
                      const logs = storage.get(STORAGE_KEYS.AUDIT_LOGS, []);
                      if (logs.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-400">
                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">No activity logs found</p>
                          </div>
                        );
                      }
                      return logs.map((log: any) => (
                        <div key={log.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                log.action === 'DELETE' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {log.action === 'DELETE' ? <Trash2 className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold flex items-center gap-2">
                                  {log.userName}
                                  <Badge variant="secondary" className="text-[8px] h-4 uppercase">{log.userRole}</Badge>
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {new Date(log.timestamp).toLocaleString()} • {log.action} Action
                                </p>
                              </div>
                            </div>
                            <Badge className={log.action === 'DELETE' ? 'bg-rose-500' : 'bg-amber-500'}>
                              {log.action}
                            </Badge>
                          </div>
                          <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-hidden">
                            <p className="font-bold text-slate-700 mb-1">Target ID: {log.entityId}</p>
                            {log.action === 'DELETE' && (
                              <p className="text-slate-500">
                                Deleted bill details: ₹{log.details.bill?.totalAmount} for {MOCK_PATIENTS.find(p => p.id === log.details.bill?.patientId)?.name || 'Unknown Patient'}
                              </p>
                            )}
                            {log.action === 'UPDATE' && (
                              <div className="space-y-1">
                                <p className="text-slate-500 font-medium">Change Summary:</p>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div className="p-2 bg-slate-100 rounded border border-slate-200">
                                    <p className="font-bold text-[10px] uppercase text-slate-400">Before</p>
                                    <p className="text-[11px] font-bold">₹{log.details.before?.totalAmount}</p>
                                    <p className="text-[10px] text-slate-500">{log.details.before?.items?.length} Items</p>
                                  </div>
                                  <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                    <p className="font-bold text-[10px] uppercase text-blue-400">After</p>
                                    <p className="text-[11px] font-bold text-blue-700">₹{log.details.after?.totalAmount}</p>
                                    <p className="text-[10px] text-blue-500">{log.details.after?.items?.length} Items</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
