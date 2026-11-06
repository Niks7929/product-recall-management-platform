import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { CustomerProduct, ReturnRequest, Complaint, NotificationItem } from '../../types.ts';
import {
  User, Package, AlertTriangle, RotateCcw, MessageSquare, Bell,
  Plus, RefreshCw, CheckCircle2, ShieldCheck, ArrowRight, Truck,
  DollarSign, Send, Check, ChevronRight
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'returns' | 'complaints' | 'notifications'>('overview');

  const [stats, setStats] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<CustomerProduct[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showRegisterProductModal, setShowRegisterProductModal] = useState(false);
  const [regProdId, setRegProdId] = useState<number | ''>('');
  const [regBatch, setRegBatch] = useState('');
  const [regSerial, setRegSerial] = useState('');
  const [regDate, setRegDate] = useState('2026-02-14');
  const [regSource, setRegSource] = useState('Official Dealership / Retailer');

  // Return request modal
  const [claimReturnProduct, setClaimReturnProduct] = useState<CustomerProduct | null>(null);
  const [claimRemedy, setClaimRemedy] = useState<'refund' | 'replacement'>('refund');
  const [claimReason, setClaimReason] = useState('');

  // Complaint modal & active thread
  const [showFileComplaintModal, setShowFileComplaintModal] = useState(false);
  const [compProductId, setCompProductId] = useState<number | ''>('');
  const [compCategory, setCompCategory] = useState('Critical Safety Failure');
  const [compSubject, setCompSubject] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compPriority, setCompPriority] = useState<'critical' | 'high' | 'medium'>('critical');

  const [activeComplaintThread, setActiveComplaintThread] = useState<any | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    loadPublicProducts();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadPublicProducts = async () => {
    try {
      const res = await api.getPublicRecalls();
      // or fetch categories
    } catch (e) {
      console.error(e);
    }
  };

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const d = await api.getCustomerDashboard();
        setStats(d.stats);
        const p = await api.getCustomerProducts();
        setMyProducts(p.products || []);
      } else if (activeTab === 'products') {
        const p = await api.getCustomerProducts();
        setMyProducts(p.products || []);
        // Also fetch catalog of products to register
        const rec = await api.getPublicRecalls();
        setAvailableProducts(rec.recalls || []);
      } else if (activeTab === 'returns') {
        const r = await api.getCustomerReturns();
        setReturns(r.returns || []);
      } else if (activeTab === 'complaints') {
        const c = await api.getCustomerComplaints();
        setComplaints(c.complaints || []);
      } else if (activeTab === 'notifications') {
        const n = await api.getCustomerNotifications();
        setNotifications(n.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.registerCustomerProduct({
        productId: Number(regProdId || 1),
        batchNumber: regBatch,
        serialNumber: regSerial,
        purchaseDate: regDate,
        purchaseSource: regSource,
      });
      setShowRegisterProductModal(false);
      setRegBatch('');
      setRegSerial('');
      setToastMessage(res.message);
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimReturnProduct) return;
    try {
      await api.submitCustomerReturn({
        customerProductId: claimReturnProduct.id,
        preferredRemedy: claimRemedy,
        reason: claimReason,
      });
      setClaimReturnProduct(null);
      setClaimReason('');
      setToastMessage('Return claim submitted! The manufacturer will review and issue pre-paid return dispatch paperwork.');
      setActiveTab('returns');
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitComplaint({
        productId: compProductId ? Number(compProductId) : undefined,
        category: compCategory,
        subject: compSubject,
        description: compDesc,
        priority: compPriority,
      });
      setShowFileComplaintModal(false);
      setCompSubject('');
      setCompDesc('');
      setToastMessage('Complaint registered and assigned to safety staff.');
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openThread = async (complaint: any) => {
    setActiveComplaintThread(complaint);
    try {
      const res = await api.getComplaintMessages(complaint.id);
      setThreadMessages(res.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeComplaintThread) return;
    try {
      await api.sendComplaintMessage(activeComplaintThread.id, replyMessage);
      setReplyMessage('');
      const res = await api.getComplaintMessages(activeComplaintThread.id);
      setThreadMessages(res.messages || []);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-400">Consumer Safety Portal</div>
          </div>
        </div>

        <nav className="p-3 space-y-1 text-xs font-medium flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Safety Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'products' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Registered Products</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'returns' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns & Refunds</span>
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'complaints' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Safety Complaints</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'notifications' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Safety Notifications</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div>Verified Consumer: <span className="text-slate-300">{user?.name}</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">{user?.email}</div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">
            Consumer Safety / <span className="text-blue-600 capitalize">{activeTab}</span>
          </div>
          <button
            onClick={loadTabData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-4 cursor-pointer">×</button>
          </div>
        )}

        <div className="p-6">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Registered Units</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {stats?.registeredProducts || myProducts.length}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Active Recall Alerts</span>
                  <div className="text-2xl font-bold text-red-600 mt-1 font-mono tabular-nums">
                    {stats?.affectedAlerts || 0}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Pending Returns</span>
                  <div className="text-2xl font-bold text-blue-600 mt-1 font-mono tabular-nums">
                    {stats?.pendingReturns || 0}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Open Complaints</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {stats?.openComplaints || 0}
                  </div>
                </div>
              </div>

              {/* Active Recalls Urgency Banner if any product is affected */}
              {myProducts.some((p) => p.status === 'affected_by_recall') && (
                <div className="p-5 rounded-xl bg-red-50 border border-red-200 space-y-3">
                  <div className="flex items-center gap-2.5 text-red-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>URGENT: One or More of Your Registered Products is Under Active Safety Recall!</span>
                  </div>
                  <p className="text-xs text-red-950 leading-relaxed">
                    A certified manufacturer recall has matched your registered product batch. Please cease operation of affected hardware immediately to prevent safety hazards. You are eligible for 100% manufacturer-covered remedy.
                  </p>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Affected Product & Claim Remedy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Products view */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    My Registered Equipment
                  </h3>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    View All & Register
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {myProducts.slice(0, 3).map((p) => (
                    <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{p.product_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Batch: {p.batch_number} · S/N: {p.serial_number || 'N/A'}
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                        p.status === 'affected_by_recall' ? 'bg-red-50 text-red-700 font-bold' :
                        p.status === 'return_initiated' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {p.status === 'affected_by_recall' ? 'RECALL ADVISORY ACTIVE' : p.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 2. MY PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Registered Purchased Products</h3>
                  <p className="text-xs text-slate-500">
                    Register your equipment to activate automatic recall monitoring and priority manufacturer warranty remedies.
                  </p>
                </div>
                <button
                  onClick={() => setShowRegisterProductModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register a Product</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myProducts.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-white rounded-xl border p-5 space-y-4 ${
                      p.status === 'affected_by_recall' ? 'border-red-300 shadow-md ring-1 ring-red-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{p.product_name}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">Brand: {p.brand} · Model: {p.model}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.status === 'affected_by_recall' ? 'bg-red-100 text-red-800' :
                        p.status === 'return_initiated' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {p.status === 'affected_by_recall' ? 'RECALL ACTIVE' : 'Normal / Safe'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Batch Code:</span>
                        <span className="font-bold text-slate-800">{p.batch_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Serial Number:</span>
                        <span className="font-bold text-slate-800">{p.serial_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between font-sans">
                        <span className="text-slate-400">Purchase Date:</span>
                        <span className="text-slate-700">{p.purchase_date}</span>
                      </div>
                    </div>

                    {p.status === 'affected_by_recall' && (
                      <div className="space-y-3 pt-1">
                        <div className="text-xs text-red-800 bg-red-50 p-2.5 rounded-lg border border-red-200">
                          <strong>Active Safety Hazard:</strong> {p.recall_hazard || 'Defect vulnerability certified. Please initiate remedy.'}
                        </div>
                        <button
                          onClick={() => {
                            setClaimReturnProduct(p);
                            setClaimReason(`Claiming official remedy for recall #${p.active_recall_id}: ${p.recall_title}`);
                          }}
                          className="w-full py-2 px-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Initiate Pre-Paid Return & Remedy</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. RETURNS & REFUNDS TRACKING TAB */}
          {activeTab === 'returns' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Return & Remedy Tracking</h3>
                <p className="text-xs text-slate-500">Real-time status of your defective hardware shipments, verification, and refunds.</p>
              </div>

              <div className="divide-y divide-slate-200">
                {returns.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No returns currently in progress.
                  </div>
                ) : (
                  returns.map((ret) => (
                    <div key={ret.id} className="p-6 space-y-4 hover:bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-slate-900 text-sm">Return Claim #{ret.id}</span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs font-semibold text-slate-800">{ret.product_name}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                          ret.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                          ret.status === 'item_shipped' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {ret.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Progress Stepper */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium pt-2">
                        <div className={`p-2 rounded-lg border ${ret.status !== 'rejected' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200'}`}>
                          1. Submitted
                        </div>
                        <div className={`p-2 rounded-lg border ${['approved', 'item_shipped', 'item_received', 'verified'].includes(ret.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          2. Approved & Label
                        </div>
                        <div className={`p-2 rounded-lg border ${['item_shipped', 'item_received', 'verified'].includes(ret.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          3. In Transit
                        </div>
                        <div className={`p-2 rounded-lg border ${ret.status === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          4. Verified & Settled
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Shipping Label Details:</span>
                          <span className="font-mono text-slate-800 font-semibold">{ret.tracking_carrier || 'Preparing dispatch'}</span>
                          {ret.tracking_number && <div className="font-mono text-blue-600 text-[11px]">{ret.tracking_number}</div>}
                        </div>
                        <div>
                          <span className="text-slate-400 block">Selected Remedy:</span>
                          <span className="font-bold text-slate-800 uppercase">{ret.preferred_remedy}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Settlement Status:</span>
                          {ret.preferred_remedy === 'refund' ? (
                            <span className="font-mono text-slate-800 font-semibold">
                              ${ret.refund_amount?.toFixed(2)} ({ret.refund_status})
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {ret.replacement_status}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. COMPLAINTS & SAFETY INCIDENTS TAB */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Safety Complaints & Defect Reports</h3>
                  <p className="text-xs text-slate-500">Report hardware failures and message directly with regulatory safety staff.</p>
                </div>
                <button
                  onClick={() => setShowFileComplaintModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report Incident / Defect</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaints.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-slate-400 font-semibold">Incident #{c.id}</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{c.subject}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {c.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Assigned: {c.staff_name || 'Safety Division'}</span>
                      <button
                        onClick={() => openThread(c)}
                        className="font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Incident Messages</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Safety Alerts & Notifications</h3>
                  <p className="text-xs text-slate-500">Official warnings dispatched for your registered equipment.</p>
                </div>
                <button
                  onClick={async () => {
                    await api.markAllNotificationsRead();
                    loadTabData();
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Mark All as Read
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-5 flex items-start gap-3.5 ${n.is_read ? 'bg-white' : 'bg-blue-50/40'}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* REGISTER PRODUCT MODAL */}
      {showRegisterProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Register Purchased Product</h3>
            <p className="text-xs text-slate-500">
              Provide batch number and serial number to activate automated recall safety monitoring.
            </p>
            <form onSubmit={handleRegisterProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product Model</label>
                <select
                  required
                  value={regProdId}
                  onChange={(e) => setRegProdId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="1">Apex Horizon High-Voltage Inverter (HVI-900X)</option>
                  <option value="2">Apex Kinetic Ceramic Brake Calipers (KC-440)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number Code</label>
                <input
                  type="text"
                  required
                  value={regBatch}
                  onChange={(e) => setRegBatch(e.target.value)}
                  placeholder="e.g. BATCH-2026-Q1-A4"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Serial Number</label>
                <input
                  type="text"
                  value={regSerial}
                  onChange={(e) => setRegSerial(e.target.value)}
                  placeholder="e.g. SN-HVI-2601-9011"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  required
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterProductModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLAIM RETURN MODAL */}
      {claimReturnProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Initiate Safety Recall Return</h3>
            <p className="text-xs text-slate-600">
              Returning: <span className="font-semibold text-slate-900">{claimReturnProduct.product_name}</span> (Batch: {claimReturnProduct.batch_number})
            </p>
            <form onSubmit={handleSubmitReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Remedy Option</label>
                <select
                  value={claimRemedy}
                  onChange={(e: any) => setClaimRemedy(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="refund">100% Manufacturer Direct Refund</option>
                  <option value="replacement">Free Expedited Replacement (Revision Unit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return Reason / Safety Notes</label>
                <textarea
                  required
                  rows={3}
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  placeholder="Describe condition of hardware and packaging availability..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimReturnProduct(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE COMPLAINT MODAL */}
      {showFileComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Report Hardware Safety Incident</h3>
            <form onSubmit={handleFileComplaint} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={compSubject}
                  onChange={(e) => setCompSubject(e.target.value)}
                  placeholder="e.g. Smoke discharge observed during charging"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option>Critical Safety Failure</option>
                    <option>Component Overheating</option>
                    <option>Electrical Short</option>
                    <option>Structural Fracture</option>
                    <option>Other Defect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={compPriority}
                    onChange={(e: any) => setCompPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg capitalize"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Narrative</label>
                <textarea
                  required
                  rows={4}
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder="Describe when defect occurred, ambient conditions, and any bodily injuries or property damage..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFileComplaintModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  File Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT MESSAGE THREAD MODAL */}
      {activeComplaintThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-xl w-full h-[600px] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Incident #{activeComplaintThread.id}: {activeComplaintThread.subject}</h4>
                <div className="text-[11px] text-slate-500">Staff assigned: {activeComplaintThread.staff_name || 'Safety Staff'}</div>
              </div>
              <button onClick={() => setActiveComplaintThread(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {threadMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl max-w-[85%] text-xs ${
                    m.sender_role === 'customer'
                      ? 'ml-auto bg-blue-600 text-white'
                      : 'mr-auto bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-semibold opacity-75 mb-1">{m.sender_name} ({m.sender_role})</div>
                  <p className="leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendThreadReply} className="p-3 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type response to safety staff..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
              <button type="submit" className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
