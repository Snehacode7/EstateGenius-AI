import React from 'react';
import { CompletedTransaction } from '../types';
import { X, CheckCircle2, ShieldCheck, Printer, History, FileText } from 'lucide-react';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: CompletedTransaction[];
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                PayPal Escrow Payment Ledger
              </h3>
              <p className="text-xs text-slate-300">
                Verified broker receipts and reservation transactions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-semibold text-slate-600">No transactions recorded yet</p>
              <p className="text-xs text-slate-400">
                Trigger a token deposit or installment plan via EstateMind AI or Property Showcase to populate your ledger.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {tx.transactionId}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {tx.propertyTitle} ({tx.propertyId})
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {tx.category === 'RENTAL_DEPOSIT' ? 'Booking / Token Deposit' : tx.category === 'EMI_INSTALLMENT' ? 'Monthly EMI Installment' : 'Rent Collection'} · {tx.date}
                    </div>
                    <div className="text-slate-500">
                      Payer: <span className="font-medium text-slate-700">{tx.payerName}</span> ({tx.paymentMethod})
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                    <div className="font-mono-tabular text-base font-extrabold text-emerald-600">
                      ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tx.currency}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> SETTLED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audited by PayPal Global Escrow Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
