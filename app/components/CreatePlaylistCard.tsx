// Arquivo a criar: src/components/CreatePlaylistCard.tsx

import React, { useState } from "react";

type CreatePlaylistCardProps = {
  onCreate: (name: string) => Promise<void> | void;
  disabled?: boolean;
};

export function CreatePlaylistCard({ onCreate, disabled }: CreatePlaylistCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreate(trimmed);
    setName("");
    setOpen(false);
  };

  return (
    <div className="px-2 cursor-pointer" onClick={() => setOpen((v) => !v)}>
      <div
        className={`border rounded-lg p-2 text-center transition ${
          open ? "bg-green-50" : "border-gray-600"
        }`}
      >
        <div className="w-full aspect-square bg-gray-800 rounded overflow-hidden flex items-center justify-center">
          {/* Simple ícone de adição (pode substituir por um SVG melhor se desejar) */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-label="Criar">
            <path d="M12 5v14" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h3 className="text-sm mt-2">Nova playlist</h3>

        {open && (
          <form onSubmit={handleCreate} className="mt-2">
            <input
              id="xxx"
              name="zzz"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da nova playlist"
              className="border px-2 py-1 rounded w-full bg-black text-white"
              disabled={disabled}
            />
            <div className="flex justify-center mt-2">
              <button
                type="submit"
                className="px-3 py-1 rounded bg-green-600 text-white font-bold"
                disabled={disabled}
              >
                Criar
              </button>
            </div>
          </form>
        )}
        {!open && (
          <p className="text-xs text-gray-400 mt-1">Clique para criar uma nova playlist</p>
        )}
      </div>
    </div>
  );
}