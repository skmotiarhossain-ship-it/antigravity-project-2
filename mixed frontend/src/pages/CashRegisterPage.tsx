import { useState, useEffect } from "react";
import type { AppData, CashTransaction } from "../store";
import { generateId, addChangeLog, formatBengaliDate } from "../store";
import { Users, Search, ChevronRight, ArrowLeft, Calendar, FileText } from 'lucide-react';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  currentUser: string;
}

export default function CashRegisterPage({ data, setData, currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers" | "workers">("customers");
  const [search, setSearch] = useState("");
  
  // Ledger View State
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  // Keypad & Transaction Modal State
  const [showKeypad, setShowKeypad] = useState(false);
  const [txType, setTxType] = useState<"in" | "out">("in"); // "in" = You Got, "out" = You Gave
  const [amountStr, setAmountStr] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Auto-sync missing transactions from purchases, sales, and processes
  useEffect(() => {
    let modified = false;
    const newTx = [...data.transactions];

    const addTx = (id: string, gregorianDate: string, amount: number, type: "in" | "out", category: string, entityName: string) => {
      const txId = `auto_${id}`;
      if (!newTx.find(t => t.id === txId)) {
        newTx.push({
          id: txId,
          date: formatBengaliDate(new Date(gregorianDate)),
          gregorianDate,
          amount,
          type,
          category,
          entityName: entityName || "Unknown",
          isPaid: true, // Ledger auto entries are assumed settled in ledger terms
          notes: `Auto-generated from ${category}`,
          createdBy: "System",
        });
        modified = true;
      }
    };

    // Purchases = You Got (Goods) => "in"
    data.purchases.forEach(p => addTx(p.id, p.gregorianDate, p.totalAmount, "in", "Purchase", p.supplierName));
    
    // Sales = You Gave (Goods) => "out"
    data.sales.forEach(s => addTx(s.id, s.gregorianDate, s.totalAmount, "out", "Sales", s.customerName));
    
    // Processes = You Got (Services/Transport) => "in"
    data.processes.forEach(p => {
      if (p.transportCost > 0) addTx(`${p.id}_transport`, p.gregorianDate, p.transportCost, "in", "Transport", "Transport Provider");
      p.workers.forEach((w, idx) => {
        const amt = w.bags * w.ratePerBag;
        if (amt > 0) addTx(`${p.id}_wages_${idx}`, p.gregorianDate, amt, "in", "Wages", w.workerName);
      });
    });

    if (modified) {
      setData({ ...data, transactions: newTx.sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime()) });
    }
  }, [data.purchases, data.sales, data.processes, data.transactions, setData, data]);

  const handleKeypadPress = (val: string) => {
    if (val === "backspace") {
      setAmountStr(prev => prev.slice(0, -1));
    } else {
      if (amountStr === "0" && val !== "00") {
        setAmountStr(val);
      } else {
        setAmountStr(prev => prev + val);
      }
    }
  };

  const handleSaveTransaction = () => {
    const numAmount = parseFloat(amountStr);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!activeProfile) return;

    let category = "General";
    if (activeTab === "customers") category = txType === "in" ? "Payment Received" : "Advance Given";
    if (activeTab === "suppliers") category = txType === "in" ? "Advance Received" : "Payment Given";
    if (activeTab === "workers") category = txType === "in" ? "Advance Refund" : "Wages Paid";

    const tx: CashTransaction = {
      id: generateId(),
      date: formatBengaliDate(new Date(txDate)),
      gregorianDate: new Date(txDate).toISOString(),
      amount: numAmount,
      type: txType,
      category,
      entityName: activeProfile,
      isPaid: true,
      notes: notes,
      createdBy: currentUser,
    };

    let newData = { ...data };
    newData.transactions = [tx, ...newData.transactions].sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
    newData = addChangeLog(newData, currentUser, "Added", "CashRegister", `Ledger entry: ₹${tx.amount} (${txType === "in" ? "Got" : "Gave"}) for ${tx.entityName}`);
    
    setData(newData);
    setShowKeypad(false);
    setAmountStr("");
    setNotes("");
  };

  const openKeypad = (type: "in" | "out", profileName?: string) => {
    if (profileName && !activeProfile) {
      setActiveProfile(profileName);
    }
    setTxType(type);
    setAmountStr("");
    setNotes("");
    setTxDate(new Date().toISOString().split('T')[0]);
    setShowKeypad(true);
  };

  // Determine list of entities based on active tab
  let entities: string[] = [];
  if (activeTab === "customers") entities = data.customers;
  else if (activeTab === "suppliers") entities = data.suppliers;
  else if (activeTab === "workers") entities = data.workers;

  // Make sure to include profiles from transactions that might not be in the arrays
  const txEntities = data.transactions.map(t => t.entityName);
  const allTabEntities = Array.from(new Set([...entities, ...txEntities.filter(e => {
    const prof = data.profiles.find(p => p.name === e);
    // If it has a profile type, only include if it matches tab
    if (prof) {
      if (activeTab === "customers" && prof.type !== "customer") return false;
      if (activeTab === "suppliers" && prof.type !== "supplier") return false;
      if (activeTab === "workers" && prof.type !== "worker") return false;
    } else {
      // If no profile, we can't reliably guess the tab without checking if they exist in the arrays
      if (activeTab === "customers" && !data.customers.includes(e)) return false;
      if (activeTab === "suppliers" && !data.suppliers.includes(e)) return false;
      if (activeTab === "workers" && !data.workers.includes(e)) return false;
    }
    return true;
  })]));

  const filteredEntities = allTabEntities.filter(e => e.toLowerCase().includes(search.toLowerCase()));

  // Calculate balances helper
  const getProfileBalance = (name: string) => {
    const txs = data.transactions.filter(t => t.entityName === name);
    const totalOut = txs.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0);
    const totalIn = txs.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0);
    // You'll Get (Positive) = You Gave (Out) - You Got (In)
    return totalOut - totalIn; 
  };

  // ----------------------------------------------------
  // KEYPAD MODAL RENDER
  // ----------------------------------------------------
  if (showKeypad) {
    return (
      <div className="flex flex-col fixed inset-0 z-[60] bg-slate-50 text-slate-900 h-[100dvh]">
        {/* Header */}
        <div className={`flex items-center gap-3 px-4 py-4 text-white ${txType === 'out' ? 'bg-red-500' : 'bg-green-500'}`}>
          <button onClick={() => setShowKeypad(false)} className="hover:bg-black/10 p-1 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold">{txType === 'out' ? "You Gave ₹" : "You Got ₹"} to {activeProfile}</h2>
          </div>
        </div>

        {/* Top Half: Input Fields */}
        <div className="flex-1 flex flex-col p-6 bg-white space-y-6">
          <div className="flex items-center justify-center border-b-2 border-slate-200 pb-4">
            <span className="text-4xl font-bold text-slate-400 mr-2">₹</span>
            <span className={`text-5xl font-bold ${!amountStr ? 'text-slate-300' : 'text-slate-800'}`}>
              {amountStr ? new Intl.NumberFormat('en-IN').format(Number(amountStr)) : "0"}
            </span>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Details / Notes</label>
              <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <FileText className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                  placeholder="Item name, bill no..."
                />
              </div>
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
              <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Half: Custom Keypad */}
        <div className="bg-slate-100 p-4 pb-8 border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0"].map(key => (
              <button
                key={key}
                onClick={() => handleKeypadPress(key)}
                className="bg-white rounded-xl py-4 text-2xl font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 active:bg-slate-200 active:scale-95 transition-all"
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => handleKeypadPress("backspace")}
              className="bg-slate-200 rounded-xl py-4 text-2xl font-semibold text-slate-700 shadow-sm border border-slate-300 flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all"
            >
              ⌫
            </button>
          </div>
          <button
            onClick={handleSaveTransaction}
            disabled={!amountStr || Number(amountStr) <= 0}
            className={`w-full py-4 rounded-xl text-lg font-bold text-white shadow-md transition-all ${
              !amountStr || Number(amountStr) <= 0 
                ? "bg-slate-300" 
                : txType === 'out' ? "bg-red-500 hover:bg-red-600 active:bg-red-700" : "bg-green-500 hover:bg-green-600 active:bg-green-700"
            }`}
          >
            SAVE
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // PROFILE LEDGER DETAIL RENDER
  // ----------------------------------------------------
  if (activeProfile) {
    const profileTxs = data.transactions.filter(t => t.entityName === activeProfile).sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
    const balance = getProfileBalance(activeProfile);

    return (
      <div className="flex flex-col fixed inset-0 z-[60] bg-slate-50 h-[100dvh]">
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
          <button onClick={() => setActiveProfile(null)} className="text-slate-500 hover:text-slate-800 p-1 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">{activeProfile}</h2>
          </div>
        </div>

        <div className="p-4 shrink-0 bg-white shadow-sm mb-2 z-10 relative border-b border-slate-200">
          <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Net Balance</p>
              {balance === 0 ? (
                <p className="text-2xl font-bold text-slate-600">Settled</p>
              ) : (
                <p className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{new Intl.NumberFormat('en-IN').format(Math.abs(balance))}
                </p>
              )}
            </div>
            <div className="text-right">
              {balance > 0 && <p className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-full inline-block shadow-sm">You'll Get</p>}
              {balance < 0 && <p className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-full inline-block shadow-sm">You'll Give</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-24">
          <div className="space-y-2">
            {profileTxs.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex justify-between items-center hover:border-slate-300 transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">{tx.date}</p>
                  <p className="text-sm font-semibold text-slate-800">{tx.category}</p>
                  {tx.notes && <p className="text-xs text-slate-500 mt-1">{tx.notes}</p>}
                </div>
                <div className={`text-right ${tx.type === "in" ? "bg-slate-50 border-green-200" : "bg-slate-50 border-red-200"} border rounded-lg px-3 py-2 min-w-[100px]`}>
                  <p className="text-xs text-slate-500 font-medium mb-1">{tx.type === "out" ? "You Gave" : "You Got"}</p>
                  <p className={`text-sm font-bold ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}>
                    ₹{new Intl.NumberFormat('en-IN').format(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
            {profileTxs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>No transactions yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-4">
          <button onClick={() => openKeypad("out")} className="flex-1 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-center shadow-sm transition-all flex justify-center items-center gap-2">
            YOU GAVE <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">−</span>
          </button>
          <button onClick={() => openKeypad("in")} className="flex-1 bg-green-50 hover:bg-green-100 active:bg-green-200 border border-green-200 text-green-600 py-3.5 rounded-xl font-bold text-center shadow-sm transition-all flex justify-center items-center gap-2">
            YOU GOT <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">+</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN TAB RENDER
  // ----------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-20 bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4 shrink-0 shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            Khatabook Ledger
          </h2>
        
        {/* Pills / Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "customers" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            CUSTOMERS
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "suppliers" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            SUPPLIERS
          </button>
          <button
            onClick={() => setActiveTab("workers")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "workers" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            WORKERS
          </button>
        </div>
        
        <div className="p-4 shrink-0 bg-white border-b border-slate-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="divide-y divide-slate-200">
          {filteredEntities.map((entity, idx) => {
            const balance = getProfileBalance(entity);
            return (
              <div key={idx} onClick={() => setActiveProfile(entity)} className="bg-white p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                    {entity.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{entity}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {balance === 0 ? (
                      <p className="text-sm font-semibold text-slate-500">Settled</p>
                    ) : (
                      <>
                        <p className={`text-sm font-bold ${balance > 0 ? "text-green-600" : "text-red-600"}`}>
                          ₹{new Intl.NumberFormat('en-IN').format(Math.abs(balance))}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{balance > 0 ? "You'll Get" : "You'll Give"}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredEntities.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No profiles found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
