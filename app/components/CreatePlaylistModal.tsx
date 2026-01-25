// Arquivo a criar: src/components/CreatePlaylistModal.tsx

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";


type CreatePlaylistModalProps = {
  // Função que cria a playlist. Deve retornar true em caso de sucesso.
  onCreate: (name: string) => Promise<boolean> | boolean;
};

export function CreatePlaylistModal({ onCreate }: CreatePlaylistModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  // Elemento do portal (append no body)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // cria/pega o container do portal
    let el = document.getElementById("portal-create-playlist");
    if (!el) {
      el = document.createElement("div");
      el.id = "portal-create-playlist";
      document.body.appendChild(el);
    }
    setPortalEl(el);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const ok = await Promise.resolve(onCreate(trimmed));
    if (ok) {
      // fecha o modal e limpa o campo
      setName("");
      setOpen(false);
    }
  };

  // Conteúdo do modal (renderizado via portal)
  const modalContent = open && portalEl ? (
    createPortal(
      (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Criar nova playlist"
        >
            <div className="bg-zinc-800 rounded-xl p-5 shadow-lg w-full max-w-sm border border-zinc-700">
            <h3 className="text-lg font-semibold mb-4">Criar nova playlist</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                id="new-playlist-name"
                name="new-playlist-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da nova playlist"
                className="w-full border rounded px-3 py-2 bg-zinc-900 text-white"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setOpen(false)}
                  className="h-12 border border-zinc-700 hover:bg-zinc-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-12 bg-blue-600 hover:bg-blue-700"
                  disabled={!name.trim()}
                >
                  Criar
                </Button>
              </div>
            </form>
          </div>
        </div>
      ),
      portalEl
    )
  ) : null;
  
  return (
    <>
      {/* Card do carrossel que abre o modal */}
      <div className="px-2 cursor-pointer" onClick={() => setOpen(true)}>
        <div className="border rounded-lg p-2 text-center transition border-gray-600">
          <div className="w-full aspect-square bg-gray-800 rounded overflow-hidden flex items-center justify-center">
            {/* ícone de adicionar */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-label="Criar">
              <path d="M12 5v14" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-sm mt-2">Nova playlist</h3>
          <p className="text-xs text-gray-400 mt-1">Clique para criar uma nova playlist</p>
        </div>
      </div>

      {/* Modal renderizado via portal (quando aberto) */}
      {modalContent}
    </>
  );
}