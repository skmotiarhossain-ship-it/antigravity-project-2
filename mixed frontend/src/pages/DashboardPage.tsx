import type { AppData } from "../store";
import { formatBengaliDate, getGodownStock, getBatchProgress } from "../store";
import { ShoppingCart, TrendingUp, Factory, DollarSign, Calendar, BarChart3, Package, Beaker, FlaskConical, Activity } from 'lucide-react';

interface Props {
  data: AppData;
}

export default function DashboardPage({ data }: Props) {
  const today = new Date();

  const totalPurchased = data.purchases.reduce((s, p) => s + p.totalBags, 0);
  const totalSold = data.sales.reduce((s, s2) => s + s2.totalBags, 0);
  const totalPurchaseAmount = data.purchases.reduce((s, p) => s + p.totalAmount, 0);
  const totalSalesAmount = data.sales.reduce((s, s2) => s + s2.totalAmount, 0);
  const totalWages = data.processes.reduce((s, p) => s + p.totalWages, 0);
  const totalTransport = data.processes.reduce((s, p) => s + p.transportCost, 0);
  
  const totalProcessCost = totalWages + totalTransport;
  const netProfit = totalSalesAmount - totalPurchaseAmount - totalProcessCost;

  // Minimum sell price predictor
  const avgPurchaseRate = totalPurchased > 0
    ? totalPurchaseAmount / totalPurchased
    : 0;
  const processCostPerBag = totalPurchased > 0 ? totalProcessCost / totalPurchased : 0;
  const minSellPrice = avgPurchaseRate + processCostPerBag;

  const stats = [
    { label: 'Total Purchases', value: `₹${totalPurchaseAmount.toFixed(0)}`, sub: `${totalPurchased} bags`, icon: ShoppingCart, accent: 'text-blue-500', iconBg: 'bg-blue-500/10' },
    { label: 'Total Sales', value: `₹${totalSalesAmount.toFixed(0)}`, sub: `${totalSold} bags`, icon: TrendingUp, accent: 'text-green-500', iconBg: 'bg-green-500/10' },
    { label: 'Process Cost', value: `₹${totalProcessCost.toFixed(0)}`, sub: 'wages+transport', icon: Factory, accent: 'text-purple-500', iconBg: 'bg-purple-500/10' },
    { label: 'Net P&L', value: `${netProfit >= 0 ? "+" : ""}₹${netProfit.toFixed(0)}`, sub: netProfit >= 0 ? "Profit" : "Loss", icon: DollarSign, accent: netProfit >= 0 ? 'text-emerald-500' : 'text-red-500', iconBg: netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
  ];

  // Calculate stock under process
  const totalSteamed = data.processes.filter(p => p.processType === "steaming").reduce((s, p) => s + p.totalBags, 0);
  const totalMilledProgress = data.processes.filter(p => p.processType === "milling").reduce((s, p) => s + p.totalBags, 0);
  const totalUnderProcess = totalSteamed - totalMilledProgress;

  const godownStock = getGodownStock(data);

  // Helper for colors
  const typeColors = [
    'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]', 
    'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]', 
    'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]', 
    'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]', 
    'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
  ];
  
  const getColorForType = (type: string) => {
    // Determine a stable index for the type based on characters
    let sum = 0;
    for (let i = 0; i < type.length; i++) sum += type.charCodeAt(i);
    return typeColors[sum % typeColors.length];
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between shrink-0 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Overview of your rice business</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 shadow-sm mt-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-white text-xs font-medium whitespace-nowrap">{formatBengaliDate(today)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 space-y-6">
        {/* Stats Grid */}
<<<<<<< HEAD
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 shadow-sm hover:border-slate-600 transition-colors">
=======
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className={`bg-slate-900 border ${stat.border} rounded-xl p-4 shadow-sm`}>
>>>>>>> fee345cceba34562c168eb10b8b583444352fc2a
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
                <div className={`p-1.5 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.accent}`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white mb-0.5">{stat.value}</p>
              <p className={`text-[10px] sm:text-xs font-medium ${stat.accent}`}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            Stock Under Process
          </h3>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 border-t-orange-400 animate-[spin_10s_linear_infinite]"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-400">{totalUnderProcess}</p>
                <p className="text-xs text-slate-400 mt-1">Total Bags</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-6 text-center px-4">Bags currently in Steaming, Boiling, or Drying stages.</p>
          </div>
        </div>

        {/* Stock Visualization */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Purchase Stock (Beakers - Raw Material) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-400" />
              Raw Material Stock (Purchased)
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {godownStock.map(godown => {
                const totalRaw = godown.totalRaw;
                const maxScale = Math.max(totalRaw * 1.2, 500); // dynamic scale

                return (
                  <div key={godown.godownName} className="flex flex-col items-center">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 text-center">{godown.godownName}</h4>
                    
                    {/* Beaker Container */}
                    <div className="relative w-20 h-40 border-2 border-slate-500 rounded-b-3xl rounded-t-sm overflow-hidden bg-slate-800/80 flex flex-col justify-end shadow-inner mb-3">
                      {/* Measurement lines */}
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2 opacity-40 z-10 pointer-events-none">
                        <div className="w-2 h-[1px] bg-white"></div>
                        <div className="w-2 h-[1px] bg-white"></div>
                        <div className="w-2 h-[1px] bg-white"></div>
                        <div className="w-2 h-[1px] bg-white"></div>
                      </div>
                      {/* Glare */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none" />
                      
                      {/* Stacked Liquids */}
                      {totalRaw === 0 ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[10px] text-slate-500 rotate-90">EMPTY</span>
                        </div>
                      ) : (
                        godown.rawItems.map((item, idx) => {
                          const heightPct = (item.bags / maxScale) * 100;
                          return (
                            <div 
                              key={idx}
                              className={`w-full transition-all duration-1000 ease-out border-b border-black/20 relative group ${getColorForType(item.riceType)}`} 
                              style={{ height: `${Math.max(2, heightPct)}%` }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                {heightPct >= 10 && <span className="text-[10px] font-bold text-white drop-shadow-md">{item.bags}bg</span>}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded shadow z-20 whitespace-nowrap pointer-events-none">
                                {item.riceType}: {item.bags}bg
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">{totalRaw}</p>
                      <p className="text-xs text-slate-500">Bags Total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sales Stock (Flasks - Milled Material) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              Ready for Sale Stock (Milled)
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {godownStock.map(godown => {
                const totalMilled = godown.totalMilled;
                const maxScale = Math.max(totalMilled * 1.2, 500);

                return (
                  <div key={godown.godownName} className="flex flex-col items-center">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 text-center">{godown.godownName}</h4>
                    
                    {/* Flask Container */}
                    <div className="relative w-24 h-40 flex flex-col justify-end items-center mb-3 group">
                      {/* Flask Neck */}
                      <div className="w-6 h-10 border-x-2 border-t-2 border-slate-500 bg-slate-800/80 rounded-t-sm relative z-10 border-b-0">
                         {/* Liquid inside neck if full */}
                         <div className="absolute bottom-0 w-full bg-emerald-500 opacity-0 transition-opacity"></div>
                      </div>
                      
                      {/* Flask Body (Triangle/Conical) */}
                      <div className="w-full h-30 relative overflow-hidden flex flex-col justify-end items-center">
                         {/* We use a clip-path for the conical flask shape */}
                         <div 
                           className="absolute inset-0 bg-slate-800/80 border-2 border-slate-500 flex flex-col justify-end items-center pb-1 shadow-inner overflow-hidden"
                           style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)', borderRadius: '0 0 10% 10%' }}
                         >
                            {/* Glare */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none" />
                            
                            {/* Stacked Liquids */}
                            {totalMilled === 0 ? (
                              <div className="absolute inset-0 flex items-center justify-center pb-4">
                                <span className="text-[10px] text-slate-500">EMPTY</span>
                              </div>
                            ) : (
                              <div className="w-[120%] flex flex-col justify-end items-center flex-1 pb-1">
                                {godown.milledItems.map((item, idx) => {
                                  const heightPct = (item.bags / maxScale) * 100;
                                  return (
                                    <div 
                                      key={idx}
                                      className={`w-full transition-all duration-1000 ease-out border-b border-black/20 relative group-hover:brightness-110 ${getColorForType(item.riceType)}`} 
                                      style={{ height: `${Math.max(2, heightPct)}%` }}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                        {heightPct >= 10 && <span className="text-[10px] font-bold text-white drop-shadow-md">{item.bags}bg</span>}
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded shadow z-20 whitespace-nowrap pointer-events-none">
                                        {item.riceType}: {item.bags}bg
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">{totalMilled}</p>
                      <p className="text-xs text-slate-500">Bags Ready</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
