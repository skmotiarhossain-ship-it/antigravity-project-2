import { useState, useEffect } from "react";
import type { AppData, Profile } from "../store";
import { generateId, addChangeLog } from "../store";
import { Users, UserPlus, Phone, MapPin, Briefcase, Search, Edit2, Trash2, Tag } from 'lucide-react';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  currentUser: string;
}

const emptyProfile = (): Profile => ({
  id: "",
  name: "",
  type: "customer",
  phone: "",
  address: "",
});

export default function ProfilesPage({ data, setData, currentUser }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Profile>(emptyProfile());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "customer" | "supplier" | "worker">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check for incomplete profiles on mount
  useEffect(() => {
    const incompleteCount = (data.profiles || []).filter(p => !p.phone || !p.address).length;
    if (incompleteCount > 0) {
      setToastMessage(`${incompleteCount} profiles are incomplete (missing phone or address)`);
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data.profiles]);

  // Auto-migrate string arrays to profiles if they don't exist
  useEffect(() => {
    let modified = false;
    const newProfiles = [...(data.profiles || [])];

    const ensureProfile = (name: string, type: "customer" | "supplier" | "worker") => {
      if (!newProfiles.find(p => p.name === name && p.type === type)) {
        newProfiles.push({ id: generateId(), name, type, phone: "", address: "" });
        modified = true;
      }
    };

    (data.customers || []).forEach(n => ensureProfile(n, "customer"));
    (data.suppliers || []).forEach(n => ensureProfile(n, "supplier"));
    (data.workers || []).forEach(n => ensureProfile(n, "worker"));

    if (modified) {
      setData({ ...data, profiles: newProfiles });
    }
  }, [data.customers, data.suppliers, data.workers, data.profiles, setData, data]);

  const handleSave = () => {
    if (!form.name.trim()) { alert("Name is required."); return; }

    const isEdit = !!form.id;
    const profile: Profile = {
      ...form,
      id: isEdit ? form.id : generateId(),
      name: form.name.trim()
    };

    let newData = { ...data };

    if (isEdit) {
      newData.profiles = newData.profiles.map(p => p.id === profile.id ? profile : p);
      newData = addChangeLog(newData, currentUser, "Updated", "Profiles", `Updated ${profile.type} profile: ${profile.name}`);
    } else {
      newData.profiles = [profile, ...newData.profiles];
      newData = addChangeLog(newData, currentUser, "Added", "Profiles", `Added new ${profile.type}: ${profile.name}`);
      
      // Also sync to old string arrays for backward compatibility
      if (profile.type === "customer" && !newData.customers.includes(profile.name)) newData.customers.push(profile.name);
      if (profile.type === "supplier" && !newData.suppliers.includes(profile.name)) newData.suppliers.push(profile.name);
      if (profile.type === "worker" && !newData.workers.includes(profile.name)) newData.workers.push(profile.name);
    }

    setData(newData);
    setForm(emptyProfile());
    setShowForm(false);
  };

  const handleEdit = (profile: Profile) => {
    setForm({ ...profile });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this profile? Existing records using this name won't be deleted, but the profile will be removed.")) return;
    const profile = (data.profiles || []).find(p => p.id === id);
    let newData = { ...data, profiles: (data.profiles || []).filter(p => p.id !== id) };
    if (profile) {
      newData = addChangeLog(newData, currentUser, "Deleted", "Profiles", `Deleted profile: ${profile.name}`);
    }
    setData(newData);
  };

  const filteredProfiles = (data.profiles || []).filter(p => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.phone.includes(search)) return false;
    return true;
  });

  if (showForm) {
    return (
      <div className="flex flex-col h-full bg-slate-900">
        <div className="bg-slate-800 text-white px-4 py-4 flex items-center gap-3 border-b border-slate-700">
          <button onClick={() => { setShowForm(false); setForm(emptyProfile()); }} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-semibold">{form.id ? "Edit Profile" : "New Profile"}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Role/Type</label>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                {(["customer", "supplier", "worker"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type })}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${form.type === type ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-950 p-4 flex justify-end gap-3 shrink-0">
          <button onClick={() => { setShowForm(false); setForm(emptyProfile()); }} className="px-6 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors">
            Save Profile
          </button>
        </div>
      </div>
    );
  }

  const roleColors = {
    customer: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    supplier: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    worker: "text-amber-400 bg-amber-400/10 border-amber-400/20"
  };

  return (
    <div className="flex flex-col h-full relative">
      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl font-medium animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Profiles
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage all business contacts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="supplier">Suppliers</option>
          <option value="worker">Workers</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
          {filteredProfiles.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No profiles found.</p>
            </div>
          ) : (
            filteredProfiles.map((profile) => (
              <div key={profile.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors group relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{profile.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border mt-1 ${roleColors[profile.type]}`}>
                      {profile.type === 'customer' && <Briefcase className="w-3 h-3" />}
                      {profile.type === 'supplier' && <Tag className="w-3 h-3" />}
                      {profile.type === 'worker' && <Users className="w-3 h-3" />}
                      {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(profile)} className="text-slate-400 hover:text-blue-400 p-1.5 rounded-md hover:bg-blue-400/10">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(profile.id)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-slate-400">
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                    <span>{profile.phone || <span className="text-slate-600 italic">No phone</span>}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                    <span>{profile.address || <span className="text-slate-600 italic">No address</span>}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
