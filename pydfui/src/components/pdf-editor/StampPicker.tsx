import React from 'react';
import { X } from 'lucide-react';

interface StampPickerProps {
  onSelect: (stamp: StampConfig) => void;
  onClose: () => void;
}

export interface StampConfig {
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STAMPS: StampConfig[] = [
  { text: 'APPROVED', color: '#166534', bgColor: '#dcfce7', borderColor: '#22c55e' },
  { text: 'REJECTED', color: '#991b1b', bgColor: '#fee2e2', borderColor: '#ef4444' },
  { text: 'DRAFT', color: '#9a3412', bgColor: '#ffedd5', borderColor: '#f97316' },
  { text: 'CONFIDENTIAL', color: '#991b1b', bgColor: '#fee2e2', borderColor: '#ef4444' },
  { text: 'FINAL', color: '#1e40af', bgColor: '#dbeafe', borderColor: '#3b82f6' },
  { text: 'COPY', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#9ca3af' },
  { text: 'VOID', color: '#991b1b', bgColor: '#fee2e2', borderColor: '#ef4444' },
  { text: 'REVISED', color: '#7c2d12', bgColor: '#fff7ed', borderColor: '#ea580c' },
  { text: 'SAMPLE', color: '#6d28d9', bgColor: '#ede9fe', borderColor: '#8b5cf6' },
  { text: 'NOT FOR DISTRIBUTION', color: '#991b1b', bgColor: '#fee2e2', borderColor: '#ef4444' },
  { text: 'SIGN HERE', color: '#1e40af', bgColor: '#dbeafe', borderColor: '#3b82f6' },
  { text: 'INITIAL HERE', color: '#1e40af', bgColor: '#dbeafe', borderColor: '#3b82f6' },
];

export default function StampPicker({ onSelect, onClose }: StampPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Choose Stamp</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {STAMPS.map((stamp) => (
            <button
              key={stamp.text}
              onClick={() => onSelect(stamp)}
              className="p-3 rounded-lg border-2 hover:scale-105 transition-transform text-center"
              style={{
                backgroundColor: stamp.bgColor,
                borderColor: stamp.borderColor,
                color: stamp.color,
              }}
            >
              <span className="font-bold text-xs tracking-wider">{stamp.text}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-700">
          <button onClick={onClose} className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-medium transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
