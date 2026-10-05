import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Upload, TrendingUp, Receipt, CreditCard, Banknote, Smartphone, User } from "lucide-react";
import { toast } from "sonner";
import { AppData, BusinessSettings, PaymentMethod, fmtMoney, saveData, exportJSON, importJSON } from "../utils/storage";

interface Props {
  data: AppData;
  onDataChange: (d: AppData) => void;
}

type DateRange = "today" | "week" | "month" | "all";

const CURRENCIES = ["$", "€", "£", "₦", "KSh", "₹", "R"];

const payLabels: Record<PaymentMethod, { label: string; color: string }> = {
  cash: { label: "Cash", color: "bg-emerald-500" },
  card: { label: "Card", color: "bg-blue-500" },
  mobile: { label: "Mobile", color: "bg-violet-500" },
  credit: { label: "Credit", color: "bg-rose-500" },
};

function inRange(dateStr: string, range: DateRange): boolean {
  if (range === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  if (range === "today") return dateStr === todayStr;
  if (range === "week") return (now.getTime() - d.getTime()) / 86400000 <= 7;
  if (range === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
}

export default function ReportsSettingsTab({ data, onDataChange }: Props) {
  const [view, setView] = useState<"reports" | "settings">("reports");
  const [range, setRange] = useState<DateRange>("week");
  const [settings, setSettings] = useState<BusinessSettings>(data.settings);
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("replace");
  const fileRef = useRef<HTMLInputElement>(null);

  const sales = useMemo(() => data.sales.filter((s) => inRange(s.date, range)), [data.sales, range]);
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const totalProfit = sales.reduce((a, s) => a + s.profit, 0);
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // revenue vs profit by day
  const byDay = useMemo(() => {
    const map = new Map<string, { revenue: number; profit: number }>();
    sales.forEach((s) => {
      const cur = map.get(s.date) || { revenue: 0, profit: 0 };
      cur.revenue += s.total;
      cur.profit += s.profit;
      map.set(s.date, cur);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
  }, [sales]);
  const maxRev = Math.max(1, ...byDay.map(([, v]) => v.revenue));

  // payment breakdown
  const payBreakdown = useMemo(() => {
    const map = new Map<PaymentMethod, number>();
    sales.forEach((s) => map.set(s.paymentMethod, (map.get(s.paymentMethod) || 0) + s.total));
    return Array.from(map.entries());
  }, [sales]);

  // top 5 by profit
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; qty: number }>();
    sales.forEach((s) => s.items.forEach((i) => {
      const cur = map.get(i.productId) || { name: i.name, profit: 0, qty: 0 };
      cur.profit += (i.unitPrice - i.unitCost) * i.qty;
      cur.qty += i.qty;
      map.set(i.productId, cur);
    }));
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit).slice(0, 5);
  }, [sales]);
  const maxProfit = Math.max(1, ...topProducts.map((p) => p.profit));

  function saveSettings() {
    const next = { ...data, settings };
    saveData(next);
    onDataChange(next);
    toast.success("Settings saved");
  }

  function download() {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stockflow-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importJSON(String(reader.result), restoreMode);
        onDataChange(next);
        toast.success(`Restored (${restoreMode})`);
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  if (view === "settings") {
    const input = "w-full px-3 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
    return (
      <div className="space-y-4 pb-4">
        <div className="flex gap-2">
          <button onClick={() => setView("reports")} className="flex-1 py-3 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200">Reports</button>
          <button onClick={() => setView("settings")} className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white">Settings</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Business Profile</h3>
          <div>
            <label className="text-xs text-slate-500 font-medium">Shop Name</label>
            <input className={input} value={settings.shopName} onChange={(e) => setSettings({ ...settings, shopName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Phone</label>
            <input className={input} value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-2">Currency</label>
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <button key={c} onClick={() => setSettings({ ...settings, currency: c })} className={`px-4 py-2.5 rounded-lg text-sm font-bold min-w-[48px] ${settings.currency === c ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{c}</button>
              ))}
            </div>
          </div>
          <button onClick={saveSettings} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold min-h-[52px]">Save Settings</button>
        </div>

        {/* Simple mode */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Simple Mode</p>
            <p className="text-xs text-slate-500">3 giant touch buttons only</p>
          </div>
          <button
            onClick={() => { const s = { ...settings, simpleMode: !settings.simpleMode }; setSettings(s); saveData({ ...data, settings: s }); onDataChange({ ...data, settings: s }); }}
            className={`w-14 h-8 rounded-full transition-colors relative ${settings.simpleMode ? "bg-emerald-600" : "bg-slate-300"}`}
          >
            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${settings.simpleMode ? "left-7" : "left-1"}`} />
          </button>
        </div>

        {/* Backup/Restore */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Backup & Restore</h3>
          <button onClick={download} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 min-h-[48px]">
            <Download className="w-4 h-4" /> Download JSON Backup
          </button>
          <div className="flex gap-2">
            <button onClick={() => setRestoreMode("replace")} className={`flex-1 py-2 rounded-lg text-xs font-bold ${restoreMode === "replace" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"}`}>Replace</button>
            <button onClick={() => setRestoreMode("merge")} className={`flex-1 py-2 rounded-lg text-xs font-bold ${restoreMode === "merge" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>Merge</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" onChange={onFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="w-full py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 min-h-[48px]">
            <Upload className="w-4 h-4" /> Restore from File
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-4">
      <div className="flex gap-2">
        <button onClick={() => setView("reports")} className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white">Reports</button>
        <button onClick={() => setView("settings")} className="flex-1 py-3 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200">Settings</button>
      </div>

      {/* Date range */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["today", "week", "month", "all"] as DateRange[]).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap capitalize ${range === r ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>{r === "all" ? "All Time" : `This ${r}`}</button>
        ))}
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <p className="text-[10px] text-slate-500 font-medium">Revenue</p>
          <p className="text-sm font-bold font-mono text-slate-900">{fmtMoney(totalRevenue, data.settings.currency)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3">
          <p className="text-[10px] text-emerald-600 font-medium">Profit</p>
          <p className="text-sm font-bold font-mono text-emerald-700">{fmtMoney(totalProfit, data.settings.currency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <p className="text-[10px] text-slate-500 font-medium">Margin</p>
          <p className="text-sm font-bold font-mono text-slate-900">{margin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Revenue vs profit chart */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Revenue vs Profit</h3>
        {byDay.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No sales in this period</p>
        ) : (
          <div className="flex items-end justify-between gap-2 h-32">
            {byDay.map(([date, v]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-24">
                  <div className="w-1/2 bg-slate-200 rounded-t" style={{ height: `${(v.revenue / maxRev) * 100}%` }} />
                  <div className="w-1/2 bg-emerald-500 rounded-t" style={{ height: `${(v.profit / maxRev) * 100}%` }} />
                </div>
                <span className="text-[9px] text-slate-400 font-mono">{date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4 mt-3 justify-center">
          <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 bg-slate-200 rounded" /> Revenue</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Profit</span>
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-blue-600" /> Payment Methods</h3>
        {payBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No data</p>
        ) : (
          <div className="space-y-2">
            {payBreakdown.map(([m, amt]) => (
              <div key={m} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${payLabels[m].color}`} />
                <span className="text-xs text-slate-600 w-16">{payLabels[m].label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${payLabels[m].color}`} style={{ width: `${(amt / totalRevenue) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-slate-700 w-16 text-right">{fmtMoney(amt, data.settings.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 5 products */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Top 5 by Profit</h3>
        {topProducts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No data</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.profit / maxProfit) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 shrink-0">{fmtMoney(p.profit, data.settings.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
