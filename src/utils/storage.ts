export type PaymentMethod = "cash" | "card" | "mobile" | "credit";
export type AdjustmentReason = "damage" | "loss" | "internal" | "correction" | "return";
export type StockLogType = "IN" | "OUT" | "ADJUST";

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minAlert: number;
  unit: string;
  supplier: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
}

export interface SaleTransaction {
  id: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  date: string;
  profit: number;
  amountPaid: number;
  balance: number;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: StockLogType;
  qty: number;
  reason: string;
  note: string;
  date: string;
  cost: number;
}

export interface DebtRecord {
  id: string;
  type: "CUSTOMER" | "SUPPLIER";
  name: string;
  amount: number;
  paid: number;
  balance: number;
  saleRef: string;
  date: string;
  notes: string;
}

export interface BusinessSettings {
  shopName: string;
  currency: string;
  phone: string;
  simpleMode: boolean;
}

export interface AppData {
  products: Product[];
  sales: SaleTransaction[];
  stockLogs: StockLog[];
  debts: DebtRecord[];
  settings: BusinessSettings;
}

const STORAGE_KEY = "stockflow_data";

const seedProducts: Product[] = [
  { id: "p1", name: "Rice 5kg", sku: "GRC-001", barcode: "4890001001", category: "Grocery", costPrice: 8.5, sellingPrice: 12, stock: 45, minAlert: 10, unit: "bag", supplier: "Metro Wholesale", createdAt: "2024-01-10" },
  { id: "p2", name: "Cooking Oil 1L", sku: "GRC-002", barcode: "4890001002", category: "Grocery", costPrice: 4.2, sellingPrice: 6.5, stock: 30, minAlert: 8, unit: "pcs", supplier: "Metro Wholesale", createdAt: "2024-01-10" },
  { id: "p3", name: "Sugar 1kg", sku: "GRC-003", barcode: "4890001003", category: "Grocery", costPrice: 1.8, sellingPrice: 2.8, stock: 60, minAlert: 15, unit: "pcs", supplier: "Sugar Direct", createdAt: "2024-01-12" },
  { id: "p4", name: "Coca Cola 500ml", sku: "BEV-001", barcode: "5449000001", category: "Beverages", costPrice: 0.8, sellingPrice: 1.5, stock: 120, minAlert: 30, unit: "pcs", supplier: "Bottlers Inc", createdAt: "2024-01-15" },
  { id: "p5", name: "Mineral Water 1.5L", sku: "BEV-002", barcode: "5449000002", category: "Beverages", costPrice: 0.5, sellingPrice: 1.2, stock: 80, minAlert: 20, unit: "pcs", supplier: "AquaPure", createdAt: "2024-01-15" },
  { id: "p6", name: "Dish Soap 500ml", sku: "HH-001", barcode: "7890001001", category: "Household", costPrice: 1.5, sellingPrice: 3, stock: 25, minAlert: 6, unit: "pcs", supplier: "CleanCo", createdAt: "2024-01-18" },
  { id: "p7", name: "Bath Soap", sku: "PC-001", barcode: "7890001002", category: "Personal Care", costPrice: 0.6, sellingPrice: 1.2, stock: 4, minAlert: 10, unit: "pcs", supplier: "CleanCo", createdAt: "2024-01-20" },
  { id: "p8", name: "Shampoo 200ml", sku: "PC-002", barcode: "7890001003", category: "Personal Care", costPrice: 2.5, sellingPrice: 4.5, stock: 18, minAlert: 5, unit: "pcs", supplier: "BeautyDist", createdAt: "2024-01-20" },
  { id: "p9", name: "Notebook A5", sku: "STN-001", barcode: "8890001001", category: "Stationery", costPrice: 0.8, sellingPrice: 1.8, stock: 50, minAlert: 12, unit: "pcs", supplier: "PaperWorld", createdAt: "2024-01-22" },
  { id: "p10", name: "Milk Powder 400g", sku: "DRY-001", barcode: "9890001001", category: "Dairy", costPrice: 5.5, sellingPrice: 8, stock: 0, minAlert: 5, unit: "pcs", supplier: "DairyBest", createdAt: "2024-01-25" },
  { id: "p11", name: "Eggs (Tray of 30)", sku: "DRY-002", barcode: "9890001002", category: "Dairy", costPrice: 4, sellingPrice: 6, stock: 15, minAlert: 5, unit: "tray", supplier: "FarmFresh", createdAt: "2024-01-25" },
  { id: "p12", name: "Potato Chips 100g", sku: "SNK-001", barcode: "6890001001", category: "Snacks", costPrice: 1.2, sellingPrice: 2.5, stock: 3, minAlert: 8, unit: "pcs", supplier: "SnackCo", createdAt: "2024-02-01" },
];

