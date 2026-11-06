import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Complaint } from '../../types.ts';
import {
  Headphones, MessageSquare, AlertTriangle, CheckCircle2,
  RefreshCw, Send, ChevronRight, User, ShieldAlert
} from 'lucide-react';

export const SupportPortal: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await api.getSupportDashboard();
      setDashboardStats(stats);
      const res = await api.getSupportComplaints();
      setComplaints(res.complaints || []);
      if (res.complaints?.length > 0 && !selectedComplaint) {
        selectComplaint(res.complaints[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectComplaint = async (c: Complaint) => {
    setSelectedComplaint(c);
    setResolutionNote(c.resolution_note || '');
    try {
      const res = await api.getComplaintMessages(c.id);
      setThreadMessages(res.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedComplaint) return;
    try {
      await api.sendComplaintMessage(selectedComplaint.id, replyText);
      setReplyText('');
      const res = await api.getComplaintMessages(selectedComplaint.id);
      setThreadMessages(res.messages || []);
      setToastMessage('Response transmitted to consumer.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedComplaint) return;
    try {
      await api.updateComplaintStatus(selectedComplaint.id, {
        status,
        note: resolutionNote,
      });
      setToastMessage(`Incident #${selectedComplaint.id} marked as ${status}.`);
      loadData();
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
            <Headphones className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-400">Safety Staff Operations</div>
          </div>
        </div>

        <div className="p-4 space-y-3 flex-1">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Open Safety Incidents</span>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {dashboardStats?.openCases || 0}
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Critical Priority Cases</span>
            <div className="text-2xl font-bold text-red-400 font-mono tabular-nums">
              {dashboardStats?.criticalComplaints || 0}
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Resolved & Closed</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              {dashboardStats?.resolvedCases || 0}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div>Authorized Staff: <span className="text-slate-300">{user?.name}</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">{user?.email}</div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">
            Support Staff / <span className="text-blue-600">Incident Investigations</span>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-4 cursor-pointer">×</button>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">
          
          {/* Complaints List Column (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[750px]">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Assigned Queue ({complaints.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {complaints.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectComplaint(c)}
                  className={`w-full p-4 text-left transition-colors cursor-pointer flex flex-col gap-1.5 ${
                    selectedComplaint?.id === c.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      c.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      c.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.priority}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">#{c.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{c.subject}</h4>
                  <div className="text-[11px] text-slate-500 truncate">
                    {c.customer_name} · {c.product_name || 'General Product'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono capitalize">
                    Status: {c.status.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Incident Detail & Messaging Column (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[750px]">
            {selectedComplaint ? (
              <div className="flex flex-col h-full">
                
                {/* Detail Header */}
                <div className="p-5 border-b border-slate-200 space-y-3 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 font-mono">Incident #{selectedComplaint.id}</div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedComplaint.subject}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                      selectedComplaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedComplaint.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-medium">Consumer Contact:</span>
                      <span className="font-semibold text-slate-900">{selectedComplaint.customer_name}</span>
                      <div className="text-slate-500 text-[11px]">{selectedComplaint.customer_email} · {selectedComplaint.customer_phone}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Product / Manufacturer:</span>
                      <span className="font-semibold text-slate-900">{selectedComplaint.product_name || 'N/A'}</span>
                      <div className="text-slate-500 text-[11px]">{selectedComplaint.company_name}</div>
                    </div>
                  </div>

                  {/* Actions / Status Transition Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <button
                      onClick={() => handleUpdateStatus('under_investigation')}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-md border border-amber-200 cursor-pointer"
                    >
                      Mark Under Investigation
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-md border border-emerald-200 cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('closed')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md cursor-pointer"
                    >
                      Close Incident
                    </button>
                  </div>
                </div>

                {/* Message Conversation Stream */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-white">
                  {threadMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl max-w-[85%] text-xs ${
                        msg.sender_role === 'support_staff'
                          ? 'ml-auto bg-blue-600 text-white'
                          : 'mr-auto bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="text-[10px] font-semibold opacity-75 mb-1">
                        {msg.sender_name} ({msg.sender_role.replace('_', ' ')}) · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official reply or safety instructions to consumer..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs my-auto">
                Select an incident from the queue to view thread and send instructions.
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
};
