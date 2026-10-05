import { motion } from "framer-motion";
import { TrendingUp, Banknote, ShoppingCart, Package, TriangleAlert, HandCoins, Plus, Receipt } from "lucide-react";
import { AppData, fmtMoney } from "../utils/storage";

interface Props {
  data: AppData;
  onNavigate: (tab: string) => void;
  onSettleDebt: (debtId: string) => void;
}

export default function DashboardTab({ data, onNavigate, onSettleDebt }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const todaySales = data.sales.filter((s) => s.date === today);
  const totalSales = todaySales.reduce((a, s) => a + s.total, 0);
  const totalProfit = todaySales.reduce((a, s) => a + s.profit, 0);
  const totalExpenses = data.stockLogs
    .filter((l) => l.type === "IN" && l.date === today)
    .reduce((a, l) => a + l.cost, 0);
  const cashInHand = data.sales
    .filter((s) => s.paymentMethod === "cash")
    .reduce((a, s) => a + s.amountPaid, 0) - totalExpenses;

  const lowStock = data.products.filter((p) => p.stock <= p.minAlert && p.stock > 0);
  const outOfStock = data.products.filter((p) => p.stock <= 0);
  const pendingDebts = data.debts.filter((d) => d.balance > 0 && d.type === "CUSTOMER");

  const kpis = [
    { label: "Sales Today", value: fmtMoney(totalSales, data.settings.currency), color: "text-slate-900", bg: "bg-white", Icon: Receipt },
    { label: "Profit", value: fmtMoney(totalProfit, data.settings.currency), color: "text-emerald-600", bg: "bg-emerald-50", Icon: TrendingUp },
    { label: "Expenses", value: fmtMoney(totalExpenses, data.settings.currency), color: "text-amber-600", bg: "bg-amber-50", Icon: Banknote },
    { label: "Cash in Hand", value: fmtMoney(cashInHand, data.settings.currency), color: "text-slate-900", bg: "bg-white", Icon: HandCoins },
  ];

  const actions = [
    { label: "SELL", tab: "sell", color: "bg-emerald-600 text-white", Icon: ShoppingCart },
    { label: "ADD STOCK", tab: "stock", color: "bg-blue-600 text-white", Icon: Package },
    { label: "DEBTS", tab: "debts", color: "bg-rose-500 text-white", Icon: HandCoins },
    { label: "REPORTS", tab: "reports", color: "bg-slate-700 text-white", Icon: TrendingUp },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 pb-4"
    >
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(({ label, value, color, bg, Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-slate-200/60 shadow-sm`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500 font-medium">{label}</span>
            </div>
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ label, tab, color, Icon }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate(tab)}
            className={`${color} rounded-2xl p-4 flex items-center gap-3 min-h-[56px] shadow-sm`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">Stock Alerts</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {outOfStock.slice(0, 2).map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-rose-600 font-semibold">OUT OF STOCK</p>
                </div>
                <button
                  onClick={() => onNavigate("stock")}
                  className="px-3 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg min-h-[36px]"
                >
                  <Plus className="w-3 h-3 inline mr-1" />Restock
                </button>
              </div>
            ))}
            {lowStock.slice(0, 3).map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-amber-600">{p.stock} {p.unit} left (min: {p.minAlert})</p>
                </div>
                <button
                  onClick={() => onNavigate("stock")}
                  className="px-3 py-2 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg min-h-[36px]"
                >
                  <Plus className="w-3 h-3 inline mr-1" />Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Debts */}
      {pendingDebts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-slate-900">Unpaid Debts</h3>
            </div>
            <span className="text-xs font-mono text-rose-600 font-bold">
              {fmtMoney(pendingDebts.reduce((a, d) => a + d.balance, 0), data.settings.currency)}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingDebts.slice(0, 3).map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.name}</p>
                  <p className="text-xs text-slate-500">Owes {fmtMoney(d.balance, data.settings.currency)}</p>
                </div>
                <button
                  onClick={() => onSettleDebt(d.id)}
                  className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg min-h-[36px]"
                >
                  Settle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