const today = new Date().toISOString().split("T")[0];

const seedSales: SaleTransaction[] = [
  { id: "s1", items: [{ productId: "p1", name: "Rice 5kg", qty: 2, unitPrice: 12, unitCost: 8.5 }], subtotal: 24, discount: 0, tax: 0, total: 24, paymentMethod: "cash", customerName: "", date: today, profit: 7, amountPaid: 24, balance: 0 },
  { id: "s2", items: [{ productId: "p4", name: "Coca Cola 500ml", qty: 6, unitPrice: 1.5, unitCost: 0.8 }, { productId: "p5", name: "Mineral Water 1.5L", qty: 3, unitPrice: 1.2, unitCost: 0.5 }], subtotal: 12.6, discount: 0, tax: 0, total: 12.6, paymentMethod: "mobile", customerName: "", date: today, profit: 4.5, amountPaid: 12.6, balance: 0 },
  { id: "s3", items: [{ productId: "p2", name: "Cooking Oil 1L", qty: 3, unitPrice: 6.5, unitCost: 4.2 }], subtotal: 19.5, discount: 1, tax: 0, total: 18.5, paymentMethod: "cash", customerName: "Amina K.", date: today, profit: 5.9, amountPaid: 18.5, balance: 0 },
  { id: "s4", items: [{ productId: "p6", name: "Dish Soap 500ml", qty: 2, unitPrice: 3, unitCost: 1.5 }, { productId: "p8", name: "Shampoo 200ml", qty: 1, unitPrice: 4.5, unitCost: 2.5 }], subtotal: 10.5, discount: 0, tax: 0, total: 10.5, paymentMethod: "credit", customerName: "John M.", date: today, profit: 3.5, amountPaid: 5, balance: 5.5 },
  { id: "s5", items: [{ productId: "p9", name: "Notebook A5", qty: 10, unitPrice: 1.8, unitCost: 0.8 }], subtotal: 18, discount: 2, tax: 0, total: 16, paymentMethod: "card", customerName: "School Office", date: "2024-02-10", profit: 8, amountPaid: 16, balance: 0 },
  { id: "s6", items: [{ productId: "p11", name: "Eggs (Tray of 30)", qty: 2, unitPrice: 6, unitCost: 4 }], subtotal: 12, discount: 0, tax: 0, total: 12, paymentMethod: "cash", customerName: "", date: "2024-02-11", profit: 4, amountPaid: 12, balance: 0 },
  { id: "s7", items: [{ productId: "p3", name: "Sugar 1kg", qty: 5, unitPrice: 2.8, unitCost: 1.8 }, { productId: "p1", name: "Rice 5kg", qty: 1, unitPrice: 12, unitCost: 8.5 }], subtotal: 26, discount: 0, tax: 0, total: 26, paymentMethod: "mobile", customerName: "Grace T.", date: "2024-02-12", profit: 8.5, amountPaid: 26, balance: 0 },
  { id: "s8", items: [{ productId: "p12", name: "Potato Chips 100g", qty: 4, unitPrice: 2.5, unitCost: 1.2 }], subtotal: 10, discount: 0, tax: 0, total: 10, paymentMethod: "cash", customerName: "", date: "2024-02-12", profit: 5.2, amountPaid: 10, balance: 0 },
];

