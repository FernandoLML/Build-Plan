// Caminho: /frontend/src/components/memorial/MemorialDropzone.tsx
// Área de upload (drag-and-drop + seletor) que lê o CSV/TXT no cliente.

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

const TAMANHO_MAX = 2 * 1024 * 1024; // 2MB
const EXTENSOES = /\.(csv|txt)$/i;

interface MemorialDropzoneProps {
  onArquivoLido: (texto: string, nome: string) => void;
  onErro: (mensagem: string) => void;
  disabled?: boolean;
}

export function MemorialDropzone({ onArquivoLido, onErro, disabled }: MemorialDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  function processarArquivo(file: File) {
    if (!EXTENSOES.test(file.name)) {
      onErro("Formato não suportado. Envie um arquivo .csv ou .txt.");
      return;
    }
    if (file.size > TAMANHO_MAX) {
      onErro("Arquivo muito grande (máximo de 2MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onArquivoLido(String(reader.result ?? ""), file.name);
    reader.onerror = () => onErro("Falha ao ler o arquivo.");
    reader.readAsText(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) processarArquivo(file);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
        arrastando ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-slate-400"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <UploadCloud className="h-8 w-8 text-slate-400" />
      <p className="text-sm font-medium text-slate-700">
        Arraste o arquivo do memorial (CSV) aqui ou clique para selecionar
      </p>
      <p className="text-xs text-slate-400">Formatos aceitos: .csv ou .txt (até 2MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processarArquivo(file);
          e.target.value = ""; // permite reenviar o mesmo arquivo
        }}
      />
    </div>
  );
}