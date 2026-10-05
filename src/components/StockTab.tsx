import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, Pencil, Trash2, Package, ArrowLeft, Boxes } from "lucide-react";
import { toast } from "sonner";
import { AppData, Product, StockLog, StockLogType, AdjustmentReason, fmtMoney, genId, saveData } from "../utils/storage";

interface Props {
  data: AppData;
  onDataChange: (d: AppData) => void;
}

const CATEGORIES = ["Grocery", "Beverages", "Household", "Personal Care", "Stationery", "Dairy", "Snacks"];
const UNITS = ["pcs", "kg", "box", "bag", "tray", "bundle"];
const REASONS: { id: AdjustmentReason; label: string }[] = [
  { id: "damage", label: "Damage" },
  { id: "loss", label: "Loss" },
  { id: "internal", label: "Internal Use" },
  { id: "correction", label: "Correction" },
  { id: "return", label: "Return" },
];

const emptyProduct = (): Product => ({
  id: "", name: "", sku: "", barcode: "", category: "Grocery", costPrice: 0, sellingPrice: 0,
  stock: 0, minAlert: 5, unit: "pcs", supplier: "", createdAt: new Date().toISOString().split("T")[0],
});

export default function StockTab({ data, onDataChange }: Props) {
  const [view, setView] = useState<"list" | "logs">("list");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStockIn, setShowStockIn] = useState<Product | null>(null);
  const [showAdjust, setShowAdjust] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const filters = ["All", "In Stock", "Low Stock", "Out of Stock"];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.products.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      let matchF = true;
      if (filter === "In Stock") matchF = p.stock > p.minAlert;
      if (filter === "Low Stock") matchF = p.stock > 0 && p.stock <= p.minAlert;
      if (filter === "Out of Stock") matchF = p.stock <= 0;
      return matchQ && matchF;
    });
  }, [data.products, query, filter]);

  function saveProduct(p: Product) {
    if (!p.name.trim()) { toast.error("Name required"); return; }
    const products = p.id
      ? data.products.map((x) => (x.id === p.id ? p : x))
      : [...data.products, { ...p, id: genId() }];
    const next = { ...data, products };
    saveData(next);
    onDataChange(next);
    setShowForm(false);
    setEditing(null);
    toast.success(p.id ? "Product updated" : "Product added");
  }

  function deleteProduct(p: Product) {
    const products = data.products.filter((x) => x.id !== p.id);
    const next = { ...data, products };
    saveData(next);
    onDataChange(next);
    setConfirmDelete(null);
    toast.success("Product deleted");
  }

  function recordStockIn(p: Product, qty: number, cost: number, note: string) {
    if (qty <= 0) { toast.error("Quantity must be positive"); return; }
    const products = data.products.map((x) => (x.id === p.id ? { ...x, stock: x.stock + qty } : x));
    const log: StockLog = { id: genId(), productId: p.id, productName: p.name, type: "IN", qty, reason: "Purchase", note, date: new Date().toISOString().split("T")[0], cost };
    const next = { ...data, products, stockLogs: [log, ...data.stockLogs] };
    saveData(next);
    onDataChange(next);
    setShowStockIn(null);
    toast.success(`Added ${qty} to stock`);
  }

  function recordAdjust(p: Product, qty: number, reason: string, note: string) {
    const products = data.products.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, x.stock + qty) } : x));
    const log: StockLog = { id: genId(), productId: p.id, productName: p.name, type: "ADJUST" as StockLogType, qty, reason, note, date: new Date().toISOString().split("T")[0], cost: 0 };
    const next = { ...data, products, stockLogs: [log, ...data.stockLogs] };
    saveData(next);
    onDataChange(next);
    setShowAdjust(null);
    toast.success("Adjustment recorded");
  }

  return (
    <div className="space-y-3 pb-4">
      {/* View toggle */}
      <div className="flex gap-2">
        <button onClick={() => setView("list")} className={`flex-1 py-3 rounded-xl text-sm font-bold ${view === "list" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          Inventory
        </button>
        <button onClick={() => setView("logs")} className={`flex-1 py-3 rounded-xl text-sm font-bold ${view === "logs" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          Movement Log
        </button>
      </div>

      {view === "logs" ? (
        <div className="space-y-2">
          {data.stockLogs.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No stock movements yet</p>}
          {data.stockLogs.map((l) => (
            <div key={l.id} className="bg-white rounded-xl border border-slate-200/60 p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${l.type === "IN" ? "bg-emerald-100 text-emerald-600" : l.type === "OUT" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
                <Boxes className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{l.productName}</p>
                <p className="text-xs text-slate-500">{l.reason} &middot; {l.date}</p>
              </div>
              <span className={`text-sm font-bold font-mono ${l.qty > 0 ? "text-emerald-600" : "text-rose-600"}`}>{l.qty > 0 ? "+" : ""}{l.qty}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Search + add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-3 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <button onClick={() => { setEditing(emptyProduct()); setShowForm(true); }} className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Product list */}
          <div className="space-y-2">
            {filtered.map((p) => {
              const status = p.stock <= 0 ? "out" : p.stock <= p.minAlert ? "low" : "in";
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.sku} &middot; {p.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${status === "in" ? "bg-emerald-100 text-emerald-700" : status === "low" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                      {p.stock} {p.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="text-xs text-slate-500">Sell {fmtMoney(p.sellingPrice, data.settings.currency)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setShowStockIn(p)} className="px-2.5 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">Stock IN</button>
                      <button onClick={() => setShowAdjust(p)} className="px-2.5 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">Adjust</button>
                      <button onClick={() => { setEditing(p); setShowForm(true); }} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                      <button onClick={() => setConfirmDelete(p)} className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Product form modal */}
      <AnimatePresence>
        {showForm && editing && (
          <Modal onClose={() => { setShowForm(false); setEditing(null); }} title={editing.id ? "Edit Product" : "Add Product"}>
            <ProductForm initial={editing} onSave={saveProduct} currency={data.settings.currency} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Stock IN modal */}
      <AnimatePresence>
        {showStockIn && (
          <StockInModal product={showStockIn} currency={data.settings.currency} onClose={() => setShowStockIn(null)} onSave={recordStockIn} />
        )}
      </AnimatePresence>

      {/* Adjust modal */}
      <AnimatePresence>
        {showAdjust && (
          <AdjustModal product={showAdjust} onClose={() => setShowAdjust(null)} onSave={recordAdjust} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(null)} title="Delete Product">
            <p className="text-sm text-slate-600 mb-4">Delete <b>{confirmDelete.name}</b>? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
              <button onClick={() => deleteProduct(confirmDelete)} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-semibold">Delete</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="text-xs text-slate-500 font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function ProductForm({ initial, onSave, currency }: { initial: Product; onSave: (p: Product) => void; currency: string }) {
  const [p, setP] = useState<Product>(initial);
  const set = (k: keyof Product, v: string | number) => setP((prev) => ({ ...prev, [k]: v }));
  const input = "w-full px-3 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
  return (
    <div>
      <Field label="Name"><input className={input} value={p.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU"><input className={input} value={p.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="Barcode"><input className={input} value={p.barcode} onChange={(e) => set("barcode", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select className={input} value={p.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Unit">
          <select className={input} value={p.unit} onChange={(e) => set("unit", e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Cost (${currency})`}><input type="number" className={input} value={p.costPrice || ""} onChange={(e) => set("costPrice", parseFloat(e.target.value) || 0)} /></Field>
        <Field label={`Sell (${currency})`}><input type="number" className={input} value={p.sellingPrice || ""} onChange={(e) => set("sellingPrice", parseFloat(e.target.value) || 0)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock"><input type="number" className={input} value={p.stock || ""} onChange={(e) => set("stock", parseInt(e.target.value) || 0)} /></Field>
        <Field label="Min Alert"><input type="number" className={input} value={p.minAlert || ""} onChange={(e) => set("minAlert", parseInt(e.target.value) || 0)} /></Field>
      </div>
      <Field label="Supplier"><input className={input} value={p.supplier} onChange={(e) => set("supplier", e.target.value)} /></Field>
      <button onClick={() => onSave(p)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold mt-2 min-h-[52px]">Save Product</button>
    </div>
  );
}

function StockInModal({ product, currency, onClose, onSave }: { product: Product; currency: string; onClose: () => void; onSave: (p: Product, qty: number, cost: number, note: string) => void }) {
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const input = "w-full px-3 py-3 rounded-lg border border-slate-200 text-sm";
  return (
    <Modal onClose={onClose} title="Stock IN">
      <p className="text-sm text-slate-600 mb-3">{product.name} &middot; current {product.stock} {product.unit}</p>
      <Field label="Quantity"><input type="number" className={input} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label={`Total Cost (${currency})`}><input type="number" className={input} value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
      <Field label="Note"><input className={input} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button onClick={() => onSave(product, parseInt(qty) || 0, parseFloat(cost) || 0, note)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold min-h-[52px]">Record Stock IN</button>
    </Modal>
  );
}

function AdjustModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product, qty: number, reason: string, note: string) => void }) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("damage");
  const [note, setNote] = useState("");
  const input = "w-full px-3 py-3 rounded-lg border border-slate-200 text-sm";
  return (
    <Modal onClose={onClose} title="Stock Adjustment">
      <p className="text-sm text-slate-600 mb-3">{product.name} &middot; current {product.stock} {product.unit}</p>
      <Field label="Quantity (negative to reduce)"><input type="number" className={input} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label="Reason">
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button key={r.id} onClick={() => setReason(r.id)} className={`px-3 py-2 rounded-lg text-xs font-semibold ${reason === r.id ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>{r.label}</button>
          ))}
        </div>
      </Field>
      <Field label="Note"><input className={input} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button onClick={() => onSave(product, parseInt(qty) || 0, reason, note)} className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold min-h-[52px]">Record Adjustment</button>
    </Modal>
  );
}