const seedStockLogs: StockLog[] = [
  { id: "sl1", productId: "p1", productName: "Rice 5kg", type: "IN", qty: 50, reason: "Purchase", note: "From Metro Wholesale", date: "2024-02-01", cost: 425 },
  { id: "sl2", productId: "p4", productName: "Coca Cola 500ml", type: "IN", qty: 100, reason: "Purchase", note: "From Bottlers Inc", date: "2024-02-03", cost: 80 },
  { id: "sl3", productId: "p7", productName: "Bath Soap", type: "ADJUST", qty: -2, reason: "damage", note: "Water damage in storage", date: "2024-02-05", cost: 0 },
  { id: "sl4", productId: "p10", productName: "Milk Powder 400g", type: "OUT", qty: -5, reason: "Sold out", note: "All units sold", date: "2024-02-06", cost: 0 },
];

const seedDebts: DebtRecord[] = [
  { id: "d1", type: "CUSTOMER", name: "John M.", amount: 5.5, paid: 0, balance: 5.5, saleRef: "s4", date: today, notes: "Credit sale - partial payment" },
  { id: "d2", type: "CUSTOMER", name: "Sarah W.", amount: 15, paid: 5, balance: 10, saleRef: "manual", date: "2024-02-08", notes: "Groceries on credit" },
  { id: "d3", type: "CUSTOMER", name: "Peter K.", amount: 22, paid: 0, balance: 22, saleRef: "manual", date: "2024-02-05", notes: "Bulk purchase deferred" },
  { id: "d4", type: "SUPPLIER", name: "Metro Wholesale", amount: 500, paid: 300, balance: 200, saleRef: "PO-2024-015", date: "2024-01-28", notes: "Rice and oil shipment" },
  { id: "d5", type: "SUPPLIER", name: "DairyBest", amount: 150, paid: 0, balance: 150, saleRef: "PO-2024-018", date: "2024-02-02", notes: "Milk powder order" },
];

const defaultData: AppData = {
  products: seedProducts,
  sales: seedSales,
  stockLogs: seedStockLogs,
  debts: seedDebts,
  settings: { shopName: "My Shop", currency: "$", phone: "", simpleMode: false },
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.products || !parsed.settings) return { ...defaultData };
    return parsed;
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("stockflow-updated"));
}

export function exportJSON(): string {
  return JSON.stringify(loadData(), null, 2);
}

export function importJSON(json: string, mode: "replace" | "merge"): AppData {
  const incoming = JSON.parse(json) as Partial<AppData>;
  if (mode === "replace") {
    const next: AppData = {
      products: incoming.products ?? [],
      sales: incoming.sales ?? [],
      stockLogs: incoming.stockLogs ?? [],
      debts: incoming.debts ?? [],
      settings: incoming.settings ?? defaultData.settings,
    };
    saveData(next);
    return next;
  }
  const current = loadData();
  const merged: AppData = {
    products: [...current.products, ...(incoming.products ?? []).filter((p) => !current.products.some((c) => c.id === p.id))],
    sales: [...current.sales, ...(incoming.sales ?? []).filter((s) => !current.sales.some((c) => c.id === s.id))],
    stockLogs: [...current.stockLogs, ...(incoming.stockLogs ?? []).filter((l) => !current.stockLogs.some((c) => c.id === l.id))],
    debts: [...current.debts, ...(incoming.debts ?? []).filter((d) => !current.debts.some((c) => c.id === d.id))],
    settings: incoming.settings ?? current.settings,
  };
  saveData(merged);
  return merged;
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function fmtMoney(amount: number, currency: string): string {
  return `${currency}${amount.toFixed(2)}`;
}
