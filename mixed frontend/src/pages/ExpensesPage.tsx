import { useState } from "react";
import type { AppData, ExpenseRecord } from "../store";
import { generateId, formatBengaliDate, addChangeLog } from "../store";
import { DollarSign, Calendar, Plus, History, Trash2 } from 'lucide-react';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  currentUser: string;
}

export default function ExpensesPage({ data, setData, currentUser }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: 'Electricity',
    amount: 0,
    description: '',
  });

  const today = new Date();
  const CATEGORIES = ['Electricity', 'Maintenance', 'Fuel', 'Office Supplies', 'Other'];

  const handleSave = () => {
    if (form.amount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }
    if (!form.category) {
      alert("Please select a category");
      return;
    }

    const record: ExpenseRecord = {
      id: generateId(),
      date: formatBengaliDate(today),
      gregorianDate: today.toISOString(),
      category: form.category,
      amount: form.amount,
      description: form.description,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };

    let newData = { ...data, expenses: [record, ...data.expenses] };
    newData = addChangeLog(newData, currentUser, "Added", "Expenses", `Added ₹${form.amount} for ${form.category}`);
    setData(newData);
    setForm({ category: 'Electricity', amount: 0, description: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    const rec = data.expenses.find(e => e.id === id);
    let newData = { ...data, expenses: data.expenses.filter((e) => e.id !== id) };
    if (rec) {
      newData = addChangeLog(newData, currentUser, "Deleted", "Expenses", `Deleted ₹${rec.amount} for ${rec.category}`);
    }
    setData(newData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Expenses</h2>
          <p className="text-slate-400 text-sm mt-1">Manage general business expenses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-lg shadow-green-600/20"
        >
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Expense</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4">New Expense Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description (Optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. November Electricity Bill"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-green-600/20"
            >
              Save Expense
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        {data.expenses.length === 0 ? (
           <div className="text-center py-16 text-gray-500">
             <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
             <p className="font-medium text-slate-300">No expenses recorded</p>
             <p className="text-sm mt-1">Expenses like Electricity will appear here</p>
           </div>
        ) : (
          <div className="space-y-3">
            {data.expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/20 text-amber-400 border border-amber-600/30">
                    {expense.category}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{expense.description || "No description"}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {expense.date}
                      </span>
                      <span>•</span>
                      <span>By {expense.createdBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-white">₹{expense.amount.toFixed(2)}</span>
                  <button onClick={() => handleDelete(expense.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
