import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  User,
  Calendar, 
  FileText, 
  CreditCard, 
  FlaskConical, 
  Stethoscope, 
  Pill, 
  Baby, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  Scissors,
  ClipboardList,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import Dashboard from './components/Dashboard';
import OPD from './components/OPD';
import IPD from './components/IPD';
import Billing from './components/Billing';
import Pharmacy from './components/Pharmacy';
import Maternity from './components/Maternity';
import Lab from './components/Lab';
import Staff from './components/Staff';
import Expenses from './components/Expenses';
import OTManagement from './components/OTManagement';
import NursingStation from './components/NursingStation';
import PharmacyPOS from './components/PharmacyPOS';
import Insurance from './components/Insurance';
import PatientOverview from './components/PatientOverview';
import SettingsComponent from './components/Settings';
import Login from './components/Login';

import { storage, STORAGE_KEYS } from '@/lib/storage';
import { MOCK_PATIENTS, MOCK_USERS } from './mockData';
import { User as UserType } from './types';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'NURSE', 'LAB_STAFF', 'PHARMACIST', 'ACCOUNTANT'] },
  { name: 'OPD Management', icon: Stethoscope, path: '/opd', roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'NURSE'] },
  { name: 'IPD Management', icon: Calendar, path: '/ipd', roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'NURSE'] },
  { name: 'Nursing Station', icon: ClipboardList, path: '/nursing', roles: ['SUPER_ADMIN', 'NURSE', 'DOCTOR'] },
  { name: 'OT Management', icon: Scissors, path: '/ot', roles: ['SUPER_ADMIN', 'DOCTOR', 'SURGEON'] },
  { name: 'Insurance & TPA', icon: Shield, path: '/insurance', roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { name: 'Patient 360', icon: User, path: '/patient-overview', roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTION'] },
  { name: 'Billing & Accounts', icon: CreditCard, path: '/billing', roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { name: 'Lab & Radiology', icon: FlaskConical, path: '/lab', roles: ['SUPER_ADMIN', 'LAB_STAFF', 'DOCTOR'] },
  { name: 'Pharmacy', icon: Pill, path: '/pharmacy', roles: ['SUPER_ADMIN', 'PHARMACIST', 'DOCTOR'] },
  { name: 'Maternity', icon: Baby, path: '/maternity', roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { name: 'Staff Management', icon: Users, path: '/staff', roles: ['SUPER_ADMIN'] },
  { name: 'Expenses', icon: FileText, path: '/expenses', roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
];

function SidebarContent({ onLogout, user, hospitalInfo }: { onLogout: () => void, user: UserType | null, hospitalInfo: any }) {
  const location = useLocation();
  
  const filteredNavItems = navItems.filter(item => 
    !user || item.roles.includes(user.role)
  );
  
  return (
    <div className="flex flex-col h-full bg-white border-r overflow-hidden">
      <div className="p-6 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center text-white font-bold text-xl overflow-hidden">
          {hospitalInfo.logo ? (
            <img src={hospitalInfo.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            hospitalInfo.name.charAt(0)
          )}
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none text-medical-blue uppercase">{hospitalInfo.name}</h1>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">Healthcare Center</p>
        </div>
      </div>
      
      <Separator className="flex-shrink-0" />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-medical-blue text-white' 
                    : 'text-secondary-text hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 mt-auto flex-shrink-0 border-t bg-white">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
              <AvatarImage src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali"} />
              <AvatarFallback>{user?.name.substring(0, 2).toUpperCase() || "AG"}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name || "Dr. Anjali Gupta"}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{user?.role.replace('_', ' ') || "Super Admin"}</p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8">
              <Settings className="w-3 h-3" />
              Settings
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-xs h-8 mt-1 text-soft-red hover:text-soft-red hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut className="w-3 h-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickRegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'male',
    facility: 'OPD'
  });

  const handleRegister = () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in required fields');
      return;
    }

    const currentPatients = storage.get(STORAGE_KEYS.PATIENTS, MOCK_PATIENTS);
    const mrn = `MRN${Math.floor(Math.random() * 90000) + 10000}`;
    
    let registrationType = 'Quick';
    if (formData.facility === 'Lab') registrationType = 'Quick-Lab';
    else if (formData.facility === 'Pharmacy') registrationType = 'Quick-Pharmacy';
    else if (formData.facility === 'Radiology') registrationType = 'Quick-Radiology';
    else if (formData.facility === 'OPD') registrationType = 'OPD/IPD';

    const patientToAdd = {
      id: `p-quick-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      age: Number(formData.age) || 0,
      gender: formData.gender,
      mrn,
      status: 'Stable',
      lastVisit: new Date().toISOString().split('T')[0],
      registrationType
    };

    const updatedPatients = [patientToAdd, ...currentPatients];
    storage.set(STORAGE_KEYS.PATIENTS, updatedPatients);
    
    // Trigger storage event for other components to update
    window.dispatchEvent(new Event('storage'));
    
    toast.success(`Patient registered successfully for ${formData.facility}! MRN: ${mrn}`);
    setFormData({ name: '', phone: '', age: '', gender: 'male', facility: 'OPD' });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="header-name">Full Name *</Label>
          <Input 
            id="header-name" 
            placeholder="Enter patient name" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="header-phone">Phone Number *</Label>
          <Input 
            id="header-phone" 
            placeholder="Enter phone number" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="header-age">Age</Label>
          <Input 
            id="header-age" 
            type="number" 
            placeholder="Age" 
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="header-gender">Gender</Label>
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
        <div className="col-span-2 space-y-2">
          <Label htmlFor="header-facility">Facility / Purpose</Label>
          <Select 
            value={formData.facility}
            onValueChange={(v) => setFormData({...formData, facility: v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPD">OPD Consultation</SelectItem>
              <SelectItem value="Pharmacy">Pharmacy / Medicine</SelectItem>
              <SelectItem value="Lab">Laboratory / Blood Test</SelectItem>
              <SelectItem value="Radiology">Radiology / X-Ray</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setFormData({ name: '', phone: '', age: '', gender: 'male', facility: 'OPD' })}>Reset</Button>
        <Button className="bg-medical-blue" onClick={handleRegister}>Confirm Registration</Button>
      </DialogFooter>
    </div>
  );
}

export default function App() {
  const [hospitalInfo, setHospitalInfo] = useState(() => storage.get(STORAGE_KEYS.HOSPITAL_INFO, {
    name: 'GLOBAL HOSPITAL',
    address: '123, Medical Square, City Center',
    gst: '27AAAAA0000A1Z5',
    phone: '+91 98765 43210',
    email: 'contact@globalhospital.com',
    logo: null as string | null
  }));

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(() => {
    return storage.get(STORAGE_KEYS.SESSION_USER, null);
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return storage.get(STORAGE_KEYS.AUTH_STATUS, false);
  });

  const handleLogin = (userData: UserType) => {
    storage.set(STORAGE_KEYS.AUTH_STATUS, true);
    storage.set(STORAGE_KEYS.SESSION_USER, userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const handleStorage = () => {
      const savedUser = storage.get(STORAGE_KEYS.SESSION_USER, null);
      if (savedUser) {
        setUser(savedUser);
      }
      const auth = storage.get(STORAGE_KEYS.AUTH_STATUS, false);
      setIsAuthenticated(auth);
      
      const savedHospital = storage.get(STORAGE_KEYS.HOSPITAL_INFO, null);
      if (savedHospital) {
        setHospitalInfo(savedHospital);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    storage.remove(STORAGE_KEYS.AUTH_STATUS);
    storage.remove(STORAGE_KEYS.SESSION_USER);
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
      <div className="flex h-[100dvh] bg-soft-white overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 h-full">
          <SidebarContent onLogout={handleLogout} user={user} hospitalInfo={hospitalInfo} />
        </aside>
 
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 h-full">
                  <SidebarContent onLogout={handleLogout} user={user} hospitalInfo={hospitalInfo} />
                </SheetContent>
              </Sheet>
              
              <div className="relative hidden md:block w-64 lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search patients, MRN, or appointments..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 transition-all"
                />
              </div>
            </div>
 
            <div className="flex items-center gap-2 lg:gap-4">
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'RECEPTION' || user?.role === 'NURSE') && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 rounded-full px-4 border-medical-blue text-medical-blue hover:bg-medical-blue hover:text-white transition-all">
                      <Plus className="w-4 h-4" />
                      Quick Register
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Quick Patient Registration</DialogTitle>
                    </DialogHeader>
                    <QuickRegisterForm />
                  </DialogContent>
                </Dialog>
              )}
              
              <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />
              
              <Button variant="ghost" size="icon" className="relative text-secondary-text">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-soft-red rounded-full border-2 border-white"></span>
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none">{user?.name}</p>
                  <p className="text-[9px] text-muted-foreground uppercase mt-1 font-bold">{user?.role.replace('_', ' ')}</p>
                </div>
                <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-medical-blue/20 transition-all">
                  <AvatarImage src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali"} />
                  <AvatarFallback>{user?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
 
          {/* Viewport */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/opd" element={<OPD />} />
              <Route path="/ipd" element={<IPD />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/lab" element={<Lab />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/pharmacy/pos" element={<PharmacyPOS />} />
              <Route path="/maternity" element={<Maternity />} />
              <Route path="/ot" element={<OTManagement />} />
              <Route path="/insurance" element={<Insurance />} />
              <Route path="/patient-overview" element={<PatientOverview userRole={user?.role} />} />
              <Route path="/nursing" element={<NursingStation />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/settings" element={<SettingsComponent currentUser={user} onUserUpdate={(updatedUser) => {
                setUser(updatedUser);
                storage.set(STORAGE_KEYS.SESSION_USER, updatedUser);
              }} />} />
            </Routes>
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}
