import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { storage, STORAGE_KEYS } from '@/lib/storage';

import { MOCK_USERS } from '@/mockData';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // List of credentials for the user to refer to if needed (though typically they know them)
    // We'll just check against our mock users
    const validUsers = [
      { email: 'admin@hospital.com', pass: 'admin123' },
      { email: 'doctor@hospital.com', pass: 'doctor123' },
      { email: 'lab@hospital.com', pass: 'lab123' },
      { email: 'nurse@hospital.com', pass: 'nurse123' },
      { email: 'frontdesk@hospital.com', pass: 'front123' },
      { email: 'accounts@hospital.com', pass: 'accounts123' },
      { email: 'pharmacy@hospital.com', pass: 'pharmacy123' },
      { email: 'frontoffice', pass: 'global123' },
      { email: 'accounts', pass: 'global123' },
      { email: 'pharmacy', pass: 'global123' },
    ];

    const currentUsers = storage.get(STORAGE_KEYS.USERS, MOCK_USERS);
    // Simulate network delay
    setTimeout(() => {
      const userDetails = currentUsers.find(u => u.email.toLowerCase() === username.toLowerCase());
      const hardcodedAuth = validUsers.find(u => u.email.toLowerCase() === username.toLowerCase() && u.pass === password);

      if (userDetails && (userDetails as any).password === password) {
        toast.success(`Login successful! Welcome ${userDetails.name}`);
        onLogin(userDetails);
      } else if (hardcodedAuth && userDetails) {
        toast.success(`Login successful! Welcome ${userDetails.name}`);
        onLogin(userDetails);
      } else if (userDetails && (password === 'hospital123' || password === 'global123')) {
        toast.success(`Login successful! Welcome ${userDetails.name}`);
        onLogin(userDetails);
      } else if (username === 'admin' && password === '12345') {
        const adminUser = currentUsers.find(u => u.role === 'SUPER_ADMIN') || (MOCK_USERS.find(u => u.role === 'SUPER_ADMIN') as any);
        toast.success('Login successful! Welcome Admin');
        onLogin(adminUser);
      } else {
        toast.error('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 scale-105 animate-pulse-slow"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop")',
          animationDuration: '10s'
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-medical-blue/40 to-slate-900/80" />

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-6xl px-4 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Side: Branding */}
        <div className="text-white max-w-xl hidden lg:block">
          <h1 className="text-6xl font-bold tracking-tight mb-4 drop-shadow-lg">
            Global Hospital
          </h1>
          <p className="text-2xl font-light opacity-90 mb-8 border-l-4 border-white pl-6">
            & Maternity Center
          </p>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 inline-block">
            <p className="text-sm font-medium tracking-widest uppercase opacity-70 mb-2">Emergency Services</p>
            <p className="text-3xl font-bold">24/7 Care Available</p>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 lg:p-12">
              {/* Logo & Header */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-12 h-12 bg-medical-blue rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-medical-blue/30">
                    G
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-slate-800 leading-none">Global Hospital</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Maternity Center</p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Welcome to <span className="text-medical-blue">Hospital</span></h3>
                <p className="text-lg font-semibold text-slate-700">Management System</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-blue transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-medical-blue/20 transition-all text-base"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-blue transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-medical-blue/20 transition-all text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" className="rounded-md border-slate-300 data-[state=checked]:bg-medical-blue data-[state=checked]:border-medical-blue" />
                    <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">
                      Remember Me
                    </label>
                  </div>
                  <button type="button" className="text-sm font-semibold text-medical-blue hover:underline">
                    Forgot Password?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-medical-blue hover:bg-medical-blue/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-medical-blue/20 transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </div>
                  ) : "Login"}
                </Button>

                <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Login (Demo Credentials)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { role: 'Admin', email: 'admin@hospital.com', pass: 'admin123' },
                      { role: 'Doctor', email: 'doctor@hospital.com', pass: 'doctor123' },
                      { role: 'Accountant', email: 'accounts@hospital.com', pass: 'accounts123' },
                      { role: 'Front Desk', email: 'frontdesk@hospital.com', pass: 'front123' },
                      { role: 'Nurse', email: 'nurse@hospital.com', pass: 'nurse123' },
                      { role: 'Lab', email: 'lab@hospital.com', pass: 'lab123' },
                      { role: 'Pharmacy', email: 'pharmacy@hospital.com', pass: 'pharmacy123' },
                      { role: 'Accounts (Global)', email: 'accounts', pass: 'global123' },
                      { role: 'Pharmacy (Global)', email: 'pharmacy', pass: 'global123' },
                      { role: 'Front Office (Global)', email: 'frontoffice', pass: 'global123' },
                    ].map((cred, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => {
                          setUsername(cred.email);
                          setPassword(cred.pass);
                        }}
                        className="text-left p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all group"
                      >
                        <p className="text-[10px] font-bold text-medical-blue leading-none">{cred.role}</p>
                        <p className="text-[9px] text-slate-400 truncate">{cred.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              <p className="mt-12 text-center text-[10px] text-slate-400 font-medium">
                © 2024 Global Hospital & Maternity Center. All Rights Reserved.<br />
                System Powered by Digital Communique Private Limited
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
