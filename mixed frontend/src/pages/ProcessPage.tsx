import { useState } from "react";
import type { AppData, ProcessRecord, WorkerEntry } from "../store";
import { generateId, formatBengaliDate, generateBatchNo, addChangeLog, getAvailableRawStock, getBatchProgress } from "../store";
import SearchableDropdown from "../components/SearchableDropdown";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  currentUser: string;
  subType: "steaming" | "boiling" | "drying" | "milling";
  viewOnlyRecord?: ProcessRecord | null;
}

const PROCESS_LABELS: Record<string, string> = {
  steaming: "Steaming",
  boiling: "Boiling",
  drying: "Drying",
  milling: "Milling",
};

const PROCESS_ICONS: Record<string, string> = {
  steaming: "♨️",
  boiling: "🫧",
  drying: "☀️",
  milling: "⚙️",
};

interface WorkerRowProps {
  entry: WorkerEntry;
  workers: string[];
  onUpdate: (entry: WorkerEntry) => void;
  onRemove: () => void;
  onAddWorker: (name: string) => void;
}

function WorkerRow({ entry, workers, onUpdate, onRemove, onAddWorker }: WorkerRowProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");

  const filteredWorkers = workers.filter((w) => w.toLowerCase().includes(workerSearch.toLowerCase()));

  const handleSelect = (name: string) => {
    onUpdate({ ...entry, workerName: name });
    setShowDropdown(false);
    setWorkerSearch("");
  };

  const handleAdd = () => {
    if (workerSearch.trim()) {
      onAddWorker(workerSearch.trim());
      onUpdate({ ...entry, workerName: workerSearch.trim() });
      setShowDropdown(false);
      setWorkerSearch("");
    }
  };

  const subtotal = entry.bags * entry.ratePerBag;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 relative shadow-sm">
      <button type="button" onClick={onRemove} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">✕</button>
      
      <div className="mb-3 relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">Worker</label>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full text-left bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:border-green-500 outline-none flex justify-between items-center"
        >
          {entry.workerName || <span className="text-gray-400">Select worker</span>}
          <span className="text-gray-400">▼</span>
        </button>

        {showDropdown && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                placeholder="Search or add..."
                className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (filteredWorkers.length === 1) handleSelect(filteredWorkers[0]);
                    else if (filteredWorkers.length === 0 && workerSearch.trim()) handleAdd();
                  }
                }}
              />
            </div>
            <div className="max-h-40 overflow-y-auto">
              {filteredWorkers.length === 0 && workerSearch.trim() && (
                <button type="button" onClick={handleAdd} className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50">
                  + Add "{workerSearch.trim()}"
                </button>
              )}
              {filteredWorkers.map((w) => (
                <button key={w} type="button" onClick={() => handleSelect(w)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <span className={`w-3 h-3 rounded-full border border-gray-300 ${entry.workerName === w ? "bg-green-500 border-green-500" : ""}`} />
                  {w}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-gray-100 flex justify-end bg-gray-50">
              <button type="button" onClick={() => setShowDropdown(false)} className="text-green-600 text-xs font-bold px-2 py-1">Done</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Bags Worked</label>
          <div className="flex bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
            <button type="button" onClick={() => onUpdate({ ...entry, bags: Math.max(0, entry.bags - 1) })} className="px-3 py-2 text-gray-500 hover:bg-gray-200">—</button>
            <input
              type="number"
              value={entry.bags}
              onChange={(e) => onUpdate({ ...entry, bags: e.target.value === "" ? ("" as any) : Number(e.target.value) })}
              className="w-full bg-transparent text-center text-gray-800 text-sm focus:outline-none py-2"
            />
            <button type="button" onClick={() => onUpdate({ ...entry, bags: (Number(entry.bags) || 0) + 1 })} className="px-3 py-2 text-gray-500 hover:bg-gray-200">+</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rate per Bag</label>
          <div className="flex bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
            <button type="button" onClick={() => onUpdate({ ...entry, ratePerBag: Math.max(0, (Number(entry.ratePerBag) || 0) - 1) })} className="px-3 py-2 text-gray-500 hover:bg-gray-200">—</button>
            <input
              type="number"
              value={entry.ratePerBag}
              onChange={(e) => onUpdate({ ...entry, ratePerBag: e.target.value === "" ? ("" as any) : Number(e.target.value) })}
              className="w-full bg-transparent text-center text-gray-800 text-sm focus:outline-none py-2"
            />
            <button type="button" onClick={() => onUpdate({ ...entry, ratePerBag: (Number(entry.ratePerBag) || 0) + 1 })} className="px-3 py-2 text-gray-500 hover:bg-gray-200">+</button>
          </div>
        </div>
      </div>
      
      <div className="text-right text-xs mt-3 border-t border-gray-100 pt-2">
        <span className="text-gray-500 mr-2">Subtotal:</span>
        <span className="text-green-600 font-bold text-sm">₹{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

const emptyForm = () => ({
  godownName: "",
  supplierName: "",
  riceType: "",
  batchNo: "",
  workers: [] as WorkerEntry[],
  transportCost: 0,
  notes: "",
});

export default function ProcessPage({ data, setData, currentUser, subType, viewOnlyRecord }: Props) {
  const [showForm, setShowForm] = useState(!!viewOnlyRecord);
  const [selectedGodown, setSelectedGodown] = useState<string | null>(viewOnlyRecord ? viewOnlyRecord.godownName || null : null);
  const [form, setForm] = useState(viewOnlyRecord ? {
    godownName: viewOnlyRecord.godownName || "",
    supplierName: viewOnlyRecord.supplierName || "",
    riceType: viewOnlyRecord.riceType || "",
    batchNo: viewOnlyRecord.batchNo || "",
    workers: viewOnlyRecord.workers || [],
    transportCost: viewOnlyRecord.transportCost as number | string,
    notes: viewOnlyRecord.notes || "",
  } : emptyForm());
  const [editingId, setEditingId] = useState<string | null>(viewOnlyRecord ? viewOnlyRecord.id : null);
  const [showErrors, setShowErrors] = useState(false);
  const isViewOnly = !!viewOnlyRecord;

  const today = new Date();
  const processRecords = data.processes.filter((p) => p.processType === subType);

  const totalBags = form.workers.reduce((s, w) => s + (Number(w.bags) || 0), 0);
  const totalWages = form.workers.reduce((s, w) => s + (Number(w.bags) || 0) * (Number(w.ratePerBag) || 0), 0);
  const totalCost = totalWages + (Number(form.transportCost) || 0);

  // Count existing records for this process type for serial number
  const serialCount = data.processes.filter((p) => p.processType === subType).length + 1;

  const handleSave = () => {
    if (isViewOnly) return;

    if (subType === "steaming") {
      if (!form.godownName || !form.supplierName || !form.riceType || form.workers.length === 0 || totalBags === 0) { 
        setShowErrors(true);
        return; 
      }
      
      let originalBags = 0;
      if (editingId) {
        const origRec = data.processes.find(p => p.id === editingId);
        if (origRec) originalBags = origRec.totalBags;
      }
      
      const availableStock = getAvailableRawStock(data, form.godownName, form.riceType);
      if (availableStock + originalBags === 0) {
        alert(`Error: Selected godown (${form.godownName}) has 0 stock of ${form.riceType}. Process blocked.`);
        return;
      }
      if (availableStock + originalBags < totalBags) {
        alert(`Warning: Insufficient stock. You are trying to steam ${totalBags} bags but only ${availableStock + originalBags} bags are available in ${form.godownName}. Process blocked.`);
        return;
      }
    } else {
      if (!form.batchNo || form.workers.length === 0 || totalBags === 0 || (subType === "milling" && !form.godownName)) { 
        setShowErrors(true);
        return; 
      }
      
      const progress = getBatchProgress(data, form.batchNo);
      let prevCount = 0;
      let currCount = 0;
      if (subType === "boiling") { prevCount = progress.steamed; currCount = progress.boiled; }
      else if (subType === "drying") { prevCount = progress.boiled; currCount = progress.dried; }
      else if (subType === "milling") { prevCount = progress.dried; currCount = progress.milled; }
      
      let originalBags = 0;
      if (editingId) {
        const origRec = data.processes.find(p => p.id === editingId);
        if (origRec) originalBags = origRec.totalBags;
      }
      
      const available = prevCount - currCount + originalBags;
      if (totalBags > available) {
        alert(`Error: You can only process up to ${available} bags for this batch.`);
        return;
      }
    }

    const serialStr = String(serialCount).padStart(2, "0");
    const batchNo = subType === "steaming" 
      ? generateBatchNo(form.supplierName, form.godownName, form.riceType, serialCount)
      : form.batchNo;

    let godownName = form.godownName;
    let supplierName = form.supplierName;
    let riceType = form.riceType;

    if (subType !== "steaming") {
      const steamingBatch = data.processes.find(p => p.processType === "steaming" && p.batchNo === form.batchNo);
      if (steamingBatch) {
        godownName = steamingBatch.godownName || "";
        supplierName = steamingBatch.supplierName || "";
        riceType = steamingBatch.riceType || "";
      }
    }

    const record: ProcessRecord = {
      id: editingId || generateId(),
      processType: subType,
      serialNumber: serialStr,
      date: formatBengaliDate(today),
      gregorianDate: today.toISOString(),
      batchNo,
      godownName,
      supplierName,
      riceType,
      workers: form.workers,
      totalBags,
      totalWages,
      transportCost: Number(form.transportCost) || 0,
      notes: form.notes,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };

    let newData: AppData;
    if (editingId) {
      newData = { ...data, processes: data.processes.map((p) => (p.id === editingId ? record : p)) };
      newData = addChangeLog(newData, currentUser, "Updated", `Process/${subType}`, `Updated ${PROCESS_LABELS[subType]} batch ${batchNo}`);
    } else {
      newData = { ...data, processes: [record, ...data.processes] };
      newData = addChangeLog(newData, currentUser, "Added", `Process/${subType}`, `New ${PROCESS_LABELS[subType]} batch ${batchNo}, ${totalBags} bags, ₹${totalWages.toFixed(2)} wages`);
    }
    setData(newData);
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
    setSelectedGodown(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this process record?")) return;
    const rec = data.processes.find((p) => p.id === id);
    let newData = { ...data, processes: data.processes.filter((p) => p.id !== id) };
    newData = addChangeLog(newData, currentUser, "Deleted", `Process/${subType}`, `Deleted ${PROCESS_LABELS[subType]} batch ${rec?.batchNo}`);
    setData(newData);
  };

  const handleEdit = (record: ProcessRecord) => {
    setForm({
      godownName: record.godownName || "",
      supplierName: record.supplierName || "",
      riceType: record.riceType || "",
      batchNo: record.batchNo,
      workers: record.workers,
      transportCost: record.transportCost,
      notes: record.notes,
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const addWorkerRow = () => {
    setForm({ ...form, workers: [...form.workers, { workerName: "", bags: 0, ratePerBag: 3 }] });
  };

  const updateWorker = (idx: number, entry: WorkerEntry) => {
    const workers = [...form.workers];
    workers[idx] = entry;
    setForm({ ...form, workers });
  };

  const removeWorker = (idx: number) => {
    setForm({ ...form, workers: form.workers.filter((_, i) => i !== idx) });
  };

  const addWorkerToList = (name: string) => {
    if (!data.workers.includes(name)) {
      setData({ ...data, workers: [...data.workers, name] });
    }
  };

  const addSupplier = (name: string) => {
    if (!data.suppliers.includes(name)) {
      setData({ ...data, suppliers: [...data.suppliers, name] });
    }
  };

  const addRiceType = (name: string) => {
    if (!data.riceTypes.includes(name)) {
      setData({ ...data, riceTypes: [...data.riceTypes, name] });
    }
  };

  const getAvailableBatches = () => {
    let prevType = "";
    if (subType === "boiling") prevType = "steaming";
    if (subType === "drying") prevType = "boiling";
    if (subType === "milling") prevType = "drying";

    const prevBatches = Array.from(new Set(data.processes.filter(p => p.processType === prevType).map(p => p.batchNo)));
    
    return prevBatches.filter(batchNo => {
      const progress = getBatchProgress(data, batchNo);
      let prevCount = 0;
      let currCount = 0;
      if (prevType === "steaming") { prevCount = progress.steamed; currCount = progress.boiled; }
      else if (prevType === "boiling") { prevCount = progress.boiled; currCount = progress.dried; }
      else if (prevType === "drying") { prevCount = progress.dried; currCount = progress.milled; }
      
      return currCount < prevCount;
    });
  };

  // Non-Steaming Processes directly show the records list and an Add Button
  if (subType !== "steaming" && !showForm) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>{PROCESS_ICONS[subType]}</span> {PROCESS_LABELS[subType]}
            </h2>
            <p className="text-xs text-gray-400">{formatBengaliDate(today)}</p>
          </div>
          <button
            onClick={() => { setForm(emptyForm()); setShowForm(true); }}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Add {PROCESS_LABELS[subType]}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {processRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">{PROCESS_ICONS[subType]}</div>
              <p>No {PROCESS_LABELS[subType].toLowerCase()} records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processRecords.map((rec) => (
                <div key={rec.id} className="bg-[#1e2a3a] border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">#{rec.serialNumber}</span>
                        <span className="text-xs font-mono text-green-400">{rec.batchNo}</span>
                      </div>
                      <p className="text-white font-medium text-sm">{rec.supplierName || "—"} · {rec.riceType || "—"}</p>
                      <p className="text-xs text-gray-400">{rec.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">₹{new Intl.NumberFormat('en-IN').format(rec.totalWages + (rec.transportCost || 0))}</p>
                      <p className="text-xs text-gray-400">{rec.totalBags} bags</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {rec.workers.map((w, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-400">
                        <span>{w.workerName}: {w.bags} bags × ₹{w.ratePerBag}</span>
                        <span>₹{(w.bags * w.ratePerBag).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {rec.transportCost > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                      <span className="mr-3">Transport: ₹{new Intl.NumberFormat('en-IN').format(rec.transportCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>By: {rec.createdBy}</span>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(rec)} className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button onClick={() => handleDelete(rec.id)} className="text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Steaming Godown selection screen
  if (subType === "steaming" && !selectedGodown && !showForm) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>{PROCESS_ICONS[subType]}</span> {PROCESS_LABELS[subType]}
            </h2>
            <p className="text-xs text-gray-400">{formatBengaliDate(today)} — Select a godown</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-400 mb-3">Select godown to view/add records:</p>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {data.godowns.map((godown) => {
              const count = processRecords.filter((p) => p.godownName === godown).length;
              return (
                <button
                  key={godown}
                  onClick={() => setSelectedGodown(godown)}
                  className="bg-[#1e2a3a] border border-gray-700 rounded-xl p-4 text-left hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{godown}</span>
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">{count} records</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{PROCESS_LABELS[subType]} records</p>
                </button>
              );
            })}
          </div>

          {/* All records summary */}
          {processRecords.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">All {PROCESS_LABELS[subType]} Records</h3>
              <div className="space-y-2">
                {processRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#1e2a3a] border border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-mono text-green-400">{rec.batchNo}</p>
                        <p className="text-sm text-white font-medium">{rec.godownName}</p>
                        <p className="text-xs text-gray-400">{rec.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-400">₹{new Intl.NumberFormat('en-IN').format(rec.totalWages + (rec.transportCost || 0))}</p>
                        <p className="text-xs text-gray-400">{rec.totalBags} bags</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEdit(rec)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                      <button onClick={() => handleDelete(rec.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Steaming Godown records view
  if (subType === "steaming" && selectedGodown && !showForm) {
    const godownRecords = processRecords.filter((p) => p.godownName === selectedGodown);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedGodown(null)} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-semibold text-white">{PROCESS_ICONS[subType]} {PROCESS_LABELS[subType]} — {selectedGodown}</h2>
              <p className="text-xs text-gray-400">{formatBengaliDate(today)}</p>
            </div>
          </div>
          <button
            onClick={() => { setForm({ ...emptyForm(), godownName: selectedGodown }); setShowForm(true); }}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            + Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {godownRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">{PROCESS_ICONS[subType]}</div>
              <p>No {PROCESS_LABELS[subType].toLowerCase()} records for {selectedGodown}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {godownRecords.map((rec) => (
                <div key={rec.id} className="bg-[#1e2a3a] border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">#{rec.serialNumber}</span>
                        <span className="text-xs font-mono text-green-400">{rec.batchNo}</span>
                      </div>
                      <p className="text-white font-medium text-sm">{rec.supplierName || "—"} · {rec.riceType || "—"}</p>
                      <p className="text-xs text-gray-400">{rec.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">₹{new Intl.NumberFormat('en-IN').format(rec.totalWages + (rec.transportCost || 0))}</p>
                      <p className="text-xs text-gray-400">{rec.totalBags} bags</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {rec.workers.map((w, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-400">
                        <span>{w.workerName}: {w.bags} bags × ₹{w.ratePerBag}</span>
                        <span>₹{(w.bags * w.ratePerBag).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {rec.transportCost > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                      <span className="mr-3">Transport: ₹{new Intl.NumberFormat('en-IN').format(rec.transportCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>By: {rec.createdBy}</span>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(rec)} className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button onClick={() => handleDelete(rec.id)} className="text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col fixed inset-0 z-[60] h-[100dvh] bg-gray-50">
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => { setShowForm(false); setForm(emptyForm()); }} className="hover:bg-green-700 p-1 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span>{PROCESS_ICONS[subType]}</span>
        <h2 className="text-lg font-semibold">{PROCESS_LABELS[subType]} Form</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Date */}
        <div className="flex items-center gap-4">
          <label className="w-28 text-sm text-gray-600 flex-shrink-0">Date</label>
          <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-sm flex items-center justify-between">
            <span>{formatBengaliDate(today)}</span>
            <span>📅</span>
          </div>
        </div>

        {subType === "steaming" ? (
          <>
            {/* Godown */}
            <div className={`flex items-start gap-4 p-2 rounded-lg ${showErrors && !form.godownName ? 'border border-red-500 bg-red-50' : ''}`}>
              <label className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2.5">Godown</label>
              <div className="flex-1">
                <SearchableDropdown
                  label="Godown"
                  options={data.godowns}
                  value={form.godownName}
                  onChange={(v) => !isViewOnly && setForm({ ...form, godownName: v })}
                />
                {form.godownName && form.riceType && (
                  <p className="text-xs mt-1 text-blue-600 font-medium">Available Stock: {getAvailableRawStock(data, form.godownName, form.riceType)} bags</p>
                )}
              </div>
            </div>

            {/* Supplier */}
            <div className={`flex items-start gap-4 p-2 rounded-lg ${showErrors && !form.supplierName ? 'border border-red-500 bg-red-50' : ''}`}>
              <label className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2.5">Supplier</label>
              <div className="flex-1">
                <SearchableDropdown
                  label="Supplier"
                  options={data.suppliers}
                  value={form.supplierName}
                  onChange={(v) => !isViewOnly && setForm({ ...form, supplierName: v })}
                  onAddNew={(v) => !isViewOnly && addSupplier(v)}
                />
              </div>
            </div>

            {/* Rice Type */}
            <div className={`flex items-start gap-4 p-2 rounded-lg ${showErrors && !form.riceType ? 'border border-red-500 bg-red-50' : ''}`}>
              <label className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2.5">Rice Type</label>
              <div className="flex-1">
                <SearchableDropdown
                  label="Rice Type"
                  options={data.riceTypes}
                  value={form.riceType}
                  onChange={(v) => !isViewOnly && setForm({ ...form, riceType: v })}
                  onAddNew={(v) => !isViewOnly && addRiceType(v)}
                />
              </div>
            </div>

            {/* Batch No Preview */}
            {form.supplierName && form.godownName && (
              <div className="flex items-center gap-4">
                <label className="w-28 text-sm text-gray-600 flex-shrink-0">Batch No</label>
                <div className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-sm font-mono text-green-700">
                  {generateBatchNo(form.supplierName, form.godownName, form.riceType, serialCount)}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Batch Selection */}
            <div className={`flex items-start gap-4 p-2 rounded-lg ${showErrors && !form.batchNo ? 'border border-red-500 bg-red-50' : ''}`}>
              <label className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2.5">Select Batch</label>
              <div className="flex-1">
                <select
                  value={form.batchNo}
                  onChange={(e) => {
                    if (isViewOnly) return;
                    if (e.target.value) {
                      const progress = getBatchProgress(data, e.target.value);
                      let available = 0;
                      if (subType === "boiling") available = progress.steamed - progress.boiled;
                      else if (subType === "drying") available = progress.boiled - progress.dried;
                      else if (subType === "milling") available = progress.dried - progress.milled;
                      setForm({ ...form, batchNo: e.target.value, workers: [{ workerName: "", bags: available, ratePerBag: 3 }] });
                    } else {
                      setForm({ ...form, batchNo: e.target.value });
                    }
                  }}
                  disabled={isViewOnly}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:border-green-500 disabled:opacity-75"
                >
                  <option value="">-- Select Pending Batch --</option>
                  {getAvailableBatches().map(b => {
                    const progress = getBatchProgress(data, b);
                    let available = 0;
                    if (subType === "boiling") available = progress.steamed - progress.boiled;
                    else if (subType === "drying") available = progress.boiled - progress.dried;
                    else if (subType === "milling") available = progress.dried - progress.milled;
                    return (
                      <option key={b} value={b}>{b} ({available} bags pending)</option>
                    );
                  })}
                </select>
                {form.batchNo && (
                  <p className="text-xs mt-1 text-blue-600 font-medium">
                    {(() => {
                      const progress = getBatchProgress(data, form.batchNo);
                      let available = 0;
                      if (subType === "boiling") available = progress.steamed - progress.boiled;
                      else if (subType === "drying") available = progress.boiled - progress.dried;
                      else if (subType === "milling") available = progress.dried - progress.milled;
                      return `Available to process: ${available} bags`;
                    })()}
                  </p>
                )}
              </div>
            </div>

            {subType === "milling" && (
              <div className={`flex items-start gap-4 p-2 rounded-lg ${showErrors && !form.godownName ? 'border border-red-500 bg-red-50' : ''}`}>
                <label className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2.5">Dest. Godown</label>
                <div className="flex-1">
                  <SearchableDropdown
                    label="Destination Godown"
                    options={data.godowns}
                    value={form.godownName}
                    onChange={(v) => !isViewOnly && setForm({ ...form, godownName: v })}
                    placeholder="Select Godown..."
                  />
                  <p className="text-xs mt-1 text-gray-500">Milled rice will be stored here</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Workers */}
        <div className={`p-2 rounded-lg ${showErrors && (form.workers.length === 0 || totalBags === 0) ? 'border border-red-500 bg-red-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600 font-medium">Workers</label>
            {!isViewOnly && (
              <button type="button" onClick={addWorkerRow}
                className="text-green-600 text-sm font-semibold hover:text-green-700 flex items-center gap-1">
                + Add Worker
              </button>
            )}
          </div>
          {!isViewOnly && <div className="text-xs text-gray-400 mb-2">Click worker name to change rate · Click — /+ for bags</div>}
          {form.workers.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 text-sm">
              No workers added. Click "+ Add Worker"
            </div>
          )}
          {form.workers.map((w, idx) => (
            <WorkerRow
              key={idx}
              entry={w}
              workers={data.workers}
              onUpdate={(entry) => !isViewOnly && updateWorker(idx, entry)}
              onRemove={() => !isViewOnly && removeWorker(idx)}
              onAddWorker={(v) => !isViewOnly && addWorkerToList(v)}
            />
          ))}
        </div>

        {/* Summary */}
        {form.workers.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-yellow-800 font-medium">
              <span>Total Bags:</span>
              <span>{totalBags}</span>
            </div>
            <div className="flex justify-between text-yellow-800 font-medium">
              <span>Total Cost:</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(totalCost)}</span>
            </div>
          </div>
        )}

        {/* Transport Cost */}
        <div className="flex items-center gap-4">
          <label className="w-28 text-sm text-gray-600 flex-shrink-0">Transport ₹</label>
          <div className="flex-1 flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
            <button type="button" onClick={() => !isViewOnly && setForm({ ...form, transportCost: Math.max(0, (Number(form.transportCost) || 0) - 100) })}
              className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 font-bold border-r border-gray-200" disabled={isViewOnly}>—</button>
            <input
              type="number"
              value={form.transportCost}
              onChange={(e) => !isViewOnly && setForm({ ...form, transportCost: e.target.value === "" ? "" : parseFloat(e.target.value) })}
              className="flex-1 text-center py-2 text-sm focus:outline-none"
              min={0}
              disabled={isViewOnly}
            />
            <button type="button" onClick={() => !isViewOnly && setForm({ ...form, transportCost: (Number(form.transportCost) || 0) + 100 })}
              className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 font-bold border-l border-gray-200" disabled={isViewOnly}>+</button>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <div className="flex justify-between text-green-800 font-bold">
            <span>Total Cost (Wages + Transport):</span>
            <span>₹{new Intl.NumberFormat('en-IN').format(totalCost)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="flex items-start gap-4">
          <label className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => !isViewOnly && setForm({ ...form, notes: e.target.value })}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
            rows={2}
            placeholder="Any notes..."
            disabled={isViewOnly}
          />
        </div>
      </div>

      {!isViewOnly && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 flex justify-between flex-shrink-0">
          <button onClick={() => { setShowForm(false); setForm(emptyForm()); setShowErrors(false); }}
            className="text-gray-600 font-medium px-6 py-2 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="text-green-600 font-semibold px-6 py-2 hover:bg-green-50 rounded-lg transition-colors">
            Save
          </button>
        </div>
      )}
    </div>
  );
}
