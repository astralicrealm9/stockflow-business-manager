import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Plus, Minus, ShoppingCart, Banknote, CreditCard, Smartphone, User, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppData, Product, SaleItem, SaleTransaction, DebtRecord, PaymentMethod, fmtMoney, genId, saveData } from "../utils/storage";

interface Props {
  data: AppData;
  onDataChange: (d: AppData) => void;
}

const paymentOptions: { id: PaymentMethod; label: string; Icon: typeof Banknote }[] = [
  { id: "cash", label: "Cash", Icon: Banknote },
  { id: "card", label: "Card", Icon: CreditCard },
  { id: "mobile", label: "Mobile", Icon: Smartphone },
  { id: "credit", label: "Credit", Icon: User },
];

export default function SellTab({ data, onDataChange }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [customer, setCustomer] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [receipt, setReceipt] = useState<SaleTransaction | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(data.products.map((p) => p.category)))], [data.products]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.products.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
      return matchCat && matchQ;
    });
  }, [data.products, query, category]);

  const subtotal = cart.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const total = Math.max(0, subtotal - discount + tax);
  const cartCount = cart.reduce((a, i) => a + i.qty, 0);

  function addToCart(p: Product) {
    if (p.stock <= 0) {
      toast.error(`${p.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.qty >= p.stock) {
          toast.error(`Only ${p.stock} in stock`);
          return prev;
        }
        return prev.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { productId: p.id, name: p.name, qty: 1, unitPrice: p.sellingPrice, unitCost: p.costPrice }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const prod = data.products.find((p) => p.id === productId);
          const newQty = i.qty + delta;
          if (newQty <= 0) return i;
          if (prod && newQty > prod.stock) {
            toast.error(`Only ${prod.stock} in stock`);
            return i;
          }
          return { ...i, qty: newQty };
        })
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  function completeSale() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (payment === "credit" && !customer.trim()) {
      toast.error("Customer name required for credit");
      return;
    }
    const paid = payment === "credit" ? (parseFloat(amountPaid) || 0) : total;
    const balance = Math.max(0, total - paid);
    if (payment !== "credit" && paid < total && amountPaid !== "") {
      toast.error("Amount paid is less than total");
      return;
    }
    const profit = cart.reduce((a, i) => a + (i.unitPrice - i.unitCost) * i.qty, 0) - discount;
    const sale: SaleTransaction = {
      id: genId(),
      items: [...cart],
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: payment,
      customerName: customer.trim(),
      date: new Date().toISOString().split("T")[0],
      profit,
      amountPaid: paid,
      balance,
    };

    // decrement stock
    const products = data.products.map((p) => {
      const item = cart.find((i) => i.productId === p.id);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    });

    const sales = [sale, ...data.sales];
    let debts = data.debts;
    if (balance > 0) {
      const debt: DebtRecord = {
        id: genId(),
        type: "CUSTOMER",
        name: customer.trim() || "Unknown",
        amount: total,
        paid,
        balance,
        saleRef: sale.id,
        date: sale.date,
        notes: "Credit sale balance",
      };
      debts = [debt, ...debts];
    }

    const next: AppData = { ...data, products, sales, debts };
    saveData(next);
    onDataChange(next);
    setReceipt(sale);
    setCart([]);
    setDiscount(0);
    setTax(0);
    setCustomer("");
    setAmountPaid("");
    setPayment("cash");
    setShowCart(false);
    toast.success("Sale recorded");
  }

  return (
    <div className="space-y-3 pb-24">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, SKU, barcode..."
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap min-h-[40px] transition-colors ${
              category === c ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((p) => {
          const out = p.stock <= 0;
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => addToCart(p)}
              disabled={out}
              className={`bg-white rounded-xl border border-slate-200/60 p-3 text-left shadow-sm ${out ? "opacity-50" : ""}`}
            >
              <p className="text-sm font-semibold text-slate-900 line-clamp-1">{p.name}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-emerald-600 font-mono">{fmtMoney(p.sellingPrice, data.settings.currency)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${out ? "bg-rose-100 text-rose-600" : p.stock <= p.minAlert ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                  {p.stock} {p.unit}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <motion.button
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 min-h-[48px]"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-bold">{cartCount} items</span>
          <span className="font-mono text-sm">{fmtMoney(total, data.settings.currency)}</span>
        </motion.button>
      )}

      {/* Cart drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto p-5"
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 mb-4">Cart</h2>

              <div className="space-y-3 mb-4">
                {cart.map((i) => (
                  <div key={i.productId} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{i.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{fmtMoney(i.unitPrice, data.settings.currency)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(i.productId, -1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-sm">{i.qty}</span>
                      <button onClick={() => updateQty(i.productId, 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeItem(i.productId)} className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount & Tax */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Discount</label>
                  <input
                    type="number"
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Tax</label>
                  <input
                    type="number"
                    value={tax || ""}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Payment method */}
              <div className="mb-4">
                <label className="text-xs text-slate-500 font-medium mb-2 block">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {paymentOptions.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPayment(id)}
                      className={`py-3 rounded-xl flex flex-col items-center gap-1 min-h-[64px] ${
                        payment === id ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer + amount */}
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Customer name (optional)"
                className="w-full px-3 py-3 rounded-lg border border-slate-200 text-sm mb-3"
              />
              {payment === "credit" && (
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`Amount paid (balance becomes debt)`}
                  className="w-full px-3 py-3 rounded-lg border border-slate-200 text-sm font-mono mb-3"
                />
              )}

              {/* Totals */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-1">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span><span className="font-mono">{fmtMoney(subtotal, data.settings.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount</span><span className="font-mono">-{fmtMoney(discount, data.settings.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax</span><span className="font-mono">{fmtMoney(tax, data.settings.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span><span className="font-mono text-emerald-600">{fmtMoney(total, data.settings.currency)}</span>
                </div>
              </div>

              <button
                onClick={completeSale}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-base active:bg-emerald-700 min-h-[52px]"
              >
                Complete Sale
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt modal */}
      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Receipt</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">{data.settings.shopName} &middot; {receipt.date}</p>
              <div className="space-y-1 mb-3">
                {receipt.items.map((i) => (
                  <div key={i.productId} className="flex justify-between text-sm">
                    <span className="text-slate-700">{i.name} x{i.qty}</span>
                    <span className="font-mono">{fmtMoney(i.unitPrice * i.qty, data.settings.currency)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                <span>Total</span><span className="font-mono">{fmtMoney(receipt.total, data.settings.currency)}</span>
              </div>
              {receipt.balance > 0 && (
                <p className="text-xs text-rose-600 mt-2 font-semibold">Balance owed: {fmtMoney(receipt.balance, data.settings.currency)}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 min-h-[48px]"
                >
                  Print
                </button>
                <button
                  onClick={() => setReceipt(null)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm min-h-[48px]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
