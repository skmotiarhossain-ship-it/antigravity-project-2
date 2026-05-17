import { useState } from "react";
import type { AppData, SalesRecord, GodownAllocation, BagSize } from "../store";
import { generateId, formatBengaliDate, addChangeLog, getGodownStock } from "../store";
import SearchableDropdown from "../components/SearchableDropdown";
import GodownAllocator from "../components/GodownAllocator";
import RateButton from "../components/RateButton";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  currentUser: string;
  viewOnlyRecord?: SalesRecord | null;
}

const emptyForm = () => ({
  customerName: "",
  type: "",
  ratePerBag: 0,
  bagSize: 50 as BagSize,
  godownAllocations: [] as GodownAllocation[],
  chitInKg: 0,
});

export default function SalesPage({ data, setData, currentUser, viewOnlyRecord }: Props) {
  const [showForm, setShowForm] = useState(!!viewOnlyRecord);
  const [form, setForm] = useState(viewOnlyRecord ? {
    customerName: viewOnlyRecord.customerName,
    type: viewOnlyRecord.type,
    ratePerBag: viewOnlyRecord.ratePerBag as number | string,
    bagSize: viewOnlyRecord.bagSize,
    godownAllocations: viewOnlyRecord.godownAllocations,
    chitInKg: viewOnlyRecord.chitInKg as number | string,
  } : emptyForm());
  const [editingId, setEditingId] = useState<string | null>(viewOnlyRecord ? viewOnlyRecord.id : null);
  const [showErrors, setShowErrors] = useState(false);
  const isViewOnly = !!viewOnlyRecord;
  const today = new Date();

  const totalBags = form.godownAllocations.reduce((s, a) => s + (Number(a.bags) || 0), 0);
  const chitBags = (form.bagSize !== 'service' && (Number(form.chitInKg) || 0) > 0) ? (Number(form.chitInKg) || 0) / form.bagSize : 0;
  const effectiveBags = totalBags + chitBags;
  const totalAmount = form.bagSize === 'service' ? (totalBags * (Number(form.ratePerBag) || 0)) : (effectiveBags * (Number(form.ratePerBag) || 0));

  const godownLimits: Record<string, number> = {};
  const stockInfo = getGodownStock(data);
  stockInfo.forEach(g => {
    if (form.type) {
      const item = g.milledItems.find(i => i.riceType === form.type);
      godownLimits[g.godownName] = item ? item.bags : 0;
    } else {
      godownLimits[g.godownName] = 0;
    }
  });

  const handleSave = () => {
    if (isViewOnly) return;

    if (!form.customerName || form.godownAllocations.length === 0 || !form.ratePerBag) { 
      setShowErrors(true);
      return; 
    }
    if ((Number(form.chitInKg) || 0) >= Number(form.bagSize)) { 
      alert("Chit amount must be less than the bag size."); 
      return; 
    }

    const record: SalesRecord = {
      id: editingId || generateId(),
      date: formatBengaliDate(today),
      gregorianDate: today.toISOString(),
      customerName: form.customerName,
      type: form.type,
      ratePerBag: Number(form.ratePerBag),
      bagSize: form.bagSize as BagSize,
      godownAllocations: form.godownAllocations,
      chitInKg: Number(form.chitInKg) || 0,
      totalBags,
      totalAmount,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };

    let newData: AppData;
    if (editingId) {
      newData = { ...data, sales: data.sales.map((s) => (s.id === editingId ? record : s)) };
      newData = addChangeLog(newData, currentUser, "Updated", "Sales", `Updated sale to ${form.customerName}`);
    } else {
      newData = { ...data, sales: [record, ...data.sales] };
      newData = addChangeLog(newData, currentUser, "Added", "Sales", `New sale to ${form.customerName}, ${totalBags} bags, ₹${totalAmount.toFixed(2)}`);
    }
    setData(newData);
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: SalesRecord) => {
    setForm({
      customerName: record.customerName,
      type: record.type,
      ratePerBag: record.ratePerBag,
      bagSize: record.bagSize,
      godownAllocations: record.godownAllocations,
      chitInKg: record.chitInKg,
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this sales record?")) return;
    const rec = data.sales.find((s) => s.id === id);
    let newData = { ...data, sales: data.sales.filter((s) => s.id !== id) };
    newData = addChangeLog(newData, currentUser, "Deleted", "Sales", `Deleted sale to ${rec?.customerName}`);
    setData(newData);
  };

  const addCustomer = (name: string) => {
    if (!data.customers.includes(name)) {
      setData({ ...data, customers: [...data.customers, name] });
    }
  };

  const addRiceType = (name: string) => {
    if (!data.riceTypes.includes(name)) {
      setData({ ...data, riceTypes: [...data.riceTypes, name] });
    }
  };

  const addGodown = (name: string) => {
    if (!data.godowns.includes(name)) {
      setData({ ...data, godowns: [...data.godowns, name] });
    }
  };

  if (showForm) {
    return (
      <div className="flex flex-col fixed inset-0 z-[60] h-[100dvh] bg-gray-50">
        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { setShowForm(false); setForm(emptyForm()); setEditingId(null); }}
            className="hover:bg-green-700 p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg">💰</span>
          <h2 className="text-lg font-semibold">{editingId ? "Edit Sale" : "Sales Form"}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Date */}
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <label className="block text-xs text-gray-500 mb-1 font-medium">Date</label>
            <div className="flex items-center justify-between text-sm text-gray-800">
              <span>{formatBengaliDate(today)}</span>
              <span>📅</span>
            </div>
          </div>

          {/* Customer Name */}
          <div className={`bg-white border rounded-xl p-3 ${showErrors && !form.customerName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}>
            <label className="block text-xs text-gray-500 mb-2 font-medium">Customer Name</label>
            <SearchableDropdown
              label="Customer Name"
              options={data.customers}
              value={form.customerName}
              onChange={(v) => !isViewOnly && setForm({ ...form, customerName: v })}
              onAddNew={(v) => !isViewOnly && addCustomer(v)}
              placeholder="Select or add customer..."
            />
          </div>

          {/* Type */}
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <label className="block text-xs text-gray-500 mb-2 font-medium">Rice Type</label>
            <SearchableDropdown
              label="Rice Type"
              options={data.riceTypes}
              value={form.type}
              onChange={(v) => !isViewOnly && setForm({ ...form, type: v })}
              onAddNew={(v) => !isViewOnly && addRiceType(v)}
              placeholder="Select or add type..."
            />
          </div>

          {/* Rate */}
          <div className={`bg-white border rounded-xl p-3 ${showErrors && !form.ratePerBag ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}>
            <label className="block text-xs text-gray-500 mb-2 font-medium">
              Rate <span className="text-green-600">(click circle to toggle 50/25 kg, click rate to edit)</span>
            </label>
            <RateButton
              rate={form.ratePerBag}
              bagSize={form.bagSize}
              onRateChange={(r) => !isViewOnly && setForm({ ...form, ratePerBag: r })}
              onBagSizeChange={(s) => !isViewOnly && setForm({ ...form, bagSize: s })}
              isInvalid={showErrors && !form.ratePerBag}
            />
          </div>

          {/* Godown Allocations */}
          <div className={`bg-white border rounded-xl p-3 ${showErrors && form.godownAllocations.length === 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}>
            <label className="block text-xs text-gray-500 mb-2 font-medium">
              {form.bagSize === 'service' ? 'Destination of Godown' : 'Godowns'} <span className="text-green-600">(select multiple, enter bags for each)</span>
            </label>
            <GodownAllocator
              godowns={data.godowns}
              allocations={form.godownAllocations}
              onChange={(allocs) => !isViewOnly && setForm({ ...form, godownAllocations: allocs })}
              onAddGodown={(v) => !isViewOnly && addGodown(v)}
              godownLimits={form.bagSize === 'service' ? undefined : godownLimits}
            />
          </div>

          {/* Chit in KG */}
          {form.bagSize !== 'service' && (
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <label className="block text-xs text-gray-500 mb-2 font-medium">
                Chit in KG <span className="text-gray-400">(extra kg beyond full bags)</span>
              </label>
              <div className={`flex items-center border rounded-lg overflow-hidden ${showErrors && (Number(form.chitInKg) || 0) >= (form.bagSize as number) ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => !isViewOnly && setForm({ ...form, chitInKg: Math.max(0, (Number(form.chitInKg) || 0) - 1) })}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 text-lg font-bold border-r border-gray-200 transition-colors"
                  disabled={isViewOnly}
                >—</button>
                <input
                  type="number"
                  value={form.chitInKg}
                  onChange={(e) => !isViewOnly && setForm({ ...form, chitInKg: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                  className="flex-1 text-center py-2.5 text-sm focus:outline-none"
                  min={0}
                  disabled={isViewOnly}
                />
                <button
                  type="button"
                  onClick={() => !isViewOnly && setForm({ ...form, chitInKg: (Number(form.chitInKg) || 0) + 1 })}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 text-lg font-bold border-l border-gray-200 transition-colors"
                  disabled={isViewOnly}
                >+</button>
              </div>
              {Number(form.chitInKg) > 0 && (
                <p className="text-xs text-green-600 mt-1.5">
                  {form.chitInKg}kg ÷ {form.bagSize}kg = {(Number(form.chitInKg) / (form.bagSize as number)).toFixed(3)} extra bags
                </p>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Bags (allocated)</span>
              <span className="font-semibold text-gray-800">{totalBags}</span>
            </div>
            {Number(form.chitInKg) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Effective Bags (incl. chit)</span>
                <span className="font-semibold text-gray-800">{effectiveBags.toFixed(3)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-lg font-bold text-green-600">₹ {new Intl.NumberFormat('en-IN').format(totalAmount)}</span>
            </div>
          </div>
        </div>

        {!isViewOnly && (
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex justify-between items-center flex-shrink-0">
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm()); setEditingId(null); setShowErrors(false); }}
              className="text-gray-600 font-medium px-6 py-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-green-600 font-bold px-8 py-2.5 hover:bg-green-50 rounded-xl transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Sales</h2>
          <p className="text-xs text-gray-400">{formatBengaliDate(today)}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>+</span> New Sale
        </button>
      </div>

      {data.sales.length > 0 && (
        <div className="flex gap-3 px-4 py-2 bg-[#0f1923] border-b border-gray-700 flex-shrink-0">
          <div className="text-xs text-gray-400">
            Total: <span className="text-white font-medium">{data.sales.reduce((s, s2) => s + s2.totalBags, 0)} bags</span>
          </div>
          <div className="text-xs text-gray-400">
            Revenue: <span className="text-green-400 font-medium">₹{new Intl.NumberFormat('en-IN').format(data.sales.reduce((s, s2) => s + s2.totalAmount, 0))}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {data.sales.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-3">💰</div>
            <p className="font-medium text-gray-400">No sales yet</p>
            <p className="text-sm mt-1 text-gray-500">Click "New Sale" to add one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.sales.map((s) => (
              <div key={s.id} className="bg-[#1e2a3a] border border-gray-700 rounded-xl p-4 hover:border-green-600 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white">{s.customerName}</p>
                    <p className="text-xs text-gray-400">{s.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">₹{new Intl.NumberFormat('en-IN').format(s.totalAmount)}</p>
                    <p className="text-xs text-gray-400">{s.totalBags} bags</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  {s.type && <span className="bg-gray-700 px-2 py-0.5 rounded">{s.type}</span>}
                  <span>₹{new Intl.NumberFormat('en-IN').format(s.ratePerBag)}/{s.bagSize}kg</span>
                  {s.chitInKg > 0 && <span className="text-orange-400">Chit: {s.chitInKg}kg</span>}
                  {s.godownAllocations.map((a) => (
                    <span key={a.godownName} className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded">
                      {a.godownName}: {a.bags}bg
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-500">
                  <span>By: {s.createdBy}</span>
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 transition-colors">Delete</button>
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
