import { useState } from "react";

interface RateButtonProps {
  rate: number | string;
  bagSize: 50 | 25 | 'service';
  onRateChange: (rate: number | string) => void;
  onBagSizeChange: (size: 50 | 25 | 'service') => void;
  isInvalid?: boolean;
}

export default function RateButton({ rate, bagSize, onRateChange, onBagSizeChange, isInvalid }: RateButtonProps) {
  const [editingRate, setEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(rate.toString());

  const handleRateClick = () => {
    setTempRate(rate.toString());
    setEditingRate(true);
  };

  const handleRateConfirm = () => {
    if (tempRate.trim() === "") {
      onRateChange("");
    } else {
      const parsed = parseFloat(tempRate);
      if (!isNaN(parsed)) onRateChange(parsed);
    }
    setEditingRate(false);
  };

  const toggleBagSize = () => {
    if (bagSize === 50) onBagSizeChange(25);
    else if (bagSize === 25) onBagSizeChange('service');
    else onBagSizeChange(50);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bag size indicator - clickable to toggle */}
      <button
        type="button"
        onClick={toggleBagSize}
        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-colors flex-shrink-0 ${bagSize === 'service' ? 'bg-blue-100 border-2 border-blue-500 text-blue-700 text-xs' : 'bg-green-100 border-2 border-green-500 text-green-700 hover:bg-green-200'}`}
        title="Click to toggle bag size (50kg / 25kg / Service)"
      >
        {bagSize === 'service' ? 'SRV' : bagSize}
      </button>

      {/* Rate value - clickable to edit */}
      {editingRate ? (
        <div className="flex items-center gap-1 flex-1">
          <span className="text-gray-500">₹</span>
          <input
            autoFocus
            type="number"
            value={tempRate}
            onChange={(e) => setTempRate(e.target.value)}
            onBlur={handleRateConfirm}
            onKeyDown={(e) => e.key === "Enter" && handleRateConfirm()}
            className="flex-1 border border-green-500 rounded-lg px-2 py-2 text-sm focus:outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRateClick}
          className={`flex-1 flex items-center border rounded-lg px-3 py-2 bg-white transition-colors text-left ${isInvalid ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 hover:border-green-500'}`}
          title="Click to edit rate"
        >
          <span className="text-gray-500 mr-1">₹</span>
          <span className="text-gray-900 font-medium">
            {rate === "" ? "" : new Intl.NumberFormat('en-IN').format(Number(rate))}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            {bagSize === 'service' ? 'Service Charge' : `per ${bagSize}kg bag`}
          </span>
        </button>
      )}

      {/* Dash/minus button to enter rate quickly */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onRateChange(Math.max(0, (Number(rate) || 0) - 1))}
          className="w-8 h-4 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold"
        >—</button>
        <button
          type="button"
          onClick={() => onRateChange((Number(rate) || 0) + 1)}
          className="w-8 h-4 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold"
        >+</button>
      </div>
    </div>
  );
}
