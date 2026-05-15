// Shared in-memory store for all users (shared state via localStorage)
export type User = { username: string; password: string; displayName: string; role: string };

export const USERS: User[] = [
  { username: "saifuddinsk", password: "saifuddin1", displayName: "Saifuddin", role: "Owner" },
  { username: "kutubsk", password: "kutub2", displayName: "Kutub", role: "Manager" },
  { username: "jalalsk", password: "jalal3", displayName: "Jalal", role: "Staff" },
];

export type BagSize = 50 | 25 | 'service';

export interface GodownAllocation {
  godownName: string;
  bags: number;
}

export interface PurchaseRecord {
  id: string;
  date: string; // Bengali date string
  gregorianDate: string; // ISO
  supplierName: string;
  type: string;
  ratePerBag: number;
  bagSize: BagSize;
  godownAllocations: GodownAllocation[];
  chitInKg: number;
  totalBags: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
}

export interface SalesRecord {
  id: string;
  date: string;
  gregorianDate: string;
  customerName: string;
  type: string;
  ratePerBag: number;
  bagSize: BagSize;
  godownAllocations: GodownAllocation[];
  chitInKg: number;
  totalBags: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
}

export interface WorkerEntry {
  workerName: string;
  bags: number;
  ratePerBag: number;
}

export interface ProcessRecord {
  id: string;
  processType: "steaming" | "boiling" | "drying" | "milling";
  serialNumber: string;
  date: string;
  gregorianDate: string;
  batchNo: string;
  godownName?: string; // Optional for non-steaming
  supplierName?: string; // Optional for non-steaming
  riceType?: string; // Optional for non-steaming
  workers: WorkerEntry[];
  totalBags: number;
  totalWages: number;
  transportCost: number;
  electricityCost?: number; // Removed from UI, keep for type safety
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  gregorianDate: string;
  category: string;
  amount: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface ChangeLog {
  id: string;
  user: string;
  action: string;
  section: string;
  timestamp: string;
  details: string;
}

export interface Profile {
  id: string;
  name: string;
  type: "customer" | "supplier" | "worker";
  phone: string;
  address: string;
}

export interface CashTransaction {
  id: string;
  date: string;
  gregorianDate: string;
  amount: number;
  type: "in" | "out";
  category: string;
  entityName: string; // Supplier, Customer, Worker name
  isPaid: boolean;
  notes: string;
  createdBy: string;
}

export interface AppData {
  suppliers: string[];
  customers: string[];
  riceTypes: string[];
  godowns: string[];
  workers: string[];
  profiles: Profile[];
  transactions: CashTransaction[];
  purchases: PurchaseRecord[];
  sales: SalesRecord[];
  processes: ProcessRecord[];
  expenses: ExpenseRecord[];
  changeLogs: ChangeLog[];
}

const DEFAULT_DATA: AppData = {
  suppliers: ["Saiful", "Dabasis", "Ripone", "Ponkaj", "Turunda", "AROJ", "Jamal vi", "AJITDA", "AFSAR"],
  customers: ["Local Market", "Wholesale Buyer", "Bapy-sunko", "Siraj"],
  riceTypes: ["Miniket", "Gobindobhog", "Basmati", "Sona Masoori", "IR-36"],
  godowns: ["MH Godown", "SMHM Godown"],
  workers: ["Ravi", "Suresh", "Mohan", "Ramesh", "Karim"],
  profiles: [
    { id: "prof_bapy", name: "Bapy-sunko", type: "customer", phone: "", address: "" },
    { id: "prof_siraj", name: "Siraj", type: "customer", phone: "", address: "" }
  ],
  transactions: [
    {
      id: "tx_seed_1",
      date: "13 May 2026",
      gregorianDate: "2026-05-13T10:00:00.000Z",
      amount: 90000,
      type: "out",
      category: "Sales",
      entityName: "Bapy-sunko",
      isPaid: false,
      notes: "Initial seed data",
      createdBy: "System",
    },
    {
      id: "tx_seed_2",
      date: "13 May 2026",
      gregorianDate: "2026-05-13T11:00:00.000Z",
      amount: 8000,
      type: "in",
      category: "Payment Received",
      entityName: "Bapy-sunko",
      isPaid: false,
      notes: "Initial seed data",
      createdBy: "System",
    },
    {
      id: "tx_seed_3",
      date: "13 May 2026",
      gregorianDate: "2026-05-13T12:00:00.000Z",
      amount: 82500,
      type: "out",
      category: "Sales",
      entityName: "Siraj",
      isPaid: false,
      notes: "Initial seed data",
      createdBy: "System",
    }
  ],
  purchases: [],
  sales: [],
  processes: [],
  expenses: [],
  changeLogs: [],
};

const STORAGE_KEY = "mh_rice_mill_data";

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all keys exist
      return {
        ...DEFAULT_DATA,
        ...parsed,
      };
    }
  } catch {}
  
  // Only inject seed data if local storage is empty
  const data = { ...DEFAULT_DATA };
  saveData(data);
  return data;
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export interface StockItem {
  riceType: string;
  bags: number;
}

