"use client";

import { DashboardWidget } from "@/types";

interface Props {
  widgets: DashboardWidget[];
  onChange: (widgets: DashboardWidget[]) => void;
  open: boolean;
  onClose: () => void;
}

export default function DashboardSettings({ widgets, onChange, open, onClose }: Props) {
  if (!open) return null;

  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  const toggleVisibility = (id: string) => {
    onChange(
      widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const moveUp = (id: string) => {
    const idx = sorted.findIndex((w) => w.id === id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    const curr = sorted[idx];
    onChange(
      widgets.map((w) => {
        if (w.id === curr.id) return { ...w, order: prev.order };
        if (w.id === prev.id) return { ...w, order: curr.order };
        return w;
      })
    );
  };

  const moveDown = (id: string) => {
    const idx = sorted.findIndex((w) => w.id === id);
    if (idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    const curr = sorted[idx];
    onChange(
      widgets.map((w) => {
        if (w.id === curr.id) return { ...w, order: next.order };
        if (w.id === next.id) return { ...w, order: curr.order };
        return w;
      })
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed right-4 top-20 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">Dashboard Layout</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-1">
          {sorted.map((widget, idx) => (
            <div
              key={widget.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50"
            >
              <button
                onClick={() => toggleVisibility(widget.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border transition-colors ${
                  widget.visible
                    ? "bg-emerald-600 border-emerald-500"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                {widget.visible && (
                  <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${widget.visible ? "text-gray-200" : "text-gray-500"}`}>
                {widget.label}
              </span>
              <div className="flex flex-col">
                <button
                  onClick={() => moveUp(widget.id)}
                  disabled={idx === 0}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-20 transition-colors p-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveDown(widget.id)}
                  disabled={idx === sorted.length - 1}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-20 transition-colors p-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">Toggle visibility and reorder widgets</p>
        </div>
      </div>
    </>
  );
}
