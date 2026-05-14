import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus,
  ArrowUpRight,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  Loader2,
  User
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { MOCK_USERS, MOCK_BILLING } from '@/mockData';
import { supabaseService } from '@/services/supabaseService';

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
import { toast } from 'sonner';

export default function Billing() {
  const [bills, setBills] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateImage, setTemplateImage] = useState<string | null>(() => storage.get(STORAGE_KEYS.TEMPLATE_IMAGE, null));
  const [hospitalInfo, setHospitalInfo] = useState(() => storage.get(STORAGE_KEYS.HOSPITAL_INFO, {
    name: 'GLOBAL HOSPITAL',
    address: '123 Healthcare Way, Medical City',
    phone: '+91 98765 43210',
    email: 'accounts@dcglobal.com',
    logo: null as string | null
  }));

  const fetchData = async () => {
    setLoading(true);
    const [invoicesData, patientsData] = await Promise.all([
      supabaseService.getInvoices(),
      supabaseService.getPatients()
    ]);

    if (invoicesData) setBills(invoicesData);
    if (patientsData) setPatients(patientsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load latest rates from storage
  const [otRates] = useState(() => storage.get(STORAGE_KEYS.OT_RATES, []));
  const [bedRates] = useState(() => storage.get(STORAGE_KEYS.BED_RATES, []));
  const [labRates] = useState(() => storage.get(STORAGE_KEYS.LAB_RATES, []));
  const [materialRates] = useState(() => storage.get(STORAGE_KEYS.MATERIAL_RATES, []));

  const currentUser = storage.get(STORAGE_KEYS.SESSION_USER, null);

  const logAudit = (action: string, entityId: string, details: any) => {
    const logs = storage.get(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Unknown User',
      userRole: currentUser?.role || 'N/A',
      action,
      entityType: 'Billing',
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    storage.set(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  
  // Multi-item invoice state
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    patientId: '',
    paymentMode: 'Cash',
    discount: 0
  });
  
  const [currentItem, setCurrentItem] = useState({
    category: '',
    description: '',
    amount: '',
    subType: ''
  });

  const handleAddItem = () => {
    if (!currentItem.description || !currentItem.amount) {
      toast.error('Please select a service and ensure amount is valid');
      return;
    }
    setInvoiceItems([...invoiceItems, { 
      description: currentItem.description, 
      amount: parseInt(currentItem.amount), 
      category: currentItem.category 
    }]);
    setCurrentItem({ category: '', description: '', amount: '', subType: '' });
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const totalInvoiceAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const finalAmount = Math.max(0, totalInvoiceAmount - (newInvoice.discount || 0));
  const finalEditAmount = Math.max(0, totalInvoiceAmount - (editingBill?.discount || 0));

  const handleCreateInvoice = async () => {
    if (!newInvoice.patientId || invoiceItems.length === 0) {
      toast.error('Please select a patient and add at least one item');
      return;
    }
    const billToAdd = {
      patient_id: newInvoice.patientId,
      total_amount: totalInvoiceAmount,
      discount_amount: newInvoice.discount || 0,
      paid_amount: finalAmount,
      payment_status: 'Paid',
      payment_method: newInvoice.paymentMode,
      status: 'Settled',
      type: 'Independent'
    };
    
    const itemsToInsert = invoiceItems.map(item => ({
      item_name: item.description,
      quantity: 1,
      unit_price: item.amount,
      total_price: item.amount,
      category: item.category
    }));

    const result = await supabaseService.createInvoice(billToAdd, itemsToInsert);
    if (result) {
      fetchData();
      setInvoiceItems([]);
      setNewInvoice({ patientId: '', paymentMode: 'Cash', discount: 0 });
      setPatientSearchTerm('');
      setShowPatientResults(false);
      setIsInvoiceOpen(false);
      toast.success('Independent invoice generated');
      logAudit('CREATE_INVOICE', result.id, { bill: result });
    } else {
      toast.error('Failed to create invoice');
    }
  };

  const handleCategoryChange = (val: string) => {
    setCurrentItem({ category: val, description: '', amount: '', subType: '' });
  };

  const handleSubTypeChange = (val: string) => {
    let rate = 0;
    let description = '';

    if (currentItem.category === 'ot') {
      const found = otRates.find((r: any) => r.type === val);
      rate = found?.rate || 0;
      description = `${val} Surgery Charges`;
    } else if (currentItem.category === 'ipd') {
      const found = bedRates.find((r: any) => r.type === val);
      rate = found?.rate || 0;
      description = `${val} Bed Charges (1 Day)`;
    } else if (currentItem.category === 'lab' || currentItem.category === 'path' || currentItem.category === 'radio') {
      const found = labRates.find((r: any) => r.name === val);
      rate = found?.price || 0;
      description = val;
    } else if (currentItem.category === 'materials') {
      const found = materialRates.find((r: any) => r.name === val);
      rate = found?.price || 0;
      description = val;
    } else if (currentItem.category === 'opd') {
      rate = 500;
      description = 'OPD Consultation Fee';
    } else if (currentItem.category === 'custom') {
      rate = 0;
      description = '';
    }

    setCurrentItem({ 
      ...currentItem, 
      subType: val, 
      amount: rate.toString(), 
      description: description 
    });
  };

  const filteredBills = bills.filter(bill => {
    const searchMatch = 
      bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.patients?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bill.patients?.mrn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bill.patients?.phone.includes(searchQuery));
    
    const categoryMatch = filterCategory === 'all' || bill.invoice_items.some((item: any) => item.category.toLowerCase() === filterCategory.toLowerCase());
    
    return searchMatch && categoryMatch;
  });

  const groupedBillsByDate = bills.reduce((acc: Record<string, any[]>, bill) => {
    const dateKey = bill.date || new Date(bill.created_at).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(bill);
    return acc;
  }, {});

  const handleDeleteBill = async (id: string) => {
    const billToDelete = bills.find(b => b.id === id);
    const success = await supabaseService.deleteInvoice(id);
    if (success) {
      logAudit('DELETE', id, { bill: billToDelete });
      setBills(bills.filter(b => b.id !== id));
      toast.success('Invoice cancelled');
    } else {
      toast.error('Failed to cancel invoice');
    }
  };

  const handleExportBilling = () => {
    const headers = ['Invoice ID', 'Patient MRN', 'Date', 'Amount', 'Status', 'Mode'];
    const rows = bills.map(b => [
      b.id,
      b.patients?.mrn || 'N/A',
      b.created_at,
      b.total_amount,
      b.status,
      b.payment_method || 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'hospital_billing.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Billing data exported');
  };

  const handleEditBill = (bill: any) => {
    setEditingBill({ ...bill });
    setInvoiceItems([...bill.items]);
    setIsEditOpen(true);
  };

  const handleUpdateInvoice = () => {
    if (invoiceItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    const updatedBills = bills.map(b => {
      if (b.id === editingBill.id) {
        const oldBill = b;
        const newBill = {
          ...b,
          items: invoiceItems,
          totalAmount: totalInvoiceAmount,
          discount: editingBill.discount || 0,
          paidAmount: finalEditAmount, // Assuming full payment for manual updates for now
          paymentMode: editingBill.paymentMode
        };
        logAudit('UPDATE', editingBill.id, { before: oldBill, after: newBill });
        return newBill;
      }
      return b;
    });
    setBills(updatedBills);
    setIsEditOpen(false);
    setEditingBill(null);
    setInvoiceItems([]);
    toast.success('Invoice updated successfully');
  };

  const printInvoice = (bill: any) => {
    const patient = patients.find(p => p.id === bill.patientId);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print invoice');
      return;
    }

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice - ${bill.id}</title>
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
            
            .bill-title { 
              text-align: center; 
              font-size: 24px; 
              font-weight: 800; 
              margin: 30px 0; 
              color: #0f172a; 
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .info-grid { 
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 40px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              background-color: #f8fafc;
            }
            .info-label { color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 10px; margin-bottom: 6px; display: block; letter-spacing: 0.05em; }
            .info-value { font-weight: 800; color: #0f172a; font-size: 15px; }
            
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .invoice-table th { 
              text-align: left; 
              background-color: #f1f5f9;
              padding: 15px; 
              color: #475569; 
              font-size: 11px; 
              text-transform: uppercase; 
              font-weight: 800;
              border-bottom: 2px solid #cbd5e1;
            }
            .invoice-table td { padding: 18px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .service-desc { font-weight: 800; color: #1e293b; font-size: 15px; }
            .service-cat { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-top: 4px; }
            
            .total-card {
              margin-left: auto;
              width: 320px;
              padding: 24px;
              background-color: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              page-break-inside: avoid;
            }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px; }
            .grand-total { 
              border-top: 2px solid #2563eb; 
              margin-top: 20px; 
              padding-top: 20px; 
              font-weight: 800; 
              font-size: 22px; 
              color: #2563eb; 
            }
            
            .footer { 
              margin-top: 100px; 
              text-align: center;
              padding-bottom: 40px;
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
              <div style="font-size: 11px; color: #64748b;">${hospitalInfo.address} | Tel: ${hospitalInfo.phone}</div>
            </div>

            <div class="bill-title">Consolidated Bill / Tax Invoice</div>

            <div class="info-grid">
              <div>
                <span class="info-label">Patient Details:</span>
                <div class="info-value" style="font-size: 18px;">${patient?.name || 'Walk-in Patient'}</div>
                <div class="info-value" style="color: #64748b; font-weight: 600;">MRN: ${patient?.mrn || 'N/A'}</div>
                <div class="info-value" style="color: #64748b; font-weight: 600;">Phone: ${patient?.phone || 'N/A'}</div>
              </div>
              <div style="text-align: right;">
                <span class="info-label">Invoice Details:</span>
                <div class="info-value">Inv No: #${bill.id.toUpperCase()}</div>
                <div class="info-value">Date: ${formatDate(bill.date)}</div>
                <div class="info-value" style="color: #059669; font-weight: 800;">Status: ${bill.status}</div>
              </div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width: 70%;">Service Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items.map((item: any) => `
                  <tr>
                    <td>
                      <div class="service-desc">${item.description}</div>
                      <div class="service-cat">Category: ${item.category}</div>
                    </td>
                    <td style="text-align: right; font-weight: 700;">${formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-card">
              <div class="total-row"><span>Sub-Total:</span> <span>${formatCurrency(bill.totalAmount)}</span></div>
              <div class="total-row"><span>Discount:</span> <span>${formatCurrency(bill.discount || 0)}</span></div>
              <div class="total-row grand-total"><span>Total Amount:</span> <span>${formatCurrency(bill.paidAmount || (bill.totalAmount - (bill.discount || 0)))}</span></div>
            </div>

            <div style="margin-top: 30px; font-size: 13px; color: #475569;">
              <strong>Payment Mode:</strong> ${bill.paymentMode || 'Cash/UPI'}<br/>
              <strong>Notes:</strong> Please retain this invoice for your records.
            </div>

            <div class="sig-section">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-label">Receiver's Signature</div>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signatory</div>
              </div>
            </div>

            <div class="footer">
              <div style="color: #94a3b8; font-size: 11px;">This is an electronically generated document. No physical signature required.</div>
              <div style="font-weight: 700; color: #2563eb; margin-top: 10px;">GLOBAL HOSPITAL GROUP - HEALING HANDS, CARING HEARTS</div>
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

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
        <span className="ml-2">Loading Billing Data...</span>
      </div>
    );
  }

  const totalHospitalRevenue = bills.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);
  const mainOfficeCollection = bills.filter(b => b.type !== 'Pharmacy' && b.type !== 'Lab').reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);
  const pharmacyRevenue = bills.filter(b => b.type === 'Pharmacy' || b.invoice_items?.some((i: any) => i.category === 'PHARMACY')).reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);
  const labRevenue = bills.filter(b => b.type === 'Lab' || b.invoice_items?.some((i: any) => ['LAB', 'PATH', 'RADIO'].includes(i.category.toUpperCase()))).reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centralized Account Office</h1>
          <p className="text-muted-foreground">Main hospital revenue collection for OPD, IPD, and OT. Monitoring Pharmacy & Lab collections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportBilling}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <History className="w-4 h-4" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
              <DialogHeader className="p-6 border-b">
                <DialogTitle>Daily Transaction History</DialogTitle>
                <DialogDescription>Viewing all transactions grouped by date.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                  {Object.entries(groupedBillsByDate).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([dateKey, dayBills]) => {
                    const typedDayBills = dayBills as any[];
                    return (
                    <div key={dateKey} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-medical-blue">{formatDate(dateKey)}</Badge>
                        <Separator className="flex-1" />
                        <span className="text-xs font-bold text-muted-foreground">
                          {typedDayBills.length} Transactions | {formatCurrency(typedDayBills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0))}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {typedDayBills.map((bill) => {
                          const patient = patients.find(p => p.id === bill.patient_id);
                          return (
                            <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="text-xs font-bold text-medical-blue">#{bill.id.split('-')[1]?.substring(0, 6) || bill.id.substring(bill.id.length-6)}</div>
                                <div>
                                  <p className="text-sm font-semibold">{patient?.name}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">{bill.invoice_items?.[0]?.category || 'General'} Charge</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">{formatCurrency(bill.total_amount)}</p>
                                <Badge variant="outline" className="text-[8px] h-4">{bill.payment_method}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                  })}
                </div>
              </ScrollArea>
              <DialogFooter className="p-6 border-t">
                <DialogTrigger asChild>
                  <Button variant="outline">Close</Button>
                </DialogTrigger>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isInvoiceOpen} onOpenChange={(open) => {
            setIsInvoiceOpen(open);
            if (!open) {
              setPatientSearchTerm('');
              setShowPatientResults(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-medical-blue gap-2" onClick={() => setIsInvoiceOpen(true)}>
                <Plus className="w-4 h-4" />
                Create New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Independent Billing & Invoicing</DialogTitle>
                <DialogDescription>Add multiple services and items to create a manual invoice.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2 relative">
                  <Label>Select Patient (Search by Name or Phone)</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Start typing name or phone..." 
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientResults(true);
                        if (e.target.value === '') {
                          setNewInvoice({...newInvoice, patientId: ''});
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
                              setNewInvoice({...newInvoice, patientId: p.id});
                              setPatientSearchTerm(p.name);
                              setShowPatientResults(false);
                            }}
                          >
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.phone} • MRN: {p.mrn}</p>
                            </div>
                            {newInvoice.patientId === p.id && <CheckCircle2 className="w-4 h-4 text-medical-blue" />}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                          No patients found.
                        </div>
                      )}
                    </div>
                  )}
                  
                  {newInvoice.patientId && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex flex-col gap-1 mt-2 animate-in fade-in slide-in-from-top-1 text-[11px]">
                      {(() => {
                        const p = patients.find(pat => pat.id === newInvoice.patientId);
                        const doctor = MOCK_USERS.find(u => u.id === p?.attendingDoctorId);
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-500 uppercase tracking-wider">Patient Details</span>
                              <Badge variant="outline" className="text-[8px] border-blue-200 text-blue-600">{doctor?.department || 'General'}</Badge>
                            </div>
                            <p className="font-bold text-blue-900 text-[13px]">{p?.name}</p>
                            <div className="flex gap-4 text-blue-700 font-medium">
                              <span>Ph: {p?.phone}</span>
                              <span>MRN: {p?.mrn}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <Separator />
                
                <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Add Service / Item</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <Select value={currentItem.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opd">OPD Consultation</SelectItem>
                          <SelectItem value="ipd">IPD / Ward</SelectItem>
                          <SelectItem value="ot">Surgery / OT</SelectItem>
                          <SelectItem value="lab">Pathology / Lab</SelectItem>
                          <SelectItem value="radio">Radiology</SelectItem>
                          <SelectItem value="materials">Materials / Disposables</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="custom">Custom / Manual Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {currentItem.category && (
                      <div className="space-y-1.5 animate-in fade-in zoom-in-95">
                        <Label className="text-xs">Service / Item</Label>
                        <Select value={currentItem.subType} onValueChange={handleSubTypeChange}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentItem.category === 'ot' && otRates.map((r: any) => <SelectItem key={r.type} value={r.type}>{r.type} Surgery</SelectItem>)}
                            {currentItem.category === 'ipd' && bedRates.map((r: any) => <SelectItem key={r.type} value={r.type}>{r.type} Bed</SelectItem>)}
                            {(currentItem.category === 'lab' || currentItem.category === 'path') && labRates.filter((t: any) => t.category === 'Pathology').map((t: any) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                            {currentItem.category === 'radio' && labRates.filter((t: any) => t.category === 'Radiology').map((t: any) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                            {currentItem.category === 'materials' && materialRates.map((t: any) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                            {currentItem.category === 'opd' && <SelectItem value="OPD Consultation">Standard OPD</SelectItem>}
                            {currentItem.category === 'pharmacy' && <SelectItem value="Pharmacy Bill">Manual Pharma Entry</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <Input 
                        className="h-8" 
                        value={currentItem.description} 
                        onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate (₹)</Label>
                      <Input 
                        type="number"
                        className="h-8" 
                        value={currentItem.amount} 
                        onChange={(e) => setCurrentItem({...currentItem, amount: e.target.value})} 
                      />
                    </div>
                  </div>
                  <Button className="w-full h-8 bg-slate-800 text-xs" onClick={handleAddItem}>Add to Invoice</Button>
                </div>

                {invoiceItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Invoice Items</p>
                    <div className="space-y-2">
                      {invoiceItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg text-xs">
                          <div className="flex-1">
                            <span className="font-bold">{item.description}</span>
                            <Badge variant="secondary" className="ml-2 text-[8px] h-3 uppercase">{item.category}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">₹{item.amount}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-rose-500" onClick={() => removeItem(idx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-medical-blue/5 rounded-xl border border-medical-blue/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Subtotal: ₹{totalInvoiceAmount}</span>
                        <span className="text-sm font-bold text-medical-blue uppercase tracking-wider">Final Amount</span>
                      </div>
                      <span className="text-lg font-bold text-medical-blue">₹{finalAmount}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount (₹)</Label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={newInvoice.discount}
                      onChange={(e) => setNewInvoice({...newInvoice, discount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={newInvoice.paymentMode} onValueChange={(v) => setNewInvoice({...newInvoice, paymentMode: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI / QR</SelectItem>
                        <SelectItem value="Card">Credit/Debit Card</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => { 
                    setInvoiceItems([]); 
                    setNewInvoice({ patientId: '', paymentMode: 'Cash' }); 
                    setPatientSearchTerm('');
                    setShowPatientResults(false);
                    setIsInvoiceOpen(false);
                  }}>Discard</Button>
                </DialogTrigger>
                <Button className="bg-medical-blue" onClick={handleCreateInvoice} disabled={invoiceItems.length === 0}>Generate Bill</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Invoice Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Invoice #{editingBill?.id.split('-')[1]?.substring(0, 6)}</DialogTitle>
                <DialogDescription>Modify services and items for this existing invoice.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase">Patient</p>
                  <p className="text-sm font-bold">{patients.find(p => p.id === editingBill?.patientId)?.name}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Add/Modify Service</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <Select value={currentItem.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opd">OPD Consultation</SelectItem>
                          <SelectItem value="ipd">IPD / Ward</SelectItem>
                          <SelectItem value="ot">Surgery / OT</SelectItem>
                          <SelectItem value="lab">Pathology / Lab</SelectItem>
                          <SelectItem value="radio">Radiology</SelectItem>
                          <SelectItem value="materials">Materials / Disposables</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {currentItem.category && (
                      <div className="space-y-1.5 animate-in fade-in zoom-in-95">
                        <Label className="text-xs">Service / Item</Label>
                        <Select value={currentItem.subType} onValueChange={handleSubTypeChange}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentItem.category === 'ot' && otRates.map((r: any) => <SelectItem key={r.type} value={r.type}>{r.type} Surgery</SelectItem>)}
                            {currentItem.category === 'ipd' && bedRates.map((r: any) => <SelectItem key={r.type} value={r.type}>{r.type} Bed</SelectItem>)}
                            {(currentItem.category === 'lab' || currentItem.category === 'path') && labRates.filter((t: any) => t.category === 'Pathology').map((t: any) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                            {currentItem.category === 'radio' && labRates.filter((t: any) => t.category === 'Radiology').map((t: any) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                            {currentItem.category === 'materials' && materialRates.map((t: any) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                            {currentItem.category === 'opd' && <SelectItem value="OPD Consultation">Standard OPD</SelectItem>}
                            {currentItem.category === 'pharmacy' && <SelectItem value="Pharmacy Bill">Manual Pharma Entry</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <Input 
                        className="h-8" 
                        value={currentItem.description} 
                        onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate (₹)</Label>
                      <Input 
                        type="number"
                        className="h-8" 
                        value={currentItem.amount} 
                        onChange={(e) => setCurrentItem({...currentItem, amount: e.target.value})} 
                      />
                    </div>
                  </div>
                  <Button className="w-full h-8 bg-slate-800 text-xs" onClick={handleAddItem}>Add to List</Button>
                </div>

                {invoiceItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Current Items</p>
                    <div className="space-y-2">
                      {invoiceItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg text-xs">
                          <div className="flex-1">
                            <span className="font-bold">{item.description}</span>
                            <Badge variant="secondary" className="ml-2 text-[8px] h-3 uppercase">{item.category}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">₹{item.amount}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-rose-500" onClick={() => removeItem(idx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-medical-blue/5 rounded-xl border border-medical-blue/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Subtotal: ₹{totalInvoiceAmount}</span>
                        <span className="text-sm font-bold text-medical-blue uppercase tracking-wider">Final Amount</span>
                      </div>
                      <span className="text-lg font-bold text-medical-blue">₹{finalEditAmount}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Discount (₹)</Label>
                    <Input 
                      type="number"
                      className="h-8 text-xs" 
                      value={editingBill?.discount} 
                      onChange={(e) => setEditingBill({...editingBill, discount: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                  <div className="space-y-2 text-xs">
                    <Label>Change Payment Mode</Label>
                    <Select value={editingBill?.paymentMode} onValueChange={(v) => setEditingBill({...editingBill, paymentMode: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI / QR</SelectItem>
                        <SelectItem value="Card">Credit/Debit Card</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button className="bg-medical-blue" onClick={handleUpdateInvoice}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-medical-blue/5">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Hospital Revenue</p>
            <h3 className="text-2xl font-bold text-medical-blue">{formatCurrency(totalHospitalRevenue)}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Aggregated from all departments</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Main Office Collection</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(mainOfficeCollection)}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">OPD, IPD, OT Services</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Pharmacy Revenue</p>
            <h3 className="text-2xl font-bold text-teal-600">{formatCurrency(pharmacyRevenue)}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Collected at Pharmacy POS</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Lab & Radiology</p>
            <h3 className="text-2xl font-bold text-purple-600">{formatCurrency(labRevenue)}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Collected at Lab Counter</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search name, MRN, phone..." 
                className="pl-10 bg-slate-50 border-none h-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="opd">OPD</SelectItem>
                <SelectItem value="ipd">IPD</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="ot">OT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <TableHead className="whitespace-nowrap">Invoice ID</TableHead>
                  <TableHead className="whitespace-nowrap">Patient Details</TableHead>
                  <TableHead className="whitespace-nowrap">Department</TableHead>
                  <TableHead className="whitespace-nowrap">Contact Info</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Amount</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => {
                  return (
                    <TableRow key={bill.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-medical-blue whitespace-nowrap">#{bill.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{bill.patients?.name || 'Walk-in'}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{bill.patients?.mrn || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-semibold border-blue-100 bg-blue-50 text-blue-700">
                          {bill.type || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-slate-600 font-medium">{bill.patients?.phone || 'N/A'}</span>
                          <span className="text-slate-400">{bill.patients?.email || 'No email provided'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(bill.created_at)}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{formatCurrency(bill.paid_amount || bill.total_amount)}</span>
                          {(bill.discount_amount || 0) > 0 && <span className="text-[9px] text-rose-500 font-bold">-{formatCurrency(bill.discount_amount)} Disc.</span>}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className={`border-none ${
                          bill.status === 'Settled' || bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                          bill.status === 'Partial' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {bill.status === 'Settled' || bill.status === 'Paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : 
                           bill.status === 'Partial' ? <Clock className="w-3 h-3 mr-1" /> : 
                           <AlertCircle className="w-3 h-3 mr-1" />}
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{bill.payment_method || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-medical-blue" title="Patient 360 Overview" onClick={() => window.location.href = `/patient-overview?id=${bill.patientId}`}>
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printInvoice(bill)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          {currentUser?.role !== 'ACCOUNTANT' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-medical-blue" onClick={() => handleEditBill(bill)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleDeleteBill(bill.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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
    </div>
  );
}
