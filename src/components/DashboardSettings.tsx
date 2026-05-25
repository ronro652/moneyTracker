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
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-4 top-20 z-50 w-80 bg-white rounded-2xl shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <h3 className="text-sm font-semibold text-gray-900">Dashboard Layout</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-1">
          {sorted.map((widget, idx) => (
            <div
              key={widget.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-100 shadow-sm"
            >
              <button
                onClick={() => toggleVisibility(widget.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border transition-colors ${
                  widget.visible
                    ? "bg-indigo-600 border-indigo-500"
                    : "border-gray-300 hover:border-indigo-400"
                }`}
              >
                {widget.visible && (
                  <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${widget.visible ? "text-gray-700" : "text-gray-400"}`}>
                {widget.label}
              </span>
              <div className="flex flex-col">
                <button
                  onClick={() => moveUp(widget.id)}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors p-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveDown(widget.id)}
                  disabled={idx === sorted.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors p-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">Toggle visibility and reorder widgets</p>
        </div>
      </div>
    </>
  );
}
