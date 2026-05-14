import { useState, useEffect } from 'react';
import { 
  Baby, 
  Heart, 
  Activity, 
  Calendar, 
  Plus, 
  MoreVertical,
  ClipboardList,
  Download,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabaseService } from '@/services/supabaseService';

export default function Maternity() {
  const [patients, setPatients] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [newborns, setNewborns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDelivery, setNewDelivery] = useState({ 
    motherId: '', 
    date: '', 
    time: '', 
    gender: 'male', 
    weight: 3.0, 
    type: 'normal',
    surgeon_id: ''
  });
  const [staff, setStaff] = useState<any[]>([]);

  const mothersList = patients.filter((p: any) => 
    p.registration_type === 'Maternity' || (p.gender?.toLowerCase() === 'female' && p.age >= 15 && p.age <= 50)
  );

  const fetchData = async () => {
    setLoading(true);
    const [patientsData, deliveriesData, newbornsData, staffData] = await Promise.all([
      supabaseService.getPatients(),
      supabaseService.getDeliveries(),
      supabaseService.getNewborns(),
      supabaseService.getStaff()
    ]);
    if (patientsData) setPatients(patientsData);
    if (deliveriesData) setDeliveries(deliveriesData);
    if (newbornsData) setNewborns(newbornsData);
    if (staffData) setStaff(staffData.filter((s: any) => s.role === 'DOCTOR' || s.role === 'SURGEON'));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddDelivery = async () => {
    if (!newDelivery.motherId || !newDelivery.date) {
      toast.error('Please fill in required fields');
      return;
    }

    const deliveryRecord = {
      patient_id: newDelivery.motherId,
      delivery_date: newDelivery.date,
      delivery_time: newDelivery.time,
      delivery_type: newDelivery.type,
      surgeon_id: newDelivery.surgeon_id || null,
      notes: `Baby weight: ${newDelivery.weight}kg, Gender: ${newDelivery.gender}`
    };

    const result = await supabaseService.createDelivery(deliveryRecord);
    if (result) {
      // Also update mother's status
      await supabaseService.updatePatient(newDelivery.motherId, { status: 'Post-Delivery' });
      toast.success('Delivery record saved successfully');
      setNewDelivery({ motherId: '', date: '', time: '', gender: 'male', weight: 3.0, type: 'normal', surgeon_id: '' });
      fetchData();
    } else {
      toast.error('Failed to save delivery record');
    }
  };

  const handleExportMaternity = () => {
    const headers = ['Mother Name', 'MRN', 'Status'];
    const rows = mothersList.map((m: any) => [m.name, m.mrn, m.status || 'Prenatal']);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'maternity_records.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Maternity records exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
        <span className="ml-2 font-medium">Loading Maternity Records...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maternity Module</h1>
          <p className="text-muted-foreground">Specialized care for mothers and newborns.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportMaternity}>
            <Download className="w-4 h-4" />
            Export Records
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-pink-500 hover:bg-pink-600 gap-2">
                <Plus className="w-4 h-4" />
                New Delivery Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Delivery Record</DialogTitle>
                <DialogDescription>Record a new birth or delivery details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Mother Name</Label>
                  <Select 
                    value={newDelivery.motherId}
                    onValueChange={(v) => setNewDelivery({...newDelivery, motherId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mother" />
                    </SelectTrigger>
                    <SelectContent>
                      {mothersList.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.mrn})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Delivery</Label>
                    <Input 
                      type="date" 
                      value={newDelivery.date}
                      onChange={(e) => setNewDelivery({...newDelivery, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input 
                      type="time" 
                      value={newDelivery.time}
                      onChange={(e) => setNewDelivery({...newDelivery, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Baby Gender</Label>
                    <Select 
                      value={newDelivery.gender}
                      onValueChange={(v) => setNewDelivery({...newDelivery, gender: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="3.0" 
                      value={newDelivery.weight}
                      onChange={(e) => setNewDelivery({...newDelivery, weight: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Delivery Type</Label>
                    <Select 
                      value={newDelivery.type}
                      onValueChange={(v) => setNewDelivery({...newDelivery, type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal Delivery</SelectItem>
                        <SelectItem value="cesarean">C-Section (LSCS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Surgeon / Doctor</Label>
                    <Select 
                      value={newDelivery.surgeon_id}
                      onValueChange={(v) => setNewDelivery({...newDelivery, surgeon_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button className="bg-pink-500 hover:bg-pink-600 text-white" onClick={handleAddDelivery}>Save Record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-pink-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-pink-600 font-bold uppercase tracking-wider mb-1">Active Mother Cases</p>
              <h3 className="text-3xl font-bold text-pink-700">{mothersList.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-pink-100 text-pink-600">
              <Heart className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Newborns (Total)</p>
              <h3 className="text-3xl font-bold text-blue-700">{newborns.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Baby className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Total Deliveries</p>
              <h3 className="text-3xl font-bold text-purple-700">{deliveries.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-pink-500" />
              Recent Delivery Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="whitespace-nowrap">Mother</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.length > 0 ? deliveries.map((d) => (
                    <TableRow key={d.id} className="border-slate-50">
                      <TableCell className="font-medium whitespace-nowrap">{d.patients?.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{d.delivery_date}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className="border-none bg-pink-50 text-pink-600">
                          {d.delivery_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-medical-blue">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No delivery records found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Newborns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newborns.length > 0 ? newborns.slice(0, 5).map((baby, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Baby className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Baby of {baby.patients?.name}</p>
                      <p className="text-xs text-muted-foreground">Weight: {baby.birth_weight}kg • {new Date(baby.birth_date_time).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    {baby.gender}
                  </Badge>
                </div>
              )) : (
                <p className="text-center py-6 text-muted-foreground text-sm">No newborn records found</p>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs text-medical-blue">View All Baby Records</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