export interface GodownStock {
  godownName: string;
  rawItems: StockItem[];
  milledItems: StockItem[];
  totalRaw: number;
  totalMilled: number;
}

export function getGodownStock(data: AppData): GodownStock[] {
  const godownsMap = new Map<string, {
    raw: Record<string, number>,
    milled: Record<string, number>
  }>();

  data.godowns.forEach(g => godownsMap.set(g, { raw: {}, milled: {} }));

  // Raw Stock = Purchases - Steaming
  data.purchases.forEach(p => {
    p.godownAllocations.forEach(alloc => {
      const gMap = godownsMap.get(alloc.godownName);
      if (gMap) {
        gMap.raw[p.type] = (gMap.raw[p.type] || 0) + alloc.bags;
      }
    });
  });

  data.processes.forEach(p => {
    if (p.processType === "steaming" && p.godownName && p.riceType) {
      const gMap = godownsMap.get(p.godownName);
      if (gMap) {
        gMap.raw[p.riceType] = (gMap.raw[p.riceType] || 0) - p.totalBags;
      }
    }
  });

  // Milled Stock = Milling - Sales
  data.processes.forEach(p => {
    if (p.processType === "milling" && p.godownName && p.riceType) {
      const gMap = godownsMap.get(p.godownName);
      if (gMap) {
        gMap.milled[p.riceType] = (gMap.milled[p.riceType] || 0) + p.totalBags;
      }
    }
  });

  data.sales.forEach(s => {
    if (s.bagSize !== 'service') {
      s.godownAllocations.forEach(alloc => {
        const gMap = godownsMap.get(alloc.godownName);
        if (gMap) {
          gMap.milled[s.type] = (gMap.milled[s.type] || 0) - alloc.bags;
        }
      });
    }
  });

  const result: GodownStock[] = [];
  godownsMap.forEach((gMap, godownName) => {
    const rawItems = Object.entries(gMap.raw).filter(([_, b]) => b !== 0).map(([rt, b]) => ({ riceType: rt, bags: b }));
    const milledItems = Object.entries(gMap.milled).filter(([_, b]) => b !== 0).map(([rt, b]) => ({ riceType: rt, bags: b }));
    result.push({
      godownName,
      rawItems,
      milledItems,
      totalRaw: rawItems.reduce((s, i) => s + i.bags, 0),
      totalMilled: milledItems.reduce((s, i) => s + i.bags, 0)
    });
  });

  return result;
}

export function getAvailableRawStock(data: AppData, godownName: string, riceType?: string): number {
  const stockInfo = getGodownStock(data).find(g => g.godownName === godownName);
  if (!stockInfo) return 0;
  if (riceType) {
    const item = stockInfo.rawItems.find(i => i.riceType === riceType);
    return item ? item.bags : 0;
  }
  return stockInfo.totalRaw;
}

export function getAvailableMilledStock(data: AppData, godownName: string, riceType?: string): number {
  const stockInfo = getGodownStock(data).find(g => g.godownName === godownName);
  if (!stockInfo) return 0;
  if (riceType) {
    const item = stockInfo.milledItems.find(i => i.riceType === riceType);
    return item ? item.bags : 0;
  }
  return stockInfo.totalMilled;
}

export function getBatchStatus(data: AppData, batchNo: string): "steamed" | "boiled" | "dried" | "milled" | "unknown" {
  const processes = data.processes.filter(p => p.batchNo === batchNo);
  if (processes.some(p => p.processType === "milling")) return "milled";
  if (processes.some(p => p.processType === "drying")) return "dried";
  if (processes.some(p => p.processType === "boiling")) return "boiled";
  if (processes.some(p => p.processType === "steaming")) return "steamed";
  return "unknown";
}

export function getBatchProgress(data: AppData, batchNo: string) {
  const processes = data.processes.filter(p => p.batchNo === batchNo);
  
  const steamed = processes.filter(p => p.processType === "steaming").reduce((sum, p) => sum + p.totalBags, 0);
  const boiled = processes.filter(p => p.processType === "boiling").reduce((sum, p) => sum + p.totalBags, 0);
  const dried = processes.filter(p => p.processType === "drying").reduce((sum, p) => sum + p.totalBags, 0);
  const milled = processes.filter(p => p.processType === "milling").reduce((sum, p) => sum + p.totalBags, 0);

  return { steamed, boiled, dried, milled };
}

// Bengali calendar conversion
const BENGALI_MONTHS = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ",
  "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ",
  "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
];

const BENGALI_MONTHS_EN = [
  "Boishakh", "Jyoishtho", "Asharh", "Shraban",
  "Bhadro", "Ashwin", "Kartik", "Ogrohayon",
  "Poush", "Magh", "Falgun", "Choitro"
];

