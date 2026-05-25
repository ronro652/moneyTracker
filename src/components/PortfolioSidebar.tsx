"use client";

import { useState } from "react";
import { Portfolio, PORTFOLIO_COLORS } from "@/types";

interface Props {
  portfolios: Portfolio[];
  activePortfolioId: number | null;
  onSelect: (id: number | null) => void;
  onCreated: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export default function PortfolioSidebar({
  portfolios,
  activePortfolioId,
  onSelect,
  onCreated,
  onDeleted,
  onUpdated,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setShowCreate(false);
    setCreating(false);
    onCreated();
  };

  const handleDelete = async (id: number) => {
    if (portfolios.length <= 1) return;
    await fetch(`/api/portfolios/${id}`, { method: "DELETE" });
    if (activePortfolioId === id) onSelect(null);
    onDeleted();
  };

  const startEdit = (p: Portfolio) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColor(p.color);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;
    await fetch(`/api/portfolios/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    setEditingId(null);
    onUpdated();
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md shadow-black/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Portfolios</h2>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
          title="Add portfolio"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Portfolio name"
            className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 text-white text-sm px-3 py-2 rounded-xl transition-colors"
          >
            Add
          </button>
        </form>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
            activePortfolioId === null
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0" />
          All Portfolios
        </button>

        {portfolios.map((p) => (
          <div key={p.id}>
            {editingId === p.id ? (
              <form onSubmit={handleUpdate} className="p-2 bg-gray-50/80 rounded-xl space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex gap-1.5 flex-wrap">
                  {PORTFOLIO_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        editColor === c ? "scale-125 ring-2 ring-indigo-200" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="text-xs text-indigo-600 hover:text-indigo-500">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="group flex items-center">
                <button
                  onClick={() => onSelect(p.id)}
                  className={`flex-1 text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    activePortfolioId === p.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </button>
                <div className="hidden group-hover:flex items-center gap-1 pr-1">
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {portfolios.length > 1 && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
