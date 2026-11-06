import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldAlert, Building2, AlertTriangle, Users, FileText, CheckCircle2,
  XCircle, PauseCircle, PlayCircle, RefreshCw, Download, Plus, Search,
  Lock, Eye, ChevronRight, UserCheck
} from 'lucide-react';

export const SuperAdminPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'recalls' | 'staff' | 'audit' | 'reports'>('overview');
  
  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal / inputs
  const [rejectReasonModal, setRejectReasonModal] = useState<{ type: 'company' | 'recall'; id: number } | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  
  // Create staff modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffDept, setStaffDept] = useState('Quality & Returns Inspection');
  const [staffCode, setStaffCode] = useState('');

  // Audit filter
  const [auditFilter, setAuditFilter] = useState('');

  useEffect(() => {
    loadAll();
  }, [activeTab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const data = await api.getAdminOverview();
        setOverview(data);
      } else if (activeTab === 'companies') {
        const data = await api.getAdminCompanies();
        setCompanies(data.companies || []);
      } else if (activeTab === 'recalls') {
        const data = await api.getAdminRecalls();
        setRecalls(data.recalls || []);
      } else if (activeTab === 'staff') {
        const data = await api.getSupportStaff();
        setStaff(data.staff || []);
      } else if (activeTab === 'audit') {
        const data = await api.getAuditLogs(100);
        setAuditLogs(data.logs || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCompany = async (id: number) => {
    try {
      await api.approveCompany(id);
      setActionMessage('Company successfully verified and approved.');
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRejectCompany = async () => {
    if (!rejectReasonModal) return;
    try {
      await api.rejectCompany(rejectReasonModal.id, reasonInput);
      setActionMessage('Company registration declined.');
      setRejectReasonModal(null);
      setReasonInput('');
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleSuspendCompany = async (id: number) => {
    try {
      await api.toggleCompanySuspension(id);
      setActionMessage('Company operational status updated.');
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleApprovePublishRecall = async (id: number) => {
    try {
      const res = await api.approvePublishRecall(id);
      setActionMessage(`Recall #${id} published! Automated Customer Detection Engine flagged and notified ${res.affectedCount} registered customers.`);
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRejectRecall = async () => {
    if (!rejectReasonModal) return;
    try {
      await api.rejectRecall(rejectReasonModal.id, reasonInput);
      setActionMessage('Recall request rejected.');
      setRejectReasonModal(null);
      setReasonInput('');
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupportStaff({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        department: staffDept,
        staffCode: staffCode || undefined
      });
      setShowAddStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffCode('');
      setActionMessage('New Support Staff account provisioned.');
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleStaff = async (id: number) => {
    try {
      await api.toggleStaffStatus(id);
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Log ID,Timestamp,Role,Email,Action,Entity,Details\n';
    auditLogs.forEach((l) => {
      csvContent += `"${l.id}","${l.created_at}","${l.user_role}","${l.user_email}","${l.action}","${l.entity_type}","${(l.details || '').replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recallguard_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Super Admin</div>
            <div className="text-[11px] text-slate-400">Recall Directorate</div>
          </div>
        </div>

        <nav className="p-3 space-y-1 text-xs font-medium flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'companies' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company Approvals</span>
          </button>

          <button
            onClick={() => setActiveTab('recalls')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'recalls' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Recall Request Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'staff' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Support Staff</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Trail & Security</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div>Admin: <span className="text-slate-300">{user?.name}</span></div>
          <div className="font-mono text-[10px] mt-0.5 truncate">{user?.email}</div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">
            Platform Governance / <span className="text-blue-600 capitalize">{activeTab}</span>
          </div>
          <button
            onClick={loadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Action toast */}
        {actionMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-700 font-bold ml-4 cursor-pointer">×</button>
          </div>
        )}

        <div className="p-6">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Total Companies</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {overview.kpis.companiesTotal}
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium mt-1">
                    {overview.kpis.companiesPending} Pending Verification
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Active Recalls</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {overview.kpis.recallsActive}
                  </div>
                  <div className="text-[11px] text-blue-600 font-medium mt-1">
                    {overview.kpis.recallsPending} Awaiting Approval
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Registered Consumers</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                    {overview.kpis.customersTotal}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Monitored units active</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Open Complaints</span>
                  <div className="text-2xl font-bold text-red-600 mt-1 font-mono tabular-nums">
                    {overview.kpis.openComplaints}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Assigned to safety staff</div>
                </div>
              </div>

              {/* Severity breakdown */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Published Recalls by Risk Severity
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {overview.severityDistribution.map((item: any) => (
                    <div key={item.severity} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="capitalize font-semibold text-slate-700">{item.severity}</div>
                      <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Audit Stream */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recent Administrative & Security Events
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    View All Logs
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {overview.recentAudits.map((log: any) => (
                    <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 font-mono">{log.action}</div>
                        <div className="text-slate-500">{log.details}</div>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 2. COMPANIES TAB */}
          {activeTab === 'companies' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Registered Manufacturer Directory</h3>
                  <p className="text-xs text-slate-500">Verify company business credentials and compliance authorizations.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-6 py-3">Company / Registration</th>
                      <th className="px-6 py-3">Safety Officer</th>
                      <th className="px-6 py-3">Industry</th>
                      <th className="px-6 py-3">Products</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {companies.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{c.company_name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{c.registration_number} · {c.tax_id || 'No Tax ID'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{c.contact_person}</div>
                          <div className="text-slate-400 text-[11px]">{c.contact_email}</div>
                        </td>
                        <td className="px-6 py-4">{c.industry}</td>
                        <td className="px-6 py-4 font-mono">{c.product_count} prods / {c.recall_count} recalls</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            c.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            c.status === 'pending_approval' ? 'bg-amber-50 text-amber-700' :
                            c.status === 'suspended' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {c.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApproveCompany(c.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectReasonModal({ type: 'company', id: c.id })}
                                className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {c.status === 'approved' && (
                            <button
                              onClick={() => handleToggleSuspendCompany(c.id)}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                          {c.status === 'suspended' && (
                            <button
                              onClick={() => handleToggleSuspendCompany(c.id)}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. RECALL REQUEST QUEUE TAB */}
          {activeTab === 'recalls' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Recall Request Certification & Publishing Queue</h3>
                <p className="text-xs text-slate-500">
                  Approve recalls to immediately publish them to the public registry and run the Automated Customer Detection Engine.
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {recalls.map((r) => (
                  <div key={r.id} className="p-6 space-y-4 hover:bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          r.severity === 'critical' ? 'bg-red-50 text-red-700' :
                          r.severity === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.severity}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        r.status === 'approved_published' ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'submitted' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block font-medium">Manufacturer & Product:</span>
                        <span className="font-semibold text-slate-800">{r.company_name}</span> · {r.product_name} ({r.model})
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Affected Batches:</span>
                        <span className="font-mono text-slate-800">{r.affected_batch_numbers}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Remedy Offered:</span>
                        <span className="font-semibold text-blue-600 capitalize">{r.remedy_type}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong>Defect / Hazard Analysis:</strong> {r.hazard_reason}
                    </div>

                    {r.status === 'submitted' && (
                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          onClick={() => setRejectReasonModal({ type: 'recall', id: r.id })}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Decline Request
                        </button>
                        <button
                          onClick={() => handleApprovePublishRecall(r.id)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Publish Recall</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. SUPPORT STAFF MANAGEMENT TAB */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Safety Support Staff Accounts</h3>
                  <p className="text-xs text-slate-500">Authorized safety officers and defect verification specialists.</p>
                </div>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Staff Account</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3">Staff Member</th>
                      <th className="px-6 py-3">Staff Code</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Active Tickets</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {staff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-slate-400 text-[11px]">{s.email}</div>
                        </td>
                        <td className="px-6 py-4 font-mono">{s.staff_code}</td>
                        <td className="px-6 py-4">{s.department}</td>
                        <td className="px-6 py-4 font-mono">{s.open_complaints_count || 0}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStaff(s.id)}
                            className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                          >
                            {s.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. AUDIT LOGS TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tamper-Evident Audit Trails</h3>
                  <p className="text-xs text-slate-500">Chronological cryptographic logging of every administrative & security event.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCSV}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Audit CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Actor / Role</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Details</th>
                        <th className="px-4 py-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800">{log.user_role}</span>
                            <div className="text-slate-400 text-[10px] truncate max-w-[150px]">{log.user_email}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-600 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-sans text-xs max-w-md">
                            {log.details}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {log.ip_address}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* REJECTION REASON MODAL */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {rejectReasonModal.type === 'company' ? 'Decline Company Registration' : 'Decline Recall Request'}
            </h3>
            <p className="text-xs text-slate-500">
              Provide formal regulatory justification sent directly to the applicant.
            </p>
            <textarea
              required
              rows={3}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="State compliance grounds or technical missing parameters..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectReasonModal(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={rejectReasonModal.type === 'company' ? handleRejectCompany : handleRejectRecall}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Provision Support Staff Account</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Jason Burke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="jason@recallguard.gov"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={staffDept}
                  onChange={(e) => setStaffDept(e.target.value)}
                  placeholder="Hazardous Materials & Returns"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
