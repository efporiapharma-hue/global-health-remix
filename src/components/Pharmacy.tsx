import { useState, useEffect, useMemo } from 'react';
import { 
  Pill, 
  Search, 
  Plus, 
  AlertTriangle, 
  Package, 
  History, 
  ArrowRight,
  ShoppingCart,
  Calendar,
  CreditCard,
  Download,
  Printer,
  Trash2,
  Edit,
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
import { Separator } from '@/components/ui/separator';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { supabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Pharmacy() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const templateImage = storage.get(STORAGE_KEYS.TEMPLATE_IMAGE, null);

  const currentUser = storage.get(STORAGE_KEYS.SESSION_USER, null);
  const isAccountant = currentUser?.role === 'ACCOUNTANT';

  const fetchData = async () => {
    setLoading(true);
    const [invData, invoicesData, patientsData] = await Promise.all([
      supabaseService.getPharmacyItems(),
      supabaseService.getInvoices(),
      supabaseService.getPatients()
    ]);

    if (invData) setInventory(invData);
    if (invoicesData) setBills(invoicesData.filter(inv => inv.type === 'Pharmacy' || inv.invoice_items?.some((item: any) => item.category === 'PHARMACY')));
    if (patientsData) setPatients(patientsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    category: 'Medicine', 
    stock: 0, 
    unit: 'Tablets', 
    minStockLevel: 10,
    mrp: 0,
    sellingPrice: 0,
    purchasePrice: 0,
    taxPercentage: 12,
    hsnCode: '',
    rackNumber: '',
    batchNumber: '',
  });
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleAddItem = async () => {
    if (!newItem.name) {
      toast.error('Please enter item name');
      return;
    }
    const itemToAdd = {
      name: newItem.name,
      category: newItem.category,
      unit: newItem.unit,
      hsn_code: newItem.hsnCode,
      rack_number: newItem.rackNumber,
      batch_number: newItem.batchNumber,
      expiry_date: newItem.expiryDate || '2025-12-31',
      stock: Number(newItem.stock),
      mrp: Number(newItem.mrp),
      selling_price: Number(newItem.sellingPrice),
      purchase_price: Number(newItem.purchasePrice),
      tax_percentage: Number(newItem.taxPercentage),
      min_stock_level: Number(newItem.minStockLevel)
    };
    
    const result = await supabaseService.createPharmacyItem(itemToAdd);
    if (result) {
      toast.success('New item added to inventory');
      fetchData();
      setNewItem({ 
        name: '', 
        category: 'Medicine', 
        stock: 0, 
        unit: 'Tablets', 
        minStockLevel: 10,
        mrp: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        taxPercentage: 12,
        hsnCode: '',
        rackNumber: '',
        batchNumber: '',
      });
    } else {
      toast.error('Failed to add item');
    }
  };

  const handleDeleteItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
    toast.success('Item removed from inventory');
  };

  const printPharmacyInvoice = (bill: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print invoice');
      return;
    }

    const patient = patients.find(p => p.id === bill.patientId);

    const invoiceHtml = `
      <html>
        <head>
          <title>Pharmacy Invoice - ${bill.id}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: sans-serif; 
              margin: 0; 
              padding: 0;
            }
            .template-bg {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              z-index: -1;
            }
            .content { 
              position: relative;
              padding-top: ${templateImage ? '180px' : '40px'}; 
              padding-left: 60px; 
              padding-right: 60px; 
              padding-bottom: 40px; 
            }
            .title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .invoice-table th { text-align: left; padding: 10px; border-bottom: 2px solid #eee; background: #fcfcfc; font-size: 12px; }
            .invoice-table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
            .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 30px; color: #0d9488; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
            .hospital-info { display: ${templateImage ? 'none' : 'block'}; margin-bottom: 30px; text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          ${templateImage ? `<div class="template-bg"><img src="${templateImage}" style="width: 100%;" /></div>` : ''}
          <div class="content">
            <div class="hospital-info">
              <div style="font-size: 24px; font-weight: bold; color: #0d9488;">DC GLOBAL PHARMACY</div>
              <div>Hospital Internal Pharmacy | Tel: +91 98765 43210</div>
            </div>
            <div class="title">Pharmacy Cash Memo</div>
            <div class="header-info">
              <div>
                <strong>Customer:</strong> ${bill.patientName || patient?.name || 'Walk-in'}<br/>
                <strong>Invoice ID:</strong> ${bill.id.toUpperCase()}
              </div>
              <div style="text-align: right;">
                <strong>Date:</strong> ${formatDate(bill.date)}<br/>
                <strong>Dr:</strong> ${bill.prescribingDoctor || 'General'}
              </div>
            </div>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Medicine Description</th>
                  <th>Qty</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items ? bill.items.map((item: any, i: number) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>
                      ${item.name}
                      ${item.taxPercentage ? `<div style="font-size: 10px; color: #666;">GST ${item.taxPercentage}% included</div>` : ''}
                    </td>
                    <td>${item.quantity} ${item.unit || ''}</td>
                    <td style="text-align: right;">${formatCurrency(item.price)}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td>1</td>
                    <td>Pharmacy Sales (Consolidated)</td>
                    <td>1 Unit</td>
                    <td style="text-align: right;">${formatCurrency(bill.totalAmount)}</td>
                  </tr>
                `}
              </tbody>
            </table>
            <div style="margin-top: 20px; border-top: 2px solid #eee; padding-top: 10px;">
              ${bill.subtotalAmount ? `<div style="text-align: right; font-size: 14px;">Subtotal: ${formatCurrency(bill.subtotalAmount)}</div>` : ''}
              ${bill.taxAmount ? `<div style="text-align: right; font-size: 14px;">Total Tax: ${formatCurrency(bill.taxAmount)}</div>` : ''}
              <div class="total">Total Payable: ${formatCurrency(bill.totalAmount)}</div>
            </div>
            <div class="footer">
              <p>Medicines once sold will not be taken back without original bill.</p>
              <p>Keep out of reach of children. Thank you!</p>
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
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  const handleExportInventory = () => {
    const headers = ['Name', 'Category', 'Stock', 'Unit', 'Min Level', 'Expiry Date'];
    const rows = inventory.map((item: any) => [
      item.name,
      item.category,
      item.stock,
      item.unit,
      item.minStockLevel,
      item.expiryDate || 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'pharmacy_inventory.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Inventory exported as CSV');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
        <span className="ml-2 font-medium">Loading Pharmacy...</span>
      </div>
    );
  }

  const lowStockCount = inventory.filter(i => i.stock < i.min_stock_level).length;
  const expiringSoonCount = inventory.filter(i => {
    if (!i.expiry_date) return false;
    const expiry = new Date(i.expiry_date);
    const today = new Date();
    const monthsDiff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsDiff < 3;
  }).length;
  const totalInvValue = inventory.reduce((acc, i) => acc + (i.stock * i.purchase_price), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pharmacy Management</h1>
          <p className="text-muted-foreground">Inventory tracking, medicine sales, and stock alerts.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pharmacy/pos">
            <Button className="bg-teal-accent hover:bg-teal-600 gap-2">
              <ShoppingCart className="w-4 h-4" />
              Open POS Terminal
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={handleExportInventory}>
            <Download className="w-4 h-4" />
            Export Inventory
          </Button>
          <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
            {!isAccountant && (
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <History className="w-4 h-4" />
                  Purchase Stock
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Purchase New Stock</DialogTitle>
                <DialogDescription>Record a new purchase from a supplier.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="space-y-2">
                  <Label>Medicine / Item</Label>
                  <Select 
                    onValueChange={(val) => {
                      const item = inventory.find(i => i.id === val);
                      if (item) {
                        setEditingItem(item);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {editingItem && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity to Add</Label>
                        <Input 
                          type="number" 
                          id="purchase-qty"
                          placeholder="0" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>New Purchase Price (₹)</Label>
                        <Input 
                          type="number" 
                          id="purchase-price"
                          defaultValue={editingItem.purchasePrice}
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>New MRP (₹)</Label>
                        <Input 
                          type="number" 
                          id="purchase-mrp"
                          defaultValue={editingItem.mrp}
                          placeholder="0.00" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>New Selling Price (₹)</Label>
                        <Input 
                          type="number" 
                          id="purchase-sp"
                          defaultValue={editingItem.sellingPrice}
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Batch Number</Label>
                      <Input id="purchase-batch" placeholder="Enter batch number" defaultValue={editingItem.batchNumber} />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input type="date" id="purchase-expiry" defaultValue={editingItem.expiryDate} />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Supplier Name</Label>
                  <Input placeholder="Enter supplier name" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsPurchaseOpen(false);
                  setEditingItem(null);
                }}>Cancel</Button>
                <Button className="bg-medical-blue" onClick={() => {
                  if (!editingItem) {
                    toast.error('Please select an item');
                    return;
                  }
                  
                  const qtyToAdd = Number((document.getElementById('purchase-qty') as HTMLInputElement)?.value || 0);
                  const newPP = Number((document.getElementById('purchase-price') as HTMLInputElement)?.value || editingItem.purchasePrice);
                  const newMRP = Number((document.getElementById('purchase-mrp') as HTMLInputElement)?.value || editingItem.mrp);
                  const newSP = Number((document.getElementById('purchase-sp') as HTMLInputElement)?.value || editingItem.sellingPrice);
                  const newBatch = (document.getElementById('purchase-batch') as HTMLInputElement)?.value || editingItem.batchNumber;
                  const newExpiry = (document.getElementById('purchase-expiry') as HTMLInputElement)?.value || editingItem.expiryDate;

                  const updatedInventory = inventory.map(item => {
                    if (item.id === editingItem.id) {
                      return {
                        ...item,
                        stock: item.stock + qtyToAdd,
                        purchasePrice: newPP,
                        mrp: newMRP,
                        sellingPrice: newSP,
                        batchNumber: newBatch,
                        expiryDate: newExpiry
                      };
                    }
                    return item;
                  });
                  
                  setInventory(updatedInventory);
                  toast.success('Stock purchase recorded and inventory updated');
                  setIsPurchaseOpen(false);
                  setEditingItem(null);
                }}>Record Purchase</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
            {!isAccountant && (
              <DialogTrigger asChild>
                <Button className="bg-medical-blue gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Stock
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Medicine/Item</DialogTitle>
                <DialogDescription>Add a new item to the pharmacy inventory.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Item Name</Label>
                    <Input 
                      placeholder="e.g. Ibuprofen 400mg" 
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={newItem.category}
                      onValueChange={(v) => setNewItem({...newItem, category: v as any})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Medicine">Medicine</SelectItem>
                        <SelectItem value="Surgical">Surgical</SelectItem>
                        <SelectItem value="Consumable">Consumable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input 
                      placeholder="e.g. Tablets, Bottles" 
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Initial Stock</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={newItem.stock}
                      onChange={(e) => setNewItem({...newItem, stock: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Stock Level</Label>
                    <Input 
                      type="number" 
                      placeholder="10" 
                      value={newItem.minStockLevel}
                      onChange={(e) => setNewItem({...newItem, minStockLevel: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rack No.</Label>
                    <Input 
                      placeholder="A-1" 
                      value={newItem.rackNumber}
                      onChange={(e) => setNewItem({...newItem, rackNumber: e.target.value})}
                    />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase Price (₹)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={newItem.purchasePrice}
                      onChange={(e) => setNewItem({...newItem, purchasePrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>MRP (₹)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={newItem.mrp}
                      onChange={(e) => setNewItem({...newItem, mrp: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Selling Price (₹)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={newItem.sellingPrice}
                      onChange={(e) => setNewItem({...newItem, sellingPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Percentage (%)</Label>
                    <Select 
                      value={newItem.taxPercentage.toString()}
                      onValueChange={(v) => setNewItem({...newItem, taxPercentage: Number(v)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Tax" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0% (Exempt)</SelectItem>
                        <SelectItem value="5">5% GST</SelectItem>
                        <SelectItem value="12">12% GST</SelectItem>
                        <SelectItem value="18">18% GST</SelectItem>
                        <SelectItem value="28">28% GST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>HSN Code</Label>
                    <Input 
                      placeholder="HSN" 
                      value={newItem.hsnCode}
                      onChange={(e) => setNewItem({...newItem, hsnCode: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input 
                      placeholder="Batch" 
                      value={newItem.batchNumber}
                      onChange={(e) => setNewItem({...newItem, batchNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input 
                    type="date" 
                    onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value} as any)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button className="bg-medical-blue" onClick={() => {
                  handleAddItem();
                  setIsAddStockOpen(false);
                }}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="billing">Pharmacy Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Inventory Items</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">{inventory.length}</h3>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <Package className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-amber-600">
                  {lowStockCount}
                </h3>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expiring Soon (30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-rose-600">{expiringSoonCount}</h3>
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Medicine Inventory</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search medicine..." 
                    className="pl-10 bg-slate-50 border-none h-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link to="/pharmacy/pos">
                  <Button className="bg-teal-accent hover:bg-teal-600 h-9 gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    New Sale (POS)
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="whitespace-nowrap">Medicine Name</TableHead>
                      <TableHead className="whitespace-nowrap">Category</TableHead>
                      <TableHead className="whitespace-nowrap">MRP / Selling</TableHead>
                      <TableHead className="whitespace-nowrap">Stock</TableHead>
                      <TableHead className="whitespace-nowrap">Expiry Date</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id} className="border-slate-50">
                        <TableCell className="font-medium whitespace-nowrap">
                          <div>
                            <p>{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">Rack: {item.rackNumber || 'N/A'} | Batch: {item.batchNumber || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground line-through">MRP: {formatCurrency(item.mrp || 0)}</span>
                            <span className="font-bold text-medical-blue">SP: {formatCurrency(item.sellingPrice || 0)}</span>
                            <span className="text-[10px] text-emerald-600">Tax: {item.taxPercentage || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold">{item.stock} {item.unit}</span>
                            <span className="text-[10px] text-muted-foreground">Min Level: {item.minStockLevel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.expiryDate ? formatDate(item.expiryDate) : 'N/A'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className={`border-none ${
                            item.stock > item.minStockLevel ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {item.stock > item.minStockLevel ? 'In Stock' : 'Low Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-medical-blue gap-1 h-8">
                                Manage
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage Stock: {item.name}</DialogTitle>
                                <DialogDescription>Update stock levels or edit item details.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Current Stock</Label>
                                    <Input 
                                      type="number" 
                                      defaultValue={item.stock} 
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const updated = inventory.map((i: any) => i.id === item.id ? { ...i, stock: val } : i);
                                        setInventory(updated);
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Min Stock Level</Label>
                                    <Input 
                                      type="number" 
                                      defaultValue={item.minStockLevel}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const updated = inventory.map((i: any) => i.id === item.id ? { ...i, minStockLevel: val } : i);
                                        setInventory(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>MRP (₹)</Label>
                                    <Input 
                                      type="number" 
                                      defaultValue={item.mrp}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const updated = inventory.map((i: any) => i.id === item.id ? { ...i, mrp: val } : i);
                                        setInventory(updated);
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Selling Price (₹)</Label>
                                    <Input 
                                      type="number" 
                                      defaultValue={item.sellingPrice}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const updated = inventory.map((i: any) => i.id === item.id ? { ...i, sellingPrice: val } : i);
                                        setInventory(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Batch Number</Label>
                                    <Input 
                                      defaultValue={item.batchNumber}
                                      onChange={(e) => {
                                        const updated = inventory.map((i: any) => i.id === item.id ? { ...i, batchNumber: e.target.value } : i);
                                        setInventory(updated);
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Tax (%)</Label>
                                    <Input 
                                      type="number"
                                      defaultValue={item.taxPercentage}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const updated = inventory.map((i: any) => i.id === item.id ? { ...i, taxPercentage: val } : i);
                                        setInventory(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Expiry Date</Label>
                                  <Input 
                                    type="date" 
                                    defaultValue={item.expiryDate} 
                                    onChange={(e) => {
                                      const updated = inventory.map((i: any) => i.id === item.id ? { ...i, expiryDate: e.target.value } : i);
                                      setInventory(updated);
                                    }}
                                  />
                                </div>
                              </div>
                              <DialogFooter className="flex justify-between sm:justify-between">
                                {!isAccountant && (
                                  <Button 
                                    variant="ghost" 
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={() => {
                                      handleDeleteItem(item.id);
                                      setEditingItem(null);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Item
                                  </Button>
                                )}
                                <div className="flex gap-2">
                                  <DialogTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                {!isAccountant && (
                                  <Button className="bg-medical-blue" onClick={() => {
                                    toast.success('Stock updated successfully');
                                    setEditingItem(null);
                                  }}>Update Stock</Button>
                                )}
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Pharmacy Billing History</CardTitle>
                <CardDescription>View and manage pharmacy-specific invoices.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search invoice or MRN..." className="pl-10 bg-slate-50 border-none h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="whitespace-nowrap">Invoice ID</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => {
                      const patient = patients.find(p => p.id === bill.patientId);
                      return (
                        <TableRow key={bill.id} className="border-slate-50">
                          <TableCell className="font-medium text-medical-blue whitespace-nowrap">#{bill.id.toUpperCase()}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div>
                              <p className="font-medium text-sm">
                                {bill.patientName || patient?.name || 'Walk-in Customer'}
                              </p>
                              {bill.patientPhone && <p className="text-[10px] text-muted-foreground">Ph: {bill.patientPhone}</p>}
                              {bill.prescribingDoctor && <p className="text-[10px] text-medical-blue italic">Dr: {bill.prescribingDoctor}</p>}
                              {!bill.patientPhone && patient?.mrn && <p className="text-xs text-muted-foreground">{patient.mrn}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(bill.date)}</TableCell>
                          <TableCell className="font-bold whitespace-nowrap">{formatCurrency(bill.totalAmount)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printPharmacyInvoice(bill)}>
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success('Downloading invoice...')}>
                                <Download className="w-4 h-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
