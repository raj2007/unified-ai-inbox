import React from 'react';
import { Send, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

interface ConfirmSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipient: string;
  subject: string;
  bodyPreview: string;
  isSending: boolean;
  accountName: string;
}

export const ConfirmSendModal: React.FC<ConfirmSendModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recipient,
  subject,
  bodyPreview,
  isSending,
  accountName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 md:p-5 border-b border-slate-200 bg-amber-50/70 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Confirm Email Dispatch
            </h3>
            <p className="text-xs text-amber-800">
              Explicit permission required before transmitting from your live mailbox.
            </p>
          </div>
        </div>

        <div className="p-5 space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">From Account:</span>
              <span className="font-bold text-slate-900">{accountName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">To Recipient:</span>
              <span className="font-bold text-blue-600">{recipient}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Subject:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                {subject}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Body Message Preview:
            </label>
            <div className="p-3 bg-white border border-slate-200 rounded-xl max-h-36 overflow-y-auto text-slate-800 whitespace-pre-line text-xs leading-relaxed font-sans shadow-inner">
              {bodyPreview}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>This will send this real email from your authenticated Gmail address.</span>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-xl text-xs hover:bg-slate-200/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending via Gmail API...' : 'Confirm & Send Email'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
