import React from 'react';
import { RecallRequest } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { X, AlertTriangle, ShieldCheck, Building2, Package, Tag, ArrowRight, Phone, Mail, FileText } from 'lucide-react';

interface RecallDetailsModalProps {
  recall: RecallRequest | null;
  onClose: () => void;
  onClaimRemedy?: (recall: RecallRequest) => void;
}

export const RecallDetailsModal: React.FC<RecallDetailsModalProps> = ({ recall, onClose, onClaimRemedy }) => {
  const { user, setActiveView, setAuthModal } = useAuth();
  if (!recall) return null;

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-red-700 bg-red-50 border border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border border-orange-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border border-amber-200';
      default: return 'text-blue-700 bg-blue-50 border border-blue-200';
    }
  };

  const handleClaim = () => {
    if (!user) {
      setAuthModal('login');
      return;
    }
    if (user.role === 'customer') {
      setActiveView('portal');
      onClose();
      onClaimRemedy?.(recall);
    } else {
      setActiveView('portal');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${getSeverityBadgeClass(recall.severity)}`}>
              {recall.severity} Severity
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Recall ID: #{recall.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {recall.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{recall.product_name}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Model: <span className="font-mono text-slate-700">{recall.model}</span></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>SKU: <span className="font-mono text-slate-700">{recall.sku}</span></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Manufacturer: <span className="text-blue-600 font-medium">{recall.company_name}</span></span>
            </div>
          </div>

          {/* Critical Hazard Callout */}
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200/80 space-y-2">
            <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Safety Hazard & Risk Analysis</span>
            </div>
            <p className="text-xs text-red-950 leading-relaxed">
              {recall.hazard_reason}
            </p>
          </div>

          {/* Scope & Affected Batches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Affected Batch Numbers
              </span>
              <p className="text-sm font-mono font-medium text-slate-900 break-words">
                {recall.affected_batch_numbers || 'All production lots'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Affected Serial Range
              </span>
              <p className="text-sm font-mono font-medium text-slate-900 break-words">
                {recall.affected_serial_range || 'All registered serial numbers in lot'}
              </p>
            </div>
          </div>

          {/* Remedy & Instructions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Consumer Action & Remedy Protocol
            </h3>
            
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900">
                  Manufacturer Remedy: <span className="capitalize font-bold text-blue-700">{recall.remedy_type?.replace('_', ' ')}</span>
                </span>
                <span className="text-[11px] text-blue-600 font-medium">100% Manufacturer Covered</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {recall.customer_instructions}
              </p>
            </div>
          </div>

          {/* Manufacturer Contact Info */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Contact: {recall.contact_details}</span>
            </div>
            <div className="text-slate-400">
              Published: {recall.published_at ? new Date(recall.published_at).toLocaleDateString() : 'Active'}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            ISO-10377 Consumer Safety Directive Notice
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleClaim}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{user?.role === 'customer' ? 'Initiate Return / Refund' : 'Sign In to Claim Remedy'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
