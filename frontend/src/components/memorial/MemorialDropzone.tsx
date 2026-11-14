// Caminho: /frontend/src/components/memorial/MemorialDropzone.tsx
// Área de upload (drag-and-drop + seletor) que lê o CSV/TXT no cliente.

import { useId, useState } from "react";
import { UploadCloud } from "lucide-react";

const TAMANHO_MAX = 2 * 1024 * 1024; // 2MB
const EXTENSOES = /\.(csv|txt)$/i;

interface MemorialDropzoneProps {
  onArquivoLido: (texto: string, nome: string) => void;
  onErro: (mensagem: string) => void;
  disabled?: boolean;
}

export function MemorialDropzone({ onArquivoLido, onErro, disabled }: Readonly<MemorialDropzoneProps>) {
  const inputId = useId();
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
    file
      .text()
      .then((texto) => onArquivoLido(texto, file.name))
      .catch(() => onErro("Falha ao ler o arquivo."));
  }

  return (
    // <label> nativo: clicar (ou Enter/Espaço no input focado) abre o seletor,
    // sem handlers de clique em elemento não interativo.
    <label
      htmlFor={inputId}
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
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
        arrastando
          ? "border-indigo-500 bg-indigo-500/10"
          : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/40"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <UploadCloud className="h-8 w-8 text-slate-500" />
      <p className="text-sm font-medium text-slate-200">
        Arraste o arquivo do memorial (CSV) aqui ou clique para selecionar
      </p>
      <p className="text-xs text-slate-500">Formatos aceitos: .csv ou .txt (até 2MB)</p>
      <input
        id={inputId}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processarArquivo(file);
          e.target.value = ""; // permite reenviar o mesmo arquivo
        }}
      />
    </label>
  );
}