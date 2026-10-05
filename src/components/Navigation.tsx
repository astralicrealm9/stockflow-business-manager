import { motion } from "framer-motion";
import { House, ShoppingCart, Package, HandCoins, ChartColumn, Settings } from "lucide-react";
import { AppData } from "../utils/storage";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  data: AppData;
}

const tabs = [
  { id: "home", label: "Home", Icon: House },
  { id: "sell", label: "Sell", Icon: ShoppingCart },
  { id: "stock", label: "Stock", Icon: Package },
  { id: "debts", label: "Debts", Icon: HandCoins },
  { id: "reports", label: "Reports", Icon: ChartColumn },
];

export default function Navigation({ activeTab, onTabChange, data }: Props) {
  const lowStockCount = data.products.filter((p) => p.stock <= p.minAlert).length;
  const debtCount = data.debts.filter((d) => d.balance > 0 && d.type === "CUSTOMER").length;

  const badges: Record<string, number> = { stock: lowStockCount, debts: debtCount };

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{data.settings.shopName}</h1>
            <p className="text-xs text-slate-500">{data.settings.currency} &middot; Offline</p>
          </div>
          <button
            onClick={() => onTabChange("settings")}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/80 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around px-1">
          {tabs.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            const badge = badges[id] ?? 0;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-2 px-2 rounded-xl transition-colors"
                aria-label={label}
              >
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                </motion.div>
                <span className={`text-[10px] mt-0.5 font-medium ${active ? "text-emerald-600" : "text-slate-400"}`}>
                  {label}
                </span>
                {badge > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
