import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Building2, Package, Layers, Hash, AlertTriangle, Users,
  RotateCcw, DollarSign, Truck, Plus, RefreshCw, CheckCircle2,
  AlertCircle, ChevronRight
} from 'lucide-react';

export const CompanyPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'batches' | 'serials' | 'recalls' | 'affected' | 'returns'>('overview');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [serials, setSerials] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [affectedCustomers, setAffectedCustomers] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState(user?.company?.company_name || 'Apex Mobility');
  const [newProdModel, setNewProdModel] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<number | ''>('');
  const [newProdWarranty, setNewProdWarranty] = useState(24);
  const [newProdDesc, setNewProdDesc] = useState('');

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [batchProductId, setBatchProductId] = useState<number | ''>('');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchMfgDate, setBatchMfgDate] = useState('2026-03-01');
  const [batchQtyMfg, setBatchQtyMfg] = useState(5000);
  const [batchQtyDist, setBatchQtyDist] = useState(4800);

  const [showSubmitRecallModal, setShowSubmitRecallModal] = useState(false);
  const [recallProdId, setRecallProdId] = useState<number | ''>('');
  const [recallTitle, setRecallTitle] = useState('');
  const [recallHazard, setRecallHazard] = useState('');
  const [recallSeverity, setRecallSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('critical');
  const [recallBatches, setRecallBatches] = useState('');
  const [recallSerials, setRecallSerials] = useState('');
  const [recallRemedy, setRecallRemedy] = useState<'refund' | 'replacement' | 'repair' | 'return_only'>('refund');
  const [recallInstructions, setRecallInstructions] = useState('');

  // Process return/refund/replacement modal
  const [processReturnModal, setProcessReturnModal] = useState<{ type: 'status' | 'refund' | 'replacement'; item: any } | null>(null);
  const [carrierInput, setCarrierInput] = useState('FedEx Priority Hazmat');
  const [trackingInput, setTrackingInput] = useState('');
  const [refundRefInput, setRefundRefInput] = useState('');

  const isApproved = user?.company?.status === 'approved';

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const d = await api.getCompanyDashboard();
        setDashboardData(d);
      } else if (activeTab === 'products') {
        const p = await api.getCompanyProducts();
        setProducts(p.products || []);
      } else if (activeTab === 'batches') {
        const b = await api.getCompanyBatches();
        setBatches(b.batches || []);
      } else if (activeTab === 'serials') {
        const s = await api.getCompanySerials();
        setSerials(s.serials || []);
      } else if (activeTab === 'recalls') {
        const r = await api.getCompanyRecalls();
        setRecalls(r.recalls || []);
      } else if (activeTab === 'affected') {
        const a = await api.getAffectedCustomers();
        setAffectedCustomers(a.affectedCustomers || []);
      } else if (activeTab === 'returns') {
        const ret = await api.getCompanyReturns();
        setReturns(ret.returns || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: newProdName,
        brand: newProdBrand,
        model: newProdModel,
        sku: newProdSku,
        categoryId: newProdCategory || undefined,
        description: newProdDesc,
        warrantyMonths: newProdWarranty,
      });
      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdModel('');
      setNewProdSku('');
      setNewProdDesc('');
      setToastMessage('Product registered into manufacturer catalog.');
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBatch({
        productId: Number(batchProductId),
        batchNumber,
        manufacturingDate: batchMfgDate,
        quantityManufactured: batchQtyMfg,
        quantityDistributed: batchQtyDist,
      });
      setShowAddBatchModal(false);
      setBatchNumber('');
      setToastMessage('Production batch logged successfully.');
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmitRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitRecall({
        productId: Number(recallProdId),
        title: recallTitle,
        hazardReason: recallHazard,
        severity: recallSeverity,
        affectedBatchNumbers: recallBatches,
        affectedSerialRange: recallSerials,
        remedyType: recallRemedy,
        customerInstructions: recallInstructions,
      });
      setShowSubmitRecallModal(false);
      setRecallTitle('');
      setRecallHazard('');
      setRecallBatches('');
      setRecallInstructions('');
      setToastMessage('Recall request submitted to Super Admin regulatory review.');
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateReturnStatus = async (status: string) => {
    if (!processReturnModal) return;
    try {
      await api.updateReturnStatus(processReturnModal.item.id, {
        status,
        trackingCarrier: carrierInput,
        trackingNumber: trackingInput,
      });
      setProcessReturnModal(null);
      setToastMessage(`Return request transitioned to ${status}.`);
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleProcessRefund = async () => {
    if (!processReturnModal || !processReturnModal.item.refund_id) return;
    try {
      await api.processRefund(processReturnModal.item.refund_id, {
        transactionReference: refundRefInput || `ACH-TX-${Date.now()}`,
        amount: processReturnModal.item.refund_amount,
      });
      setProcessReturnModal(null);
      setRefundRefInput('');
      setToastMessage('Refund transaction confirmed and logged to customer account.');
      loadTabData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDispatchReplacement = async () => {
    if (!processReturnModal || !processReturnModal.item.replacement_id) return;
    try {
      await api.dispatchReplacement(processReturnModal.item.replacement_id, {
        courier: carrierInput,
        trackingNumber: trackingInput || `TRK-US-${Date.now()}`,
      });
      setProcessReturnModal(null);
      setToastMessage('Replacement item dispatched with shipping tracking.');
      loadTabData();
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
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{user?.company?.company_name || user?.name}</div>
            <div className="text-[11px] text-slate-400">Manufacturer Operations</div>
          </div>
        </div>

        <nav className="p-3 space-y-1 text-xs font-medium flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'products' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'batches' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Batch Tracking</span>
          </button>

          <button
            onClick={() => setActiveTab('serials')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'serials' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Serial Numbers</span>
          </button>

          <button
            onClick={() => setActiveTab('recalls')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'recalls' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Recall Submissions</span>
          </button>

          <button
            onClick={() => setActiveTab('affected')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'affected' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Affected Customers</span>
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
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div className="text-slate-400 font-mono">ID: {user?.company?.registration_number || 'REG-PENDING'}</div>
          <div className="capitalize mt-0.5 font-semibold text-slate-300">Status: {user?.company?.status || 'Pending'}</div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">
            Manufacturer Portal / <span className="text-blue-600 capitalize">{activeTab}</span>
          </div>
          <button
            onClick={loadTabData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Verification Alert Banner if pending */}
        {!isApproved && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Company Profile Under Regulatory Review</div>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Your business credentials have been submitted. Operational recall submissions will be unlocked as soon as the Super Admin certifies your corporate registration documents.
              </p>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-4 cursor-pointer">×</button>
          </div>
        )}

        <div className="p-6">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && dashboardData && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Registered Products</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {dashboardData.stats.totalProducts}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Logged Batches</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {dashboardData.stats.totalBatches}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Published Recalls</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {dashboardData.stats.activeRecalls}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Pending Customer Returns</span>
                  <div className="text-2xl font-bold text-blue-600 mt-1 font-mono tabular-nums">
                    {dashboardData.stats.pendingReturns}
                  </div>
                </div>
              </div>

              {/* Company Details Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Corporate Registration Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Company Legal Entity</span>
                    <span className="font-semibold text-slate-900">{dashboardData.company.company_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Registration Code</span>
                    <span className="font-mono text-slate-900">{dashboardData.company.registration_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Industry</span>
                    <span className="font-semibold text-slate-900">{dashboardData.company.industry}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Primary Safety Contact</span>
                    <span className="font-semibold text-slate-900">{dashboardData.company.contact_person}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hotline Phone</span>
                    <span className="font-mono text-slate-900">{dashboardData.company.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Headquarters</span>
                    <span className="text-slate-900">{dashboardData.company.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Product Portfolio</h3>
                  <p className="text-xs text-slate-500">Manage registered product models, SKUs, and warranty terms.</p>
                </div>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  disabled={!isApproved}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Product</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3">Product Name / Brand</th>
                      <th className="px-6 py-3">Model & SKU</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Batches</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-slate-400 text-[11px]">{p.brand}</div>
                        </td>
                        <td className="px-6 py-4 font-mono">
                          <div>Model: {p.model}</div>
                          <div className="text-slate-400 text-[11px]">SKU: {p.sku}</div>
                        </td>
                        <td className="px-6 py-4">{p.category_name || 'General'}</td>
                        <td className="px-6 py-4 font-mono">{p.batch_count} registered</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            p.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                            p.status === 'recalled' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. BATCHES TAB */}
          {activeTab === 'batches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Production Batches</h3>
                  <p className="text-xs text-slate-500">Track production batches, manufacturing dates, and distribution volume.</p>
                </div>
                <button
                  onClick={() => setShowAddBatchModal(true)}
                  disabled={!isApproved || products.length === 0}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Production Batch</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3">Batch Number</th>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Mfg Date</th>
                      <th className="px-6 py-3">Manufactured / Distributed</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 font-mono text-[11px]">
                        <td className="px-6 py-4 font-bold text-slate-900">{b.batch_number}</td>
                        <td className="px-6 py-4 font-sans text-xs">
                          <div className="font-semibold text-slate-800">{b.product_name}</div>
                          <div className="text-slate-400 font-mono text-[10px]">{b.model}</div>
                        </td>
                        <td className="px-6 py-4">{b.manufacturing_date}</td>
                        <td className="px-6 py-4 tabular-nums">{b.quantity_manufactured.toLocaleString()} / {b.quantity_distributed.toLocaleString()}</td>
                        <td className="px-6 py-4 font-sans">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            b.status === 'normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. SERIAL NUMBERS TAB */}
          {activeTab === 'serials' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Serial Number Registry</h3>
                <p className="text-xs text-slate-500">Track registered vs available individual serial units.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3">Serial Number</th>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Batch</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {serials.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-bold text-slate-900">{s.serial_number}</td>
                        <td className="px-6 py-3 font-sans text-xs">{s.product_name}</td>
                        <td className="px-6 py-3">{s.batch_number || 'N/A'}</td>
                        <td className="px-6 py-3 font-sans">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            s.status === 'available' ? 'bg-slate-100 text-slate-700' :
                            s.status === 'registered' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. RECALL SUBMISSIONS TAB */}
          {activeTab === 'recalls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recall Request Filings</h3>
                  <p className="text-xs text-slate-500">Initiate and monitor regulatory recall approval workflows.</p>
                </div>
                <button
                  onClick={() => setShowSubmitRecallModal(true)}
                  disabled={!isApproved}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Submit Safety Recall Filing</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200">
                {recalls.map((r) => (
                  <div key={r.id} className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          r.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {r.severity}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        r.status === 'approved_published' ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'submitted' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Product: <span className="font-semibold text-slate-900">{r.product_name}</span> · Affected Batches: <span className="font-mono text-slate-900">{r.affected_batch_numbers}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                      {r.hazard_reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. AFFECTED CUSTOMERS TRACKER TAB */}
          {activeTab === 'affected' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Automated Affected Customer Tracker</h3>
                <p className="text-xs text-slate-500">
                  Customers identified by the platform matching engine whose registered units fall within certified recall batches.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3">Customer Contact</th>
                      <th className="px-6 py-3">Product / Batch / S/N</th>
                      <th className="px-6 py-3">Recall ID</th>
                      <th className="px-6 py-3">Notification Status</th>
                      <th className="px-6 py-3">Return Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {affectedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No affected customers detected for current batches.
                        </td>
                      </tr>
                    ) : (
                      affectedCustomers.map((ac) => (
                        <tr key={ac.customer_product_id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{ac.customer_name}</div>
                            <div className="text-slate-400 text-[11px]">{ac.customer_email} · {ac.customer_phone || 'No phone'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{ac.product_name}</div>
                            <div className="text-slate-400 font-mono text-[11px]">Batch: {ac.batch_number} · S/N: {ac.serial_number || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-red-600">
                            #{ac.recall_id} ({ac.recall_severity})
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Notified In-App</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize font-mono font-semibold text-slate-800">
                              {ac.return_status ? ac.return_status.replace('_', ' ') : 'Pending Customer Action'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. RETURNS & REFUNDS PROCESSING TAB */}
          {activeTab === 'returns' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Return & Remedy Processing</h3>
                <p className="text-xs text-slate-500">
                  Manage incoming customer defective unit return parcels, verify hardware receipts, and issue refunds or dispatch certified replacements.
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {returns.map((ret) => (
                  <div key={ret.id} className="p-6 space-y-4 hover:bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">Return #{ret.id}</span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs font-semibold text-slate-800">{ret.customer_name}</span>
                        <span className="text-xs text-slate-400 font-mono">({ret.customer_email})</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                        ret.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                        ret.status === 'item_shipped' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {ret.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block font-medium">Recalled Product:</span>
                        <span className="font-semibold text-slate-800">{ret.product_name}</span> (S/N: {ret.serial_number})
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Requested Remedy:</span>
                        <span className="font-bold text-blue-600 uppercase">{ret.preferred_remedy}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Shipping Tracking:</span>
                        <span className="font-mono text-slate-800">{ret.tracking_carrier || 'Pending'} · {ret.tracking_number || ''}</span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                      {ret.status === 'submitted' && (
                        <button
                          onClick={() => {
                            setProcessReturnModal({ type: 'status', item: ret });
                            setCarrierInput('FedEx Freight Hazardous');
                            setTrackingInput('FX-' + Math.floor(100000 + Math.random() * 900000));
                          }}
                          className="px-3 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                        >
                          Approve & Issue Pre-Paid Shipping Label
                        </button>
                      )}

                      {ret.status === 'item_shipped' && (
                        <button
                          onClick={() => {
                            api.updateReturnStatus(ret.id, { status: 'verified' }).then(() => {
                              setToastMessage('Item verified as received at quality facility.');
                              loadTabData();
                            });
                          }}
                          className="px-3 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                        >
                          Confirm Receipt & Verify Defect
                        </button>
                      )}

                      {ret.preferred_remedy === 'refund' && ret.refund_status === 'pending' && (
                        <button
                          onClick={() => {
                            setProcessReturnModal({ type: 'refund', item: ret });
                            setRefundRefInput(`ACH-TX-${Date.now()}`);
                          }}
                          className="px-3 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Process ${ret.refund_amount?.toFixed(2)} Refund</span>
                        </button>
                      )}

                      {ret.preferred_remedy === 'replacement' && ret.replacement_status === 'pending' && (
                        <button
                          onClick={() => {
                            setProcessReturnModal({ type: 'replacement', item: ret });
                            setTrackingInput(`REP-US-${Date.now()}`);
                          }}
                          className="px-3 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Revised Replacement Unit</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* MODALS */}

      {/* 1. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Product to Portfolio</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Apex Horizon Inverter"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model Code</label>
                  <input
                    type="text"
                    required
                    value={newProdModel}
                    onChange={(e) => setNewProdModel(e.target.value)}
                    placeholder="HVI-900X"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="APX-HVI-900"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Log Production Batch</h3>
            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  required
                  value={batchProductId}
                  onChange={(e) => setBatchProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="">Choose product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number Code</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-Q3-C1"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturing Date</label>
                <input
                  type="date"
                  required
                  value={batchMfgDate}
                  onChange={(e) => setBatchMfgDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qty Manufactured</label>
                  <input
                    type="number"
                    value={batchQtyMfg}
                    onChange={(e) => setBatchQtyMfg(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qty Distributed</label>
                  <input
                    type="number"
                    value={batchQtyDist}
                    onChange={(e) => setBatchQtyDist(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Submit Recall Modal */}
      {showSubmitRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Submit Formal Recall Notice Filing</h3>
            <p className="text-xs text-slate-500">
              Upon Super Admin certification, this notice will be published to the public registry and the Automated Customer Identification Engine will match all registered units.
            </p>
            <form onSubmit={handleSubmitRecall} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Defective Product</label>
                <select
                  required
                  value={recallProdId}
                  onChange={(e) => setRecallProdId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="">Choose product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Recall Title</label>
                <input
                  type="text"
                  required
                  value={recallTitle}
                  onChange={(e) => setRecallTitle(e.target.value)}
                  placeholder="e.g. SAFETY RECALL: Thermal Inverter Capacitor Solder Degradation"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Severity</label>
                  <select
                    value={recallSeverity}
                    onChange={(e: any) => setRecallSeverity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg capitalize"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guaranteed Remedy</label>
                  <select
                    value={recallRemedy}
                    onChange={(e: any) => setRecallRemedy(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg capitalize"
                  >
                    <option value="refund">100% Refund</option>
                    <option value="replacement">Free Replacement Unit</option>
                    <option value="repair">Authorized Repair / Firmware</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Affected Batch Numbers (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={recallBatches}
                  onChange={(e) => setRecallBatches(e.target.value)}
                  placeholder="e.g. BATCH-2026-Q1-A4, BATCH-2026-Q1-A5"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hazard / Failure Analysis</label>
                <textarea
                  required
                  rows={3}
                  value={recallHazard}
                  onChange={(e) => setRecallHazard(e.target.value)}
                  placeholder="Describe failure mechanism, risk of injury or fire, and testing data..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions for Customers</label>
                <textarea
                  required
                  rows={2}
                  value={recallInstructions}
                  onChange={(e) => setRecallInstructions(e.target.value)}
                  placeholder="Immediately cease operation. Package in original container or request certified hazardous packing crate..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitRecallModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Process Return / Action Modal */}
      {processReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {processReturnModal.type === 'status' && 'Approve & Issue Shipping Label'}
              {processReturnModal.type === 'refund' && 'Process Customer Refund'}
              {processReturnModal.type === 'replacement' && 'Dispatch Replacement Unit'}
            </h3>

            {processReturnModal.type === 'status' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shipping Courier</label>
                  <input
                    type="text"
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pre-Paid Tracking Number</label>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setProcessReturnModal(null)} className="px-3 py-1.5 text-slate-600 cursor-pointer">Cancel</button>
                  <button onClick={() => handleUpdateReturnStatus('approved')} className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg cursor-pointer">Confirm Approval</button>
                </div>
              </div>
            )}

            {processReturnModal.type === 'refund' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Refund Amount</label>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    ${processReturnModal.item.refund_amount?.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank ACH / Wire Transaction Ref</label>
                  <input
                    type="text"
                    value={refundRefInput}
                    onChange={(e) => setRefundRefInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setProcessReturnModal(null)} className="px-3 py-1.5 text-slate-600 cursor-pointer">Cancel</button>
                  <button onClick={handleProcessRefund} className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer">Authorize & Record Refund</button>
                </div>
              </div>
            )}

            {processReturnModal.type === 'replacement' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Carrier Courier</label>
                  <input
                    type="text"
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shipment Tracking Code</label>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setProcessReturnModal(null)} className="px-3 py-1.5 text-slate-600 cursor-pointer">Cancel</button>
                  <button onClick={handleDispatchReplacement} className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg cursor-pointer">Confirm Dispatch</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
