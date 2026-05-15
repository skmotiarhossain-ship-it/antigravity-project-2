import { useState } from "react";
import type { AppData } from "../store";
import { PieChart, Calculator, TrendingUp, DollarSign, ArrowRight, Info, Package } from 'lucide-react';
import SearchableDropdown from "../components/SearchableDropdown";

interface Props {
  data: AppData;
}

export default function ProfitPredictorPage({ data }: Props) {
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [fixedCharges, setFixedCharges] = useState<number>(0);
  const [sellPricePerKg, setSellPricePerKg] = useState<number>(0);
  const [kgPerBag, setKgPerBag] = useState<number>(50);

  // Get unique batch numbers
  const batchNumbers = Array.from(new Set(data.processes.map(p => p.batchNo))).filter(Boolean);

  // Calculate stats for the selected batch
  let purchaseCost = 0;
  let processCost = 0;
  let steamedBags = 0;
  let milledBags = 0;
  let riceType = "";
  
  let steamingCost = 0;
  let boilingCost = 0;
  let dryingCost = 0;
  let millingCost = 0;

  if (selectedBatch) {
    const processes = data.processes.filter(p => p.batchNo === selectedBatch);
    
    processes.forEach(p => {
      const cost = p.totalWages + p.transportCost;
      processCost += cost;
      
      if (p.processType === "steaming") {
        steamedBags += p.totalBags;
        riceType = p.riceType || riceType;
        steamingCost += cost;
      }
      if (p.processType === "boiling") boilingCost += cost;
      if (p.processType === "drying") dryingCost += cost;
      if (p.processType === "milling") {
        milledBags += p.totalBags;
        millingCost += cost;
      }
    });

    // Estimate purchase cost based on average price of that rice type
    if (steamedBags > 0) {
      const relevantPurchases = riceType 
        ? data.purchases.filter(p => p.type === riceType)
        : data.purchases;
        
      let totalPurchaseAmt = 0;
      let totalPurchaseBags = 0;
      
      relevantPurchases.forEach(p => {
        totalPurchaseAmt += p.totalAmount;
        totalPurchaseBags += p.totalBags;
      });

      const avgRatePerBag = totalPurchaseBags > 0 ? totalPurchaseAmt / totalPurchaseBags : 0;
      purchaseCost = avgRatePerBag * steamedBags;
    }
  }

  const totalCost = purchaseCost + processCost + fixedCharges;
  
  // Output bags: If milled, use milled bags. Else estimate 1:1 or use steamed bags for math.
  // Actually, standard bag size is usually 50kg or 25kg. We'll assume standard 50kg output bag.
  const effectiveOutputBags = milledBags > 0 ? milledBags : steamedBags;
  const estimatedOutputKg = effectiveOutputBags * kgPerBag;

  const breakEvenPerBag = effectiveOutputBags > 0 ? totalCost / effectiveOutputBags : 0;
  const breakEvenPerKg = estimatedOutputKg > 0 ? totalCost / estimatedOutputKg : 0;

  const predictedRevenue = estimatedOutputKg * sellPricePerKg;
  const predictedProfit = predictedRevenue - totalCost;
  const profitMargin = predictedRevenue > 0 ? (predictedProfit / predictedRevenue) * 100 : 0;

  return (
    <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-400" />
            Profit Predictor
          </h2>
          <p className="text-slate-400 text-sm mt-1">Calculate break-even and margins for batches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto pb-6">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Parameters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Select Batch</label>
                <SearchableDropdown
                  label="Batch Number"
                  options={batchNumbers}
                  value={selectedBatch}
                  onChange={setSelectedBatch}
                  placeholder="Select batch..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Fixed Charges (₹)</label>
                <p className="text-xs text-slate-500 mb-2">Manual entry for overheads (electricity, rent, etc.)</p>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    value={fixedCharges || ""}
                    onChange={e => setFixedCharges(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Target Selling Price (₹/kg)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={sellPricePerKg || ""}
                      onChange={e => setSellPricePerKg(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Yield (KG per Bag)</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={kgPerBag || ""}
                      onChange={e => setKgPerBag(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex gap-3 text-sm text-slate-400">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <p>Purchase cost is estimated using the global average purchase price for the batch's specific rice type.</p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedBatch ? (
            <div className="h-full bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <Calculator className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-medium text-slate-300">No Batch Selected</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Select a batch number from the left panel to calculate costs and predict profit margins.</p>
            </div>
          ) : (
            <>
              {/* Cost Breakdown */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Raw Material (Estimated)</span>
                      <span className="font-medium text-white">₹{purchaseCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Steaming Cost</span>
                      <span className="font-medium text-slate-300">₹{steamingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Boiling Cost</span>
                      <span className="font-medium text-slate-300">₹{boilingCost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Drying Cost</span>
                      <span className="font-medium text-slate-300">₹{dryingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Milling Cost</span>
                      <span className="font-medium text-slate-300">₹{millingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-slate-700 pt-2">
                      <span className="text-slate-400">Fixed Charges</span>
                      <span className="font-medium text-orange-400">₹{fixedCharges.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-600 flex justify-between items-center">
                  <span className="text-lg text-slate-300 font-medium">Total Cost</span>
                  <span className="text-2xl font-bold text-red-400">₹{totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Break-even & Predictions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
                  <h4 className="text-slate-400 text-sm font-medium mb-1">Break-Even Point</h4>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-white">₹{breakEvenPerKg.toFixed(2)}</span>
                    <span className="text-slate-500 text-sm">/ kg</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950/50 p-2 rounded-lg">
                    <Package className="w-4 h-4" />
                    <span>Based on {effectiveOutputBags} bags (~{estimatedOutputKg}kg)</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-br border rounded-xl p-5 shadow-lg ${predictedProfit >= 0 ? 'from-emerald-900/20 to-emerald-800/10 border-emerald-500/30' : 'from-red-900/20 to-red-800/10 border-red-500/30'}`}>
                  <h4 className="text-slate-400 text-sm font-medium mb-1">Predicted Profit/Loss</h4>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-3xl font-bold ${predictedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {predictedProfit >= 0 ? '+' : ''}₹{predictedProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Margin: <strong className={predictedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>{profitMargin.toFixed(1)}%</strong></span>
                    <span className="text-slate-400">Revenue: ₹{predictedRevenue.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
