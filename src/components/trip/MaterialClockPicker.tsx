import React, { useState, useEffect, useMemo } from "react";
import { Keyboard, Clock } from "lucide-react";

interface MaterialClockPickerProps {
  value: string;
  onChange: (newValue: string) => void;
  onClose: () => void;
}

const parseStartTime = (timeStr: string) => {
  const [hStr, mStr] = (timeStr || "00:00").split(":");
  let h = parseInt(hStr || "0", 10);
  let m = parseInt(mStr || "0", 10);
  let period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { h12, m, period };
};

const formatTo24h = (h12: number, m: number, period: "AM" | "PM") => {
  let h24 = h12 % 12;
  if (period === "PM") h24 += 12;
  const hStr = h24.toString().padStart(2, "0");
  const mStr = m.toString().padStart(2, "0");
  return `${hStr}:${mStr}`;
};

export const MaterialClockPicker: React.FC<MaterialClockPickerProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const initial = useMemo(() => parseStartTime(value), [value]);

  const [selectedMode, setSelectedMode] = useState<"hour" | "minute">("hour");
  const [hour, setHour] = useState<number>(initial.h12);
  const [minute, setMinute] = useState<number>(initial.m);
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);
  const [showTextInput, setShowTextInput] = useState(false);

  useEffect(() => {
    const parsed = parseStartTime(value);
    setHour(parsed.h12);
    setMinute(parsed.m);
    setPeriod(parsed.period);
  }, [value]);

  const clockSize = 210;
  const center = clockSize / 2; // 105
  const radius = 76;

  // Generate numbers for Hours mode (1 - 12)
  const hourItems = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const hVal = index + 1;
      const angleDeg = (hVal % 12) * 30 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return { val: hVal, label: hVal.toString(), x, y };
    });
  }, [center, radius]);

  // Generate numbers for Minutes mode (00, 05, 10, ... 55)
  const minuteItems = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const mVal = index * 5;
      const angleDeg = (mVal / 60) * 360 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return { val: mVal, label: mVal.toString().padStart(2, "0"), x, y };
    });
  }, [center, radius]);

  const currentItems = selectedMode === "hour" ? hourItems : minuteItems;

  const currentPos = useMemo(() => {
    if (selectedMode === "hour") {
      const match = hourItems.find((item) => item.val === hour);
      if (match) return { x: match.x, y: match.y };
      const angleDeg = (hour % 12) * 30 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      return {
        x: center + radius * Math.cos(angleRad),
        y: center + radius * Math.sin(angleRad),
      };
    } else {
      const match = minuteItems.find((item) => item.val === minute);
      if (match) return { x: match.x, y: match.y };
      const angleDeg = (minute / 60) * 360 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      return {
        x: center + radius * Math.cos(angleRad),
        y: center + radius * Math.sin(angleRad),
      };
    }
  }, [selectedMode, hour, minute, hourItems, minuteItems, center, radius]);

  const handleItemClick = (val: number) => {
    if (selectedMode === "hour") {
      setHour(val);
      setSelectedMode("minute"); // Auto-switch to minutes picker
    } else {
      setMinute(val);
    }
  };

  const handleSave = () => {
    const formatted = formatTo24h(hour, minute, period);
    onChange(formatted);
    onClose();
  };

  return (
    <div className="w-[240px] text-sans select-none">
      {/* Top Header */}
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left mb-3">
        SELECT TIME
      </div>

      {/* Digital Display Box */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {/* Hour display button */}
        <button
          type="button"
          onClick={() => setSelectedMode("hour")}
          className={`w-14 h-14 rounded-xl text-2xl font-normal flex items-center justify-center transition-all ${
            selectedMode === "hour"
              ? "bg-emerald-100 text-emerald-800 font-medium"
              : "bg-gray-100/90 text-gray-800 hover:bg-gray-200/70"
          }`}
        >
          {hour}
        </button>

        <span className="text-2xl font-bold text-gray-800 pb-0.5">:</span>

        {/* Minute display button */}
        <button
          type="button"
          onClick={() => setSelectedMode("minute")}
          className={`w-14 h-14 rounded-xl text-2xl font-normal flex items-center justify-center transition-all ${
            selectedMode === "minute"
              ? "bg-emerald-100 text-emerald-800 font-medium"
              : "bg-gray-100/90 text-gray-800 hover:bg-gray-200/70"
          }`}
        >
          {minute.toString().padStart(2, "0")}
        </button>

        {/* AM / PM Toggle Stack */}
        <div className="flex flex-col border border-gray-200/80 rounded-xl overflow-hidden text-[11px] font-semibold ml-1">
          <button
            type="button"
            onClick={() => setPeriod("AM")}
            className={`px-2.5 py-1.5 transition-colors ${
              period === "AM"
                ? "bg-emerald-100 text-emerald-800 font-bold"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            AM
          </button>
          <div className="h-px bg-gray-200/80" />
          <button
            type="button"
            onClick={() => setPeriod("PM")}
            className={`px-2.5 py-1.5 transition-colors ${
              period === "PM"
                ? "bg-emerald-100 text-emerald-800 font-bold"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {showTextInput ? (
        /* Keyboard Direct Text Entry */
        <div className="my-6 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min={1}
              max={12}
              value={hour}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 12) setHour(val);
              }}
              className="w-16 h-10 text-center font-bold text-lg bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <span className="font-bold text-gray-600">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0 && val <= 59) setMinute(val);
              }}
              className="w-16 h-10 text-center font-bold text-lg bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      ) : (
        /* Interactive Analog Clock Face */
        <div
          className="relative mx-auto my-2 rounded-full bg-gray-100/90 flex items-center justify-center shadow-inner"
          style={{ width: `${clockSize}px`, height: `${clockSize}px` }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Pointer Line */}
            <line
              x1={center}
              y1={center}
              x2={currentPos.x}
              y2={currentPos.y}
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Center Dot */}
            <circle cx={center} cy={center} r="4" fill="#10b981" />
            {/* Selected Item Circle Indicator */}
            <circle cx={currentPos.x} cy={currentPos.y} r="15" fill="#10b981" />
          </svg>

          {/* Clock Dial Number Nodes */}
          {currentItems.map((item) => {
            const isSelected = item.val === (selectedMode === "hour" ? hour : minute);
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => handleItemClick(item.val)}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isSelected
                    ? "text-white font-bold z-10"
                    : "text-gray-700 hover:bg-gray-200/80"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowTextInput(!showTextInput)}
          className="p-1.5 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-gray-100 transition-colors"
          title={showTextInput ? "Switch to clock dial" : "Switch to keyboard input"}
        >
          {showTextInput ? <Clock size={17} /> : <Keyboard size={17} />}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors uppercase tracking-wider"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors uppercase tracking-wider"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialClockPicker;
