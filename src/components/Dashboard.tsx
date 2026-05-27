import { 
  Users, 
  Calendar as CalendarIcon, 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Baby,
  FlaskConical,
  Pill,
  CreditCard,
  Filter,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Link } from 'react-router-dom';
import { MOCK_PRESCRIPTIONS, MOCK_PATIENTS, MOCK_USERS, MOCK_BILLING, MOCK_PHARMACY_BILLING, MOCK_APPOINTMENTS } from '@/mockData';
import { FileText, Download, Eye } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { useDataSync } from '@/hooks/useDataSync';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{url: string, name: string} | null>(null);
  const [timeFrame, setTimeFrame] = useState('month');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [patientsData, invoicesData, statsData] = await Promise.all([
      supabaseService.getPatients(),
      supabaseService.getInvoices(),
      supabaseService.getDashboardStats()
    ]);

    if (patientsData) setPatients(patientsData);
    if (invoicesData) setInvoices(invoicesData);
    if (statsData) setDbStats(statsData);
    setIsLoading(false);
  };

  useDataSync(fetchData);

  // Filter Logic
  const filteredBilling = useMemo(() => {
    const now = new Date(); 
    
    return invoices.filter(bill => {
      const billDate = new Date(bill.created_at);
      
      if (timeFrame === 'today') {
        const today = new Date();
        return billDate.getDate() === today.getDate() && 
               billDate.getMonth() === today.getMonth() && 
               billDate.getFullYear() === today.getFullYear();
      }
      
      if (timeFrame === 'month') {
        return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
      }
      
      if (timeFrame === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const billQuarter = Math.floor(billDate.getMonth() / 3);
        return currentQuarter === billQuarter && billDate.getFullYear() === now.getFullYear();
      }
      
      if (timeFrame === 'year') {
        return billDate.getFullYear() === now.getFullYear();
      }

      if (timeFrame === 'custom' && dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return billDate >= start && billDate <= end;
      }
      
      return true; // default/all
    });
  }, [timeFrame, dateRange, invoices]);

  // Derive Stats
  const dashboardStats = useMemo(() => {
    const totalRevenue = filteredBilling.reduce((acc, b) => acc + (Number(b.paid_amount) || 0), 0);
    const appointmentCount = filteredBilling.filter(b => b.invoice_items?.some((i: any) => i.category === 'OPD')).length;
    const ipdCount = filteredBilling.filter(b => b.invoice_items?.some((i: any) => i.category === 'IPD' || i.category === 'OT')).length;
    
    const totalPatients = patients.length;

    return [
      { name: 'Total Patients', value: totalPatients.toLocaleString(), icon: Users, change: '+0', trend: 'up', color: 'bg-blue-500' },
      { name: 'OPD Transactions', value: appointmentCount.toString(), icon: Activity, change: '0%', trend: 'up', color: 'bg-teal-500' },
      { name: 'IPD/OT Records', value: ipdCount.toString(), icon: CalendarIcon, change: '0%', trend: 'up', color: 'bg-indigo-500' },
      { name: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, change: '0%', trend: 'up', color: 'bg-emerald-500' },
    ];
  }, [filteredBilling, patients]);

  // Derive Revenue breakdown for chart
  const revenueBreakdown = useMemo(() => {
    const categories: Record<string, { value: number, color: string }> = {
      'Main Billing': { value: 0, color: '#1E6FA8' },
      'Pharmacy': { value: 0, color: '#2EC4B6' },
      'Lab & Rad': { value: 0, color: '#9333ea' },
      'OPD/Consultancy': { value: 0, color: '#f59e0b' }
    };

    filteredBilling.forEach(bill => {
      bill.invoice_items?.forEach((item: any) => {
        if (item.category === 'Pharmacy') categories['Pharmacy'].value += Number(item.total_price) || 0;
        else if (item.category === 'Pathology' || item.category === 'Radiology') categories['Lab & Rad'].value += Number(item.total_price) || 0;
        else if (item.category === 'OPD') categories['OPD/Consultancy'].value += Number(item.total_price) || 0;
        else categories['Main Billing'].value += Number(item.total_price) || 0;
      });
    });

    return Object.entries(categories).map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color
    })).filter(d => d.value > 0);
  }, [filteredBilling]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-medical-blue">Global Hospital Analytics</h1>
          <p className="text-muted-foreground text-sm font-medium">Reporting & Transactional Insights</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <Tabs value={timeFrame} onValueChange={setTimeFrame} className="w-auto">
            <TabsList className="grid grid-cols-4 h-9">
              <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Monthly</TabsTrigger>
              <TabsTrigger value="quarter" className="text-xs">Quarterly</TabsTrigger>
              <TabsTrigger value="year" className="text-xs">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3" />
                <SelectValue placeholder="Other Filters" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>

          {timeFrame === 'custom' && (
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                className="h-9 w-32 text-xs" 
                value={dateRange.start} 
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-slate-400 text-xs">-</span>
              <Input 
                type="date" 
                className="h-9 w-32 text-xs" 
                value={dateRange.end} 
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.name} className="overflow-hidden border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color.split('-')[1]}-600`} />
                </div>
                <Badge variant="secondary" className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-medical-blue" />
                Revenue Performance
              </CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-tight">
                {timeFrame === 'today' ? 'Today' : 
                 timeFrame === 'month' ? 'Current Month' :
                 timeFrame === 'quarter' ? 'Current Quarter' :
                 timeFrame === 'year' ? 'Current Year' : 'Overall'} Summary
              </CardDescription>
            </div>
            <div className="flex gap-4">
              {revenueBreakdown.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.name}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {revenueBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={120} />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <BarChart3 className="w-12 h-12 opacity-20" />
                <p className="text-sm italic">No data records found for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm h-full overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-medical-blue" />
              <CardTitle className="text-lg">Recent Audit Logs</CardTitle>
            </div>
            <CardDescription className="text-xs">Latest transactions within selected timeframe.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {filteredBilling.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="text-slate-300 flex justify-center"><Filter size={32} /></div>
                  <p className="text-slate-400 italic text-sm">No recent transactions</p>
                </div>
              ) : (
                filteredBilling.slice(0, 5).map((bill, i) => (
                  <div key={bill.id} className="flex gap-4">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-medical-blue`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      {i !== Math.min(filteredBilling.length, 5) - 1 && <div className="absolute top-8 left-4 w-[1px] h-6 bg-slate-100"></div>}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Payment {bill.payment_method || 'N/A'}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Invoice #{bill.invoice_number} • {formatCurrency(bill.paid_amount)}</p>
                      <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                        <CalendarIcon className="w-2.5 h-2.5" />
                        {new Date(bill.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-50">
          <CardTitle className="text-lg">Departmental Activity Report</CardTitle>
          <CardDescription className="text-xs">Operational summary based on current filters.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 divide-x divide-slate-50">
            {[
              { dept: 'OPD', count: filteredBilling.filter(b => b.invoice_items?.some((i: any) => i.category === 'OPD')).length, label: 'OPD Visits', color: 'bg-blue-500' },
              { dept: 'IPD', count: filteredBilling.filter(b => b.invoice_items?.some((i: any) => i.category === 'IPD')).length, label: 'IPD Days', color: 'bg-indigo-500' },
              { dept: 'Pharmacy', count: filteredBilling.filter(b => b.invoice_items?.some((i: any) => i.category === 'Pharmacy')).length, label: 'RX Sold', color: 'bg-teal-500' },
              { dept: 'Lab/Rad', count: filteredBilling.filter(b => b.invoice_items?.some((i: any) => i.category === 'Pathology' || i.category === 'Radiology')).length, label: 'Test Reports', color: 'bg-purple-500' },
              { dept: 'OT', count: filteredBilling.filter(b => b.invoice_items?.some((i: any) => i.category === 'OT')).length, label: 'OT Records', color: 'bg-rose-500' },
            ].map((d) => (
              <div key={d.dept} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${d.color}`}></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{d.dept}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{d.count}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">{d.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/billing">
          <Button className="w-full h-24 flex flex-col gap-1 items-center justify-center bg-medical-blue hover:bg-blue-700 shadow-lg rounded-2xl group">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold">Financial Reporting Centre</span>
            </div>
            <span className="text-[10px] opacity-80 uppercase font-medium tracking-widest">View Tax & Revenue Audits</span>
          </Button>
        </Link>
        <Link to="/patient-overview">
          <Button variant="outline" className="w-full h-24 flex flex-col gap-1 items-center justify-center border-medical-blue text-medical-blue hover:bg-blue-50 shadow-sm rounded-2xl group">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold">Clinical 360 Reports</span>
            </div>
            <span className="text-[10px] opacity-80 uppercase font-medium tracking-widest">Access Complete Medical History</span>
          </Button>
        </Link>
      </div>

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