export function gregorianToBengali(date: Date): { day: number; month: number; year: number; monthName: string; monthNameEn: string } {
  // Bengali calendar starts from April 14/15
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based
  const day = date.getDate();

  let bengaliYear: number;
  let bengaliMonth: number;
  let bengaliDay: number;

  // Simplified Bengali calendar conversion
  // Bengali New Year starts around April 14-15
  const bengaliMonthStart = [
    { gMonth: 4, gDay: 14 },  // Boishakh
    { gMonth: 5, gDay: 15 },  // Jyoishtho
    { gMonth: 6, gDay: 15 },  // Asharh
    { gMonth: 7, gDay: 16 },  // Shraban
    { gMonth: 8, gDay: 16 },  // Bhadro
    { gMonth: 9, gDay: 16 },  // Ashwin
    { gMonth: 10, gDay: 16 }, // Kartik
    { gMonth: 11, gDay: 15 }, // Ogrohayon
    { gMonth: 12, gDay: 15 }, // Poush
    { gMonth: 1, gDay: 14 },  // Magh (next year)
    { gMonth: 2, gDay: 13 },  // Falgun
    { gMonth: 3, gDay: 14 },  // Choitro
  ];

  // Find which Bengali month we're in
  let bMonth = -1;
  for (let i = 0; i < 12; i++) {
    const start = bengaliMonthStart[i];
    const next = bengaliMonthStart[(i + 1) % 12];
    
    let inMonth = false;
    if (start.gMonth === month && day >= start.gDay) {
      inMonth = true;
    } else if (next.gMonth === month && day < next.gDay && i !== 11) {
      // Check if previous month's start was in previous gregorian month
    }
    
    if (start.gMonth < next.gMonth || (start.gMonth === 12 && next.gMonth === 1)) {
      if (month === start.gMonth && day >= start.gDay) inMonth = true;
      else if (month > start.gMonth && month < next.gMonth) inMonth = true;
      else if (month === next.gMonth && day < next.gDay) inMonth = true;
    } else if (start.gMonth > next.gMonth) {
      // Wraps year
      if (month === start.gMonth && day >= start.gDay) inMonth = true;
      else if (month > start.gMonth) inMonth = true;
      else if (month < next.gMonth) inMonth = true;
      else if (month === next.gMonth && day < next.gDay) inMonth = true;
    }
    
    if (inMonth && bMonth === -1) bMonth = i;
  }

  // Simple calculation
  const startOfBengaliYear = new Date(year, 3, 14); // April 14
  const diff = date.getTime() - startOfBengaliYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (dayOfYear >= 0) {
    bengaliYear = year - 593;
    // Calculate month and day
    const monthDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
    let remaining = dayOfYear;
    bengaliMonth = 0;
    while (bengaliMonth < 11 && remaining >= monthDays[bengaliMonth]) {
      remaining -= monthDays[bengaliMonth];
      bengaliMonth++;
    }
    bengaliDay = remaining + 1;
  } else {
    bengaliYear = year - 594;
    const startOfPrevBengaliYear = new Date(year - 1, 3, 14);
    const diff2 = date.getTime() - startOfPrevBengaliYear.getTime();
    const dayOfYear2 = Math.floor(diff2 / (1000 * 60 * 60 * 24));
    const monthDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
    let remaining = dayOfYear2;
    bengaliMonth = 0;
    while (bengaliMonth < 11 && remaining >= monthDays[bengaliMonth]) {
      remaining -= monthDays[bengaliMonth];
      bengaliMonth++;
    }
    bengaliDay = remaining + 1;
  }

  return {
    day: bengaliDay,
    month: bengaliMonth + 1,
    year: bengaliYear,
    monthName: BENGALI_MONTHS[bengaliMonth],
    monthNameEn: BENGALI_MONTHS_EN[bengaliMonth],
  };
}

export function formatBengaliDate(date: Date): string {
  const b = gregorianToBengali(date);
  return `${b.day} ${b.monthNameEn} ${b.year} (বাং)`;
}

export function generateBatchNo(supplierName: string, godownName: string, riceType: string, serial: number): string {
  const sup = (supplierName || "UNKN").replace(/\s/g, "").substring(0, 4).toUpperCase();
  const gowd = (godownName || "GOWD").replace(/\s/g, "").substring(0, 4).toUpperCase();
  const ric = (riceType || "ric").replace(/\s/g, "").substring(0, 3).toUpperCase();
  const ser = String(serial).padStart(2, "0");
  return `MH${sup}${gowd}${ric}${ser}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function addChangeLog(data: AppData, user: string, action: string, section: string, details: string): AppData {
  const log: ChangeLog = {
    id: generateId(),
    user,
    action,
    section,
    timestamp: new Date().toISOString(),
    details,
  };
  return { ...data, changeLogs: [log, ...data.changeLogs].slice(0, 500) };
}
