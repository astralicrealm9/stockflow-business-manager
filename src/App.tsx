import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { ShoppingCart, Package, ChartColumn } from "lucide-react";
import { AppData, loadData, saveData } from "./utils/storage";
import Navigation from "./components/Navigation";
import DashboardTab from "./components/DashboardTab";
import SellTab from "./components/SellTab";
import StockTab from "./components/StockTab";
import DebtsTab from "./components/DebtsTab";
import ReportsSettingsTab from "./components/ReportsSettingsTab";

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [activeTab, setActiveTab] = useState("home");
  const [settleTarget, setSettleTarget] = useState<string | null>(null);

  // Keep in sync with cross-component localStorage writes
  useEffect(() => {
    const handler = () => setData(loadData());
    window.addEventListener("stockflow-updated", handler);
    return () => window.removeEventListener("stockflow-updated", handler);
  }, []);

  const onDataChange = useCallback((d: AppData) => {
    saveData(d);
    setData(d);
  }, []);

  const onNavigate = useCallback((tab: string) => setActiveTab(tab), []);

  const onSettleDebt = useCallback((debtId: string) => {
    setSettleTarget(debtId);
    setActiveTab("debts");
  }, []);

  const clearSettleTarget = useCallback(() => setSettleTarget(null), []);

  const simpleMode = data.settings.simpleMode;

  const renderTab = () => {
    switch (activeTab) {
      case "home": return <DashboardTab data={data} onNavigate={onNavigate} onSettleDebt={onSettleDebt} />;
      case "sell": return <SellTab data={data} onDataChange={onDataChange} />;
      case "stock": return <StockTab data={data} onDataChange={onDataChange} />;
      case "debts": return <DebtsTab data={data} onDataChange={onDataChange} settleTarget={settleTarget} onSettleTargetHandled={clearSettleTarget} />;
      case "reports": return <ReportsSettingsTab data={data} onDataChange={onDataChange} />;
      case "settings": return <ReportsSettingsTab data={data} onDataChange={onDataChange} />;
      default: return <DashboardTab data={data} onNavigate={onNavigate} onSettleDebt={onSettleDebt} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Desktop preview frame */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative shadow-xl sm:my-6 sm:rounded-[2rem] sm:min-h-[calc(100vh-3rem)] sm:border sm:border-slate-200 overflow-hidden">
        <Toaster position="top-center" richColors />

        {simpleMode ? (
          <SimpleMode shopName={data.settings.shopName} onNavigate={onNavigate} />
        ) : (
          <>
            <Navigation activeTab={activeTab} onTabChange={onNavigate} data={data} />
            <main className="pt-16 pb-24 px-4 min-h-screen">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}
      </div>
    </div>
  );
}

function SimpleMode({ shopName, onNavigate }: { shopName: string; onNavigate: (t: string) => void }) {
  const buttons = [
    { label: "SELL", tab: "sell", color: "bg-emerald-600", Icon: ShoppingCart },
    { label: "ADD STOCK", tab: "stock", color: "bg-blue-600", Icon: Package },
    { label: "REPORTS", tab: "reports", color: "bg-slate-700", Icon: ChartColumn },
  ];
  return (
    <div className="min-h-screen flex flex-col p-6 bg-slate-50">
      <h1 className="text-2xl font-bold text-slate-900 text-center mt-8 mb-2">{shopName}</h1>
      <p className="text-sm text-slate-500 text-center mb-10">Simple Mode</p>
      <div className="flex-1 flex flex-col gap-6">
        {buttons.map(({ label, tab, color, Icon }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(tab)}
            className={`${color} text-white flex-1 rounded-3xl flex flex-col items-center justify-center gap-4 min-h-[140px] shadow-lg`}
          >
            <Icon className="w-12 h-12" />
            <span className="text-2xl font-bold tracking-wide">{label}</span>
          </motion.button>
        ))}
      </div>
      <button onClick={() => onNavigate("home")} className="mt-6 py-4 text-slate-500 font-semibold text-sm">
        Exit Simple Mode in Settings
      </button>
    </div>
  );
}
