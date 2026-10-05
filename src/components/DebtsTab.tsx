import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, HandCoins, Check, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import { AppData, DebtRecord, fmtMoney, saveData } from "../utils/storage";

interface Props {
  data: AppData;
  onDataChange: (d: AppData) => void;
  settleTarget: string | null;
  onSettleTargetHandled: () => void;
}

export default function DebtsTab({ data, onDataChange, settleTarget, onSettleTargetHandled }: Props) {
  const [tab, setTab] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");
  const [query, setQuery] = useState("");
  const [settle, setSettle] = useState<DebtRecord | null>(null);

  useEffect(() => {
    if (settleTarget) {
      const d = data.debts.find((x) => x.id === settleTarget);
      if (d) { setTab(d.type); setSettle(d); }
      onSettleTargetHandled();
    }
  }, [settleTarget, data.debts, onSettleTargetHandled]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return data.debts
      .filter((d) => d.type === tab)
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.notes.toLowerCase().includes(q));
  }, [data.debts, tab, query]);

  const outstanding = list.filter((d) => d.balance > 0);
  const settled = list.filter((d) => d.balance <= 0);
  const totalOutstanding = outstanding.reduce((a, d) => a + d.balance, 0);

  function recordPayment(debt: DebtRecord, amount: number, note: string) {
    if (amount <= 0) { toast.error("Enter a valid amount"); return; }
    const capped = Math.min(amount, debt.balance);
    const debts = data.debts.map((d) =>
      d.id === debt.id ? { ...d, paid: d.paid + capped, balance: Math.max(0, d.balance - capped), notes: note ? `${d.notes} | ${note}` : d.notes } : d
    );
    const next = { ...data, debts };
    saveData(next);
    onDataChange(next);
    setSettle(null);
    toast.success(capped >= debt.balance ? "Debt fully settled" : `Payment of ${fmtMoney(capped, data.settings.currency)} recorded`);
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Ledger tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("CUSTOMER")} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${tab === "CUSTOMER" ? "bg-rose-500 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          <User className="w-4 h-4" /> Receivables
        </button>
        <button onClick={() => setTab("SUPPLIER")} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${tab === "SUPPLIER" ? "bg-slate-700 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          <Building2 className="w-4 h-4" /> Payables
        </button>
      </div>

      {/* Outstanding summary */}
      <div className={`${tab === "CUSTOMER" ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"} rounded-2xl p-4 border`}>
        <p className="text-xs text-slate-500 font-medium">{tab === "CUSTOMER" ? "Customers owe you" : "You owe suppliers"}</p>
        <p className={`text-2xl font-bold font-mono ${tab === "CUSTOMER" ? "text-rose-600" : "text-slate-900"}`}>{fmtMoney(totalOutstanding, data.settings.currency)}</p>
        <p className="text-xs text-slate-500 mt-1">{outstanding.length} open &middot; {settled.length} settled</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or notes..." className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
        {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400" /></button>}
      </div>

      {outstanding.length === 0 && settled.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-10">No {tab === "CUSTOMER" ? "receivables" : "payables"} found</p>
      )}

      {/* Outstanding list */}
      <div className="space-y-2">
        {outstanding.map((d) => (
          <div key={d.id} className={`bg-white rounded-xl border p-3 shadow-sm ${tab === "CUSTOMER" ? "border-rose-100" : "border-slate-200/60"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{d.name}</p>
                <p className="text-xs text-slate-500 truncate">{d.notes}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref {d.saleRef} &middot; {d.date}</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className={`text-sm font-bold font-mono ${tab === "CUSTOMER" ? "text-rose-600" : "text-slate-900"}`}>{fmtMoney(d.balance, data.settings.currency)}</p>
                <p className="text-[10px] text-slate-400">of {fmtMoney(d.amount, data.settings.currency)}</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${tab === "CUSTOMER" ? "bg-rose-500" : "bg-slate-500"}`} style={{ width: `${(d.paid / d.amount) * 100}%` }} />
            </div>
            <button onClick={() => setSettle(d)} className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 min-h-[48px]">
              <HandCoins className="w-4 h-4" /> Record Payment
            </button>
          </div>
        ))}
      </div>

      {/* Settled list */}
      {settled.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-400 mb-2 px-1">SETTLED</p>
          <div className="space-y-1.5">
            {settled.map((d) => (
              <div key={d.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between opacity-70">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-600 truncate">{d.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{d.date}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><Check className="w-3.5 h-3.5" /> Paid</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settle modal */}
      <AnimatePresence>
        {settle && (
          <SettleModal debt={settle} currency={data.settings.currency} onClose={() => setSettle(null)} onSave={recordPayment} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SettleModal({ debt, currency, onClose, onSave }: { debt: DebtRecord; currency: string; onClose: () => void; onSave: (d: DebtRecord, amount: number, note: string) => void }) {
  const [amount, setAmount] = useState(String(debt.balance));
  const [note, setNote] = useState("");
  const input = "w-full px-3 py-3 rounded-lg border border-slate-200 text-sm";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-1">{debt.name}</p>
        <p className="text-xs text-slate-400 mb-4 font-mono">Balance owed: {fmtMoney(debt.balance, currency)}</p>
        <div className="mb-3">
          <label className="text-xs text-slate-500 font-medium block mb-1">Payment Amount ({currency})</label>
          <input type="number" className={input} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setAmount(String(debt.balance))} className="flex-1 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">Full Payment</button>
          <button onClick={() => setAmount(String(Math.round(debt.balance / 2)))} className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">Half</button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-500 font-medium block mb-1">Note (optional)</label>
          <input className={input} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button onClick={() => onSave(debt, parseFloat(amount) || 0, note)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold min-h-[52px]">Save Payment</button>
      </motion.div>
    </motion.div>
  );
}
