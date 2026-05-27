import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  User, 
  CreditCard, 
  ArrowLeft,
  Printer,
  CheckCircle2,
  X,
  Loader2,
  Package,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { supabaseService } from '@/services/supabaseService';
import { useDataSync } from '@/hooks/useDataSync';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

function PharmacyQuickRegisterForm({ logAudit, onRegister }: { logAudit: (action: string, id: string, details: any) => void, onRegister: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'male'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    const mrn = `MRN${Math.floor(Math.random() * 90000) + 10000}`;
    
    const patientToAdd = {
      name: formData.name,
      phone: formData.phone,
      age: Number(formData.age) || 0,
      gender: formData.gender,
      mrn,
      status: 'Active',
      registration_type: 'Quick-Pharmacy'
    };

    const result = await supabaseService.createPatient(patientToAdd);
    if (result) {
      logAudit('PATIENT_QUICK_REGISTER', result.id, { name: result.name, mrn });
      toast.success(`Customer registered successfully! MRN: ${mrn}`);
      setFormData({ name: '', phone: '', age: '', gender: 'male' });
      onRegister();
    } else {
      toast.error('Failed to register customer');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Customer Name *</Label>
        <Input 
          placeholder="Enter name" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label>Phone Number *</Label>
        <Input 
          placeholder="Enter phone" 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-medical-blue w-full" onClick={handleRegister}>Create Record</Button>
      </DialogFooter>
    </div>
  );
}

export default function PharmacyPOS() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('walk-in');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [walkInDetails, setWalkInDetails] = useState({ name: '', phone: '', doctorName: '' });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    items: CartItem[];
    total: number;
    subtotal: number;
    tax: number;
    patient: string;
    phone?: string;
    doctorName?: string;
    date: string;
    invoiceId: string;
  } | null>(null);

  const currentUser = storage.get(STORAGE_KEYS.SESSION_USER, null);

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

  const [inventory, setInventory] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

  const [cartPulse, setCartPulse] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [invData, patientsData, prescriptionsData] = await Promise.all([
      supabaseService.getPharmacyItems(),
      supabaseService.getPatients(),
      supabaseService.getPrescriptions()
    ]);
    if (invData) setInventory(invData);
    if (patientsData) setPatients(patientsData);
    if (prescriptionsData) setPrescriptions(prescriptionsData);
    setLoading(false);
  };

  useDataSync(fetchData);

  const filteredInventory = inventory.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.rack_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.batch_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item: any) => {
    if (item.stock <= 0) {
      toast.error('Out of stock');
      return;
    }
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stock) {
        toast.error(`Only ${item.stock} items in stock`);
        return;
      }
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { 
        id: item.id, 
        name: item.name, 
        price: item.selling_price || 0, 
        quantity: 1,
        taxPercentage: item.tax_percentage || 0
      } as any]);
    }
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 300);
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const itemInInventory = inventory.find((i: any) => i.id === id);
        const maxStock = itemInInventory?.stock || 0;
        
        if (delta > 0 && c.quantity >= maxStock) {
          toast.error(`Only ${maxStock} items in stock`);
          return c;
        }
        
        const newQty = Math.max(1, Math.min(maxStock, c.quantity + delta));
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = cart.reduce((sum, item) => sum + (item.price * item.quantity * ((item as any).taxPercentage || 0) / 100), 0);
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    
    const patientName = selectedPatientId === 'walk-in' 
      ? (walkInDetails.name || 'Walk-in Customer') 
      : patients.find(p => p.id === selectedPatientId)?.name || 'Unknown';
    
    const patientPhone = selectedPatientId === 'walk-in' ? walkInDetails.phone : patients.find(p => p.id === selectedPatientId)?.phone;
    const doctorName = selectedPatientId === 'walk-in' ? walkInDetails.doctorName : 'Hospital Doctor';

    const invoice = {
      patient_id: selectedPatientId === 'walk-in' ? null : selectedPatientId,
      total_amount: total,
      paid_amount: total,
      discount_amount: 0,
      payment_status: 'Paid',
      payment_method: paymentMode,
      status: 'Settled',
      type: 'Pharmacy'
    };

    const invoiceItems = cart.map(item => ({
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      category: 'PHARMACY'
    }));

    const result = await supabaseService.createInvoice(invoice, invoiceItems);
    if (result) {
      // Update each item's stock in Supabase and log transaction
      for (const item of cart) {
        const invItem = inventory.find(i => i.id === item.id);
        if (invItem) {
          const newStock = Math.max(0, invItem.stock - item.quantity);
          await supabaseService.updatePharmacyItem(item.id, { 
            stock: newStock,
            updated_at: new Date().toISOString()
          });

          // Log transaction
          await supabaseService.logInventoryTransaction({
            item_id: item.id,
            transaction_type: 'SALE',
            quantity: -item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            reference_id: `INV-${result.id.slice(0, 8)}`,
            performed_by: currentUser?.id
          });
        }
      }

      setLastOrder({
        items: [...cart],
        total,
        subtotal,
        tax,
        patient: patientName,
        phone: patientPhone,
        doctorName: doctorName,
        date: new Date().toLocaleString(),
        invoiceId: result.id.slice(0, 8).toUpperCase()
      });

      logAudit('PHARMACY_SALE', result.id, { patientName, totalAmount: total, itemsCount: cart.length });
      setIsCheckoutOpen(false);
      setIsSuccessOpen(true);
      setCart([]);
      if (selectedPatientId === 'walk-in') {
        setWalkInDetails({ name: '', phone: '', doctorName: '' });
      }
      setPatientSearchTerm('');
      setSelectedPatientId('walk-in');
      fetchData(); // Refresh inventory and patients
      toast.success('Sale completed successfully');
    } else {
      toast.error('Failed to complete sale');
    }
  };

  const printReceipt = () => {
    if (!lastOrder) return;
    const hospitalInfo = storage.get<{
      name: string;
      address: string;
      phone: string;
      logo?: string | null;
    }>(STORAGE_KEYS.HOSPITAL_INFO, {
      name: 'GLOBAL HOSPITAL',
      address: '123, Medical Square, City Center',
      phone: '+91 98765 43210'
    });

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - ${lastOrder.invoiceId}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 58mm; 
              padding: 5mm; 
              margin: 0;
              font-size: 11px;
              line-height: 1.2;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .header { margin-bottom: 5px; }
            .footer { margin-top: 15px; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #000; font-size: 10px; }
            .total-row { font-weight: bold; }
            img.logo { height: 40px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            ${hospitalInfo.logo ? `<img src="${hospitalInfo.logo}" class="logo" />` : ''}
            <div class="bold" style="font-size: 14px;">${hospitalInfo.name}</div>
            <div style="font-size: 9px;">${hospitalInfo.address}</div>
            <div style="font-size: 9px;">Tel: ${hospitalInfo.phone}</div>
            <div class="bold" style="margin-top: 5px;">PHARMACY RECEIPT</div>
          </div>
          
          <div class="divider"></div>
          
          <div>Inv: ${lastOrder.invoiceId}</div>
          <div>Date: ${lastOrder.date}</div>
          <div>Cust: ${lastOrder.patient}</div>
          ${lastOrder.phone ? `<div>Phone: ${lastOrder.phone}</div>` : ''}
          ${lastOrder.doctorName ? `<div>Dr: ${lastOrder.doctorName}</div>` : ''}
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${lastOrder.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="text-right">
            <div>Subtotal: ₹${lastOrder.subtotal.toFixed(2)}</div>
            <div>Tax: ₹${lastOrder.tax.toFixed(2)}</div>
            <div class="bold" style="font-size: 14px;">TOTAL: ₹${lastOrder.total.toFixed(2)}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer text-center">
            <div>Thank You! Get Well Soon.</div>
            <div>Medicines once sold cannot be returned.</div>
            <div style="margin-top: 5px;">Powered by Global Hospital HMS</div>
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

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
        <span className="ml-2 font-medium">Loading POS...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50">
      {/* Left Side: Inventory Selection */}
      <div className="flex-1 flex flex-col min-w-0 border-r bg-white">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/pharmacy">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Pharmacy POS</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-medical-blue border-medical-blue/20 h-8"
                onClick={() => setIsPrescriptionOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Load Prescription
              </Button>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                Terminal #01 - Active
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search medicine by name or barcode..." 
              className="pl-10 h-11 bg-slate-50 border-none rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredInventory.map((item) => {
                const isLowStock = item.stock <= (item.min_stock_level || 10);
                const isOutOfStock = item.stock <= 0;
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className={`group relative h-full cursor-pointer transition-all border-slate-100 shadow-sm hover:shadow-xl hover:border-medical-blue/20 overflow-hidden ${
                        isOutOfStock ? 'opacity-60 grayscale' : ''
                      }`}
                      onClick={() => !isOutOfStock && addToCart(item)}
                    >
                      <div className="p-4 space-y-3 flex flex-col h-full">
                        <div className="relative h-36 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-medical-blue/5 transition-all duration-500">
                          {isOutOfStock ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px] z-10">
                              <Badge variant="destructive" className="font-black uppercase tracking-widest px-3 py-1 scale-110 shadow-lg">Out of Stock</Badge>
                            </div>
                          ) : isLowStock && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200 font-bold px-2 py-0.5">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Low Stock
                              </Badge>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-10">
                             <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[9px] font-black uppercase tracking-tighter border-slate-100">
                               {item.category || 'General'}
                             </Badge>
                          </div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="transition-transform duration-500"
                          >
                             <Package className={`w-12 h-12 text-slate-200 group-hover:text-medical-blue/40 transition-colors ${!isOutOfStock && 'group-hover:scale-110'}`} />
                          </motion.div>
                        </div>
                        
                        <div className="space-y-1 flex-1">
                          <h3 className="font-black text-slate-800 line-clamp-2 leading-[1.2] min-h-[2.4rem] text-sm group-hover:text-medical-blue transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Rack: {item.rack_number || 'N/A'}</span>
                             <span className="text-[10px] text-slate-300">•</span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Batch: {item.batch_number || 'N/A'}</span>
                          </div>
                        </div>
 
                        <div className="flex items-end justify-between py-2 border-t border-slate-50 mt-auto">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tight">Selling Price</span>
                            <span className="text-xl font-black text-medical-blue leading-none">{formatCurrency(item.selling_price || 0)}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tight">In Store</span>
                            <span className={`text-xs font-black ${isLowStock ? 'text-amber-600 font-black' : 'text-emerald-600 font-black'}`}>
                              {item.stock} {item.unit || 'PCS'}
                            </span>
                          </div>
                        </div>
 
                        <div className="pt-1">
                          <Button 
                            className={`w-full gap-2 rounded-xl h-11 font-black shadow-sm transition-all duration-300 ${
                              isOutOfStock 
                                ? 'bg-slate-100 text-slate-300 pointer-events-none' 
                                : 'bg-medical-blue text-white hover:bg-medical-blue/90 hover:shadow-lg hover:shadow-medical-blue/20'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Side: Cart & Checkout */}
      {/* Enhanced Sidebar: Item Cart - Significantly Wider and More Visible */}
      <motion.div 
        animate={cartPulse ? { scale: [1, 1.05, 1], x: [0, -5, 0] } : {}}
        transition={{ duration: 0.3 }}
        className="w-[480px] flex flex-col bg-white border-l border-slate-200 shadow-2xl relative z-10 transition-all duration-300"
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={cartPulse ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              className="w-12 h-12 rounded-xl bg-medical-blue flex items-center justify-center text-white shadow-lg shadow-medical-blue/20"
            >
              <ShoppingCart className="w-6 h-6" />
            </motion.div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Checkout Cart</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cart.length} Item(s) Selected</p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-bold gap-1.5"
              onClick={() => setCart([])}
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR ALL
            </Button>
          )}
        </div>

        <div className="p-5 border-b bg-white space-y-4">
          <div className="space-y-3 relative">
            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Patient (Name / Phone / MRN)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  placeholder="Walk-in or Search..." 
                  className="h-11 bg-slate-50 border-slate-200 pr-10 rounded-xl"
                  value={patientSearchTerm}
                  onChange={(e) => {
                    setPatientSearchTerm(e.target.value);
                    setShowPatientResults(true);
                    if (e.target.value === '') {
                      setSelectedPatientId('walk-in');
                    }
                  }}
                  onFocus={() => setShowPatientResults(true)}
                />
                <Search className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                
                {showPatientResults && patientSearchTerm.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto custom-scrollbar">
                    <div 
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                      onClick={() => {
                        setSelectedPatientId('walk-in');
                        setPatientSearchTerm('');
                        setShowPatientResults(false);
                      }}
                    >
                      <span className="text-xs font-black text-slate-700">Walk-in Customer</span>
                      {selectedPatientId === 'walk-in' && <CheckCircle2 className="w-4 h-4 text-medical-blue" />}
                    </div>
                    {patients.filter((p: any) => 
                      p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
                      p.phone.includes(patientSearchTerm) ||
                      p.mrn.toLowerCase().includes(patientSearchTerm.toLowerCase())
                    ).map((p: any) => (
                      <div 
                        key={p.id} 
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearchTerm(p.name);
                          setShowPatientResults(false);
                        }}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.phone} • {p.mrn}</p>
                        </div>
                        {selectedPatientId === p.id && <CheckCircle2 className="w-4 h-4 text-medical-blue" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100 rounded-xl">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Quick Pharmacy Registration</DialogTitle>
                    <DialogDescription>Create a quick record for this customer.</DialogDescription>
                  </DialogHeader>
                  <PharmacyQuickRegisterForm logAudit={logAudit} onRegister={() => fetchData()} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {selectedPatientId === 'walk-in' && (
            <div className="space-y-4 pt-4 border-t-2 border-dashed border-slate-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-medical-blue" />
                <span className="text-[11px] font-black uppercase tracking-widest text-medical-blue">Walk-in Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Customer Name</Label>
                  <Input 
                    placeholder="Full name" 
                    className="h-10 text-sm border-slate-100 focus:border-medical-blue/30 rounded-lg bg-slate-50/50"
                    value={walkInDetails.name}
                    onChange={(e) => setWalkInDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Mobile No.</Label>
                  <Input 
                    placeholder="+91 00000 00000" 
                    className="h-10 text-sm border-slate-100 focus:border-medical-blue/30 rounded-lg bg-slate-50/50"
                    value={walkInDetails.phone}
                    onChange={(e) => setWalkInDetails(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Prescribing Doctor</Label>
                <Input 
                  placeholder="Dr. Name / Previous Hospital" 
                  className="h-10 text-sm border-slate-100 focus:border-medical-blue/30 rounded-lg bg-slate-50/50"
                  value={walkInDetails.doctorName}
                  onChange={(e) => setWalkInDetails(prev => ({ ...prev, doctorName: e.target.value }))}
                />
              </div>
            </div>
          )}

          {selectedPatientId !== 'walk-in' && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-in fade-in slide-in-from-top-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-blue-900 text-base truncate leading-none mb-1">
                    {patients.find(p => p.id === selectedPatientId)?.name}
                  </p>
                  <p className="text-[11px] text-blue-700 font-bold uppercase tracking-tight">
                    {patients.find(p => p.id === selectedPatientId)?.mrn} • {patients.find(p => p.id === selectedPatientId)?.phone}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg"
                onClick={() => {
                  setSelectedPatientId('walk-in');
                  setPatientSearchTerm('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 bg-slate-50/50">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Items in Cart</h3>
              <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue rounded-full px-2 py-0">
                {cart.length}
              </Badge>
            </div>
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-base font-bold text-slate-400">Your cart is empty</p>
                <p className="text-xs mt-2 text-slate-300">Select items from the inventory to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.div 
                      key={item.id} 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: 50 }}
                      transition={{ duration: 0.2 }}
                      className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-medical-blue/20 relative overflow-hidden"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 leading-tight mb-2 group-hover:text-medical-blue transition-colors">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Rate</span>
                              <span className="text-xs font-black text-medical-blue">₹{item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total</span>
                              <span className="text-xs text-slate-900 font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg" 
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center bg-slate-50/80 rounded-xl p-1 gap-2 border border-slate-100 group-hover:border-slate-200 transition-colors">
                            <button 
                              className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                            <button 
                              className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-slate-200 bg-white space-y-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span className="uppercase tracking-widest text-[10px]">Subtotal Cost</span>
              <span className="text-slate-700">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span className="uppercase tracking-widest text-[10px]">Estimated Tax (5%)</span>
              <span className="text-slate-700">{formatCurrency(tax)}</span>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Grand Total</span>
              <span className="text-3xl font-black text-medical-blue tracking-tighter leading-none">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button 
            className="w-full h-14 text-xl font-black bg-medical-blue hover:bg-medical-blue/90 shadow-xl shadow-medical-blue/30 rounded-2xl transition-all active:scale-[0.98]"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Checkout & Pay
          </Button>
        </div>
      </motion.div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>Select payment method to complete the sale.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant="outline" className="h-20 flex-col gap-2 border-2 hover:border-medical-blue hover:bg-medical-blue/5">
              <CreditCard className="w-6 h-6" />
              Cash
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-2 hover:border-medical-blue hover:bg-medical-blue/5">
              <CreditCard className="w-6 h-6" />
              Card
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-2 hover:border-medical-blue hover:bg-medical-blue/5">
              <CreditCard className="w-6 h-6" />
              UPI / QR
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-2 hover:border-medical-blue hover:bg-medical-blue/5">
              <User className="w-6 h-6" />
              Credit
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
            <Button className="bg-medical-blue" onClick={completeSale}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">Invoice #{lastOrder?.invoiceId} has been generated.</p>
            </div>
            <div className="w-full flex gap-2 pt-4">
              <Button variant="outline" className="flex-1 gap-2" onClick={printReceipt}>
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>
              <Button className="flex-1 bg-medical-blue" onClick={() => setIsSuccessOpen(false)}>
                New Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load from Prescription</DialogTitle>
            <DialogDescription>Select a recent prescription to auto-populate the cart.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              {prescriptions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl border-slate-100 italic text-slate-400">
                  No active prescriptions found.
                </div>
              ) : (
                prescriptions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p: any) => (
                  <Card key={p.id} className="hover:border-medical-blue/50 cursor-pointer transition-all hover:bg-slate-50/50 group" onClick={() => {
                    const patientId = p.patient_id;
                    setSelectedPatientId(patientId);
                    
                    // Add items to cart
                    const itemsToCart: any[] = [];
                    p.medications?.forEach((med: any) => {
                      // Try to find the item in inventory
                      const invItem = inventory.find(i => 
                        i.name.toLowerCase().includes(med.name.toLowerCase()) || 
                        med.name.toLowerCase().includes(i.name.toLowerCase())
                      );
                      
                      if (invItem && invItem.stock > 0) {
                        itemsToCart.push({
                          id: invItem.id,
                          name: invItem.name,
                          price: invItem.selling_price || 0,
                          quantity: 1, // Default to 1, can be adjusted in cart
                          taxPercentage: invItem.tax_percentage || 0
                        });
                      }
                    });

                    if (itemsToCart.length > 0) {
                      setCart([...cart, ...itemsToCart]);
                      toast.success(`Loaded ${itemsToCart.length} items from prescription`);
                    } else {
                      toast.warning('Found medicines but none are currently in stock');
                    }
                    setIsPrescriptionOpen(false);
                  }}>
                    <CardHeader className="p-4 pb-2">
                       <div className="flex justify-between items-start">
                         <div>
                            <CardTitle className="text-base">{p.patients?.name || 'Walk-in'}</CardTitle>
                            <CardDescription className="text-[10px]">MRN: {p.patients?.mrn} • Dr. {p.doctor_name || 'Medical Team'}</CardDescription>
                         </div>
                         <Badge variant="outline" className="text-[9px] font-black">{formatDate(p.created_at)}</Badge>
                       </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <div className="flex flex-wrap gap-1 mt-2">
                          {p.medications?.map((m: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 border-none px-2 py-0.5">
                              {m.name} {m.dosage && `(${m.dosage})`}
                            </Badge>
                          ))}
                       </div>
                       <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-medical-blue text-[10px] font-bold flex items-center justify-end gap-1">
                          Apply to Cart <ArrowRight className="w-4 h-4" />
                       </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
