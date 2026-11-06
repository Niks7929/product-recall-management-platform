import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';
import {
  X, Lock, Mail, User, Building2, Phone, MapPin, Globe,
  ShieldCheck, AlertCircle, Eye, EyeOff, Headphones, ArrowRight, Check
} from 'lucide-react';

export const AuthModals: React.FC = () => {
  const {
    authModal, setAuthModal, login,
    registerCustomer, registerCompany, registerStaff
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Selected role for Login (Only Consumer, Company, Staff are visible on UI)
  const [loginRole, setLoginRole] = useState<'customer' | 'company' | 'support_staff'>('customer');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Selected role for Registration (Exactly the same 3 roles!)
  const [registerRole, setRegisterRole] = useState<'customer' | 'company' | 'support_staff'>('customer');

  // Customer registration state
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Company registration state
  const [compName, setCompName] = useState('');
  const [compRegNo, setCompRegNo] = useState('');
  const [compTaxId, setCompTaxId] = useState('');
  const [compContact, setCompContact] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPassword, setCompPassword] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compIndustry, setCompIndustry] = useState('Automotive & Mobility');

  // Staff registration state
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffDept, setStaffDept] = useState('Field Quality & Returns Inspection');

  if (authModal === 'none') return null;

  // Change role in login
  const handleSelectLoginRole = (role: 'customer' | 'company' | 'support_staff') => {
    setLoginRole(role);
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerCustomer({
        name: custName,
        email: custEmail,
        password: custPassword,
        phone: custPhone,
        address: custAddress,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerCompany({
        companyName: compName,
        registrationNumber: compRegNo,
        taxId: compTaxId,
        contactPerson: compContact,
        email: compEmail,
        password: compPassword,
        phone: compPhone,
        address: compAddress,
        website: compWebsite,
        industry: compIndustry,
      });
    } catch (err: any) {
      setError(err.message || 'Company registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerStaff({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone,
        department: staffDept,
      });
    } catch (err: any) {
      setError(err.message || 'Staff registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {authModal === 'login' ? 'Authorized Portal Sign-In' : 'Portal Registration'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {authModal === 'login'
                ? 'Select your account role to access your portal'
                : 'Select account role to register on RecallGuard'}
            </p>
          </div>
          <button
            onClick={() => setAuthModal('none')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* 1. SIGN IN (LOGIN) WITH THE 3 ROLES (NO ADMIN EXPOSED ON UI) */}
        {authModal === 'login' && (
          <div className="p-6 space-y-5">
            
            {/* Role Selection Tabs (Consumer, Company, Staff) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Select Account Role:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                
                <button
                  type="button"
                  onClick={() => handleSelectLoginRole('customer')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginRole === 'customer'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Consumer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLoginRole('company')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginRole === 'company'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Company</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLoginRole('support_staff')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginRole === 'support_staff'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Headphones className="w-4 h-4" />
                  <span>Staff</span>
                </button>

              </div>
            </div>

            {/* Role Details Banner */}
            <div className="p-3 rounded-xl border bg-blue-50/70 text-blue-900 border-blue-200/80 text-xs leading-relaxed">
              {loginRole === 'customer' && (
                <div>
                  <strong>Consumer Access:</strong> View registered equipment, track active safety recall alerts, and submit pre-paid return claims.
                </div>
              )}
              {loginRole === 'company' && (
                <div>
                  <strong>Enterprise Manufacturer:</strong> Manage product batches, track serial ranges, submit recalls for regulatory certification, and issue refunds.
                </div>
              )}
              {loginRole === 'support_staff' && (
                <div>
                  <strong>Safety Support Staff:</strong> Investigate filed safety complaints, communicate with consumers, and assist with defect verifications.
                </div>
              )}
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Username or email address"
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Need a new account?</span>
              <button
                onClick={() => setAuthModal('register_customer')}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Register Here
              </button>
            </div>

          </div>
        )}

        {/* 2. REGISTRATION MODAL WITH THE EXACT SAME 3 ROLES (CONSUMER, COMPANY, STAFF) */}
        {(authModal === 'register_customer' || authModal === 'register_company') && (
          <div className="p-6 space-y-5">
            
            {/* Same 3 Role Selection Tabs for Registration */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Select Account Role to Register:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                
                <button
                  type="button"
                  onClick={() => setRegisterRole('customer')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    registerRole === 'customer'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Consumer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterRole('company')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    registerRole === 'company'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Company</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterRole('support_staff')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    registerRole === 'support_staff'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Headphones className="w-4 h-4" />
                  <span>Staff</span>
                </button>

              </div>
            </div>

            {/* A. Consumer Registration Form */}
            {registerRole === 'customer' && (
              <form onSubmit={handleCustomerRegisterSubmit} className="space-y-3.5">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                  Register as a consumer to log purchased equipment, receive instant safety recall alerts, and submit return/refund requests.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="david@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password (min 6 characters)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City / State</label>
                    <input
                      type="text"
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      placeholder="San Francisco, CA"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'Creating Consumer Account...' : 'Complete Consumer Registration'}
                  </button>
                </div>
              </form>
            )}

            {/* B. Manufacturer Registration Form */}
            {registerRole === 'company' && (
              <form onSubmit={handleCompanyRegisterSubmit} className="space-y-3.5">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                  <strong>Regulatory Certification:</strong> Enterprise accounts are certified by regulatory administration before recall publishing permissions are unlocked.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company Legal Name</label>
                    <input
                      type="text"
                      required
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      placeholder="e.g. Apex Mobility Corp"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector</label>
                    <select
                      value={compIndustry}
                      onChange={(e) => setCompIndustry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option>Automotive & Mobility</option>
                      <option>Consumer Electronics</option>
                      <option>Medical & Healthcare</option>
                      <option>Child Care & Toys</option>
                      <option>Food & Beverages</option>
                      <option>Industrial & Tools</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Registration # / Corp ID</label>
                    <input
                      type="text"
                      required
                      value={compRegNo}
                      onChange={(e) => setCompRegNo(e.target.value)}
                      placeholder="US-CORP-99281"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Federal Tax ID / EIN</label>
                    <input
                      type="text"
                      value={compTaxId}
                      onChange={(e) => setCompTaxId(e.target.value)}
                      placeholder="EIN-12-3456789"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Safety Officer Contact</label>
                    <input
                      type="text"
                      required
                      value={compContact}
                      onChange={(e) => setCompContact(e.target.value)}
                      placeholder="VP Quality & Safety"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
                    <input
                      type="email"
                      required
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      placeholder="safety@company.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={compPassword}
                      onChange={(e) => setCompPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value)}
                      placeholder="+1 (800) 000-0000"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Official Website</label>
                    <input
                      type="url"
                      value={compWebsite}
                      onChange={(e) => setCompWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'Submitting Application...' : 'Submit Manufacturer Registration'}
                  </button>
                </div>
              </form>
            )}

            {/* C. Staff Registration Form */}
            {registerRole === 'support_staff' && (
              <form onSubmit={handleStaffRegisterSubmit} className="space-y-3.5">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                  Register as an authorized safety support staff member to manage consumer defect inquiries and return verifications.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Full Name</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Jason Burke"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Work Email</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="jason.burke@recallguard.gov"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password (min 6 characters)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department</label>
                    <input
                      type="text"
                      value={staffDept}
                      onChange={(e) => setStaffDept(e.target.value)}
                      placeholder="Field Quality & Defect Verification"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="+1 (800) 555-0144"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'Creating Staff Account...' : 'Complete Staff Registration'}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-2 text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthModal('login')}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
