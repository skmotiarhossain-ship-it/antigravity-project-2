import { useState, useEffect } from "react";
import type { AppData } from "./store";
import { DEFAULT_DATA, loadLocalData, saveLocalData } from "./store";
import { authAPI, stateAPI, getToken, setToken, removeToken, onAuthError } from "./utils/api";
import DashboardPage from "./pages/DashboardPage";
import PurchasePage from "./pages/PurchasePage";
import SalesPage from "./pages/SalesPage";
import ProcessPage from "./pages/ProcessPage";
import ChangeLogPage from "./pages/ChangeLogPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProfilesPage from "./pages/ProfilesPage";
import CashRegisterPage from "./pages/CashRegisterPage";
import ProfitPredictorPage from "./pages/ProfitPredictorPage";
import {
  ShoppingCart, Factory, TrendingUp, LayoutDashboard,
  LogOut, ChevronDown, ChevronUp, History, User, AlertTriangle, Package, Thermometer, Droplets, Wind, Cog, DollarSign,
  Users, CreditCard, PieChart, Menu, X, Activity, MapPin, Loader2
} from 'lucide-react';

type Page =
  | "dashboard"
  | "purchase"
  | "sales"
  | "process-steaming"
  | "process-boiling"
  | "process-drying"
  | "process-milling"
  | "expenses"
  | "changelog"
  | "profiles"
  | "cashregister"
  | "profitpredictor";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const [page, setPage] = useState<Page>("dashboard");
  const [viewOnlyRecord, setViewOnlyRecord] = useState<any>(null);
  const [processExpanded, setProcessExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize with DEFAULT_DATA so types are safe, we'll overwrite it soon
  const [data, setDataState] = useState<AppData>(DEFAULT_DATA);

  const fetchInitialData = async () => {
    setIsFetchingData(true);
    try {
      const fetchedData = await stateAPI.fetchState();
      setDataState({ ...DEFAULT_DATA, ...fetchedData });
      saveLocalData({ ...DEFAULT_DATA, ...fetchedData });
    } catch (err) {
      console.error("Failed to fetch state from backend, falling back to local storage:", err);
      setDataState(loadLocalData());
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    const setupAuth = () => {
      onAuthError(() => {
        setLoggedIn(false);
        setCurrentUser("");
        sessionStorage.removeItem("mh_current_user");
      });

      const token = getToken();
      const savedUser = sessionStorage.getItem("mh_current_user");
      
      if (token && savedUser) {
        setCurrentUser(savedUser);
        setLoggedIn(true);
        fetchInitialData();
      }
    };
    setupAuth();
  }, []);

  const setData = (newData: AppData) => {
    setDataState(newData);
    saveLocalData(newData);
    
    // Async push to backend
    stateAPI.saveState(newData).catch(err => {
      console.error("Failed to sync data to backend:", err);
      // Optional: Add some user facing toast notification here
    });
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setLoginError("");

    try {
      const res = await authAPI.login(loginUsername, loginPassword);
      setToken(res.token);
      setCurrentUser(res.user.displayName);
      setLoggedIn(true);
      sessionStorage.setItem("mh_current_user", res.user.displayName);
      
      await fetchInitialData();
    } catch (err: any) {
      setLoginError(err.message || "Invalid username or password.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser("");
    sessionStorage.removeItem("mh_current_user");
    removeToken();
    setPage("dashboard");
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MH Rice Mill</h1>
            <p className="text-slate-400 mt-1">Business Tracker</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={e => { setLoginUsername(e.target.value); setLoginError(''); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter username"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter password"
                  />
                </div>
              </div>
              {loginError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-400 text-sm">{loginError}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-green-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage data={data} />;
      case "purchase": return <PurchasePage data={data} setData={setData} currentUser={currentUser} viewOnlyRecord={viewOnlyRecord} />;
      case "sales": return <SalesPage data={data} setData={setData} currentUser={currentUser} viewOnlyRecord={viewOnlyRecord} />;
      case "process-steaming": return <ProcessPage data={data} setData={setData} currentUser={currentUser} subType="steaming" viewOnlyRecord={viewOnlyRecord} />;
      case "process-boiling": return <ProcessPage data={data} setData={setData} currentUser={currentUser} subType="boiling" viewOnlyRecord={viewOnlyRecord} />;
      case "process-drying": return <ProcessPage data={data} setData={setData} currentUser={currentUser} subType="drying" viewOnlyRecord={viewOnlyRecord} />;
      case "process-milling": return <ProcessPage data={data} setData={setData} currentUser={currentUser} subType="milling" viewOnlyRecord={viewOnlyRecord} />;
      case "expenses": return <ExpensesPage data={data} setData={setData} currentUser={currentUser} />;
      case "changelog": return <ChangeLogPage data={data} onViewRecord={(page, record) => { setPage(page as Page); setViewOnlyRecord(record); }} />;
      case "profiles": return <ProfilesPage data={data} setData={setData} currentUser={currentUser} />;
      case "cashregister": return <CashRegisterPage data={data} setData={setData} currentUser={currentUser} />;
      case "profitpredictor": return <ProfitPredictorPage data={data} />;
      default: return <DashboardPage data={data} />;
    }
  };

  // Exact required order: Dashboard, Purchase, Process, Sales, Profile, Cash Register, Profit Predictor, Expenses, Activity Log
  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchase' as Page, label: 'Purchase', icon: ShoppingCart },
    { id: 'process', label: 'Process', icon: Factory, children: [
      { id: 'process-steaming' as Page, label: 'Steaming', icon: Thermometer },
      { id: 'process-boiling' as Page, label: 'Boiling', icon: Droplets },
      { id: 'process-drying' as Page, label: 'Drying', icon: Wind },
      { id: 'process-milling' as Page, label: 'Milling', icon: Cog },
    ]},
    { id: 'sales' as Page, label: 'Sales', icon: TrendingUp },
    { id: 'profiles' as Page, label: 'Profiles', icon: Users },
    { id: 'cashregister' as Page, label: 'Cash Register', icon: CreditCard },
    { id: 'profitpredictor' as Page, label: 'Profit Predictor', icon: PieChart },
    { id: 'expenses' as Page, label: 'Expenses', icon: DollarSign },
    { id: 'changelog' as Page, label: 'Activity Log', icon: History },
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-900 overflow-hidden overflow-x-hidden relative">
      {/* Universal Top Bar */}
      <div className="flex items-center justify-between bg-slate-950 border-b border-slate-800 p-4 shrink-0 z-40 relative">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-400 hover:text-white mr-2">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-white font-semibold text-sm">MH Rice Mill</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
            {currentUser.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setMenuOpen(false)} />
      )}

      {/* Slide-out Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen shrink-0 transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">MH Rice Mill</h1>
              <p className="text-slate-500 text-xs">Business Tracker</p>
            </div>
          </div>
          {/* Close button for drawer */}
          <button className="text-slate-400 hover:text-white" onClick={() => setMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <div key={item.id}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => setProcessExpanded(!processExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      processExpanded ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {processExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {processExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-3">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => { setPage(child.id); setViewOnlyRecord(null); setMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            page === child.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                          }`}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => { setPage(item.id as Page); setViewOnlyRecord(null); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    page === item.id
                      ? 'bg-blue-600/20 text-blue-400 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser}</p>
              <p className="text-slate-500 text-xs">Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 relative">
          {isFetchingData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-400 font-medium animate-pulse">Syncing data...</p>
            </div>
          ) : null}
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
