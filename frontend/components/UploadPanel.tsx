'use client';

import { useRef, useState } from 'react';

interface UploadedFile {
  name: string;
  status: 'uploading' | 'done' | 'error';
}

const FUNCTION_APP_URL = process.env.NEXT_PUBLIC_FUNCTION_APP_URL;

export default function UploadPanel() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are supported.');
      return;
    }

    setFiles((prev) => [...prev, { name: file.name, status: 'uploading' }]);

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${FUNCTION_APP_URL}/api/upload`, {
        method: 'POST',
        body,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: res.ok ? 'done' : 'error' }
            : f
        )
      );
    } catch {
      setFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, status: 'error' } : f))
      );
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Documents</h2>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-100'
        }`}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 16v-8m0 0-3 3m3-3 3 3M6 20h12a2 2 0 002-2V8l-6-6H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-gray-500">Drop a PDF here or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => Array.from(e.target.files ?? []).forEach(uploadFile)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm text-sm">
              <span className="flex-1 truncate">{f.name}</span>
              {f.status === 'uploading' && (
                <span className="text-blue-500 text-xs animate-pulse">Uploading…</span>
              )}
              {f.status === 'done' && (
                <span className="text-green-500 text-xs">✓ Ingesting</span>
              )}
              {f.status === 'error' && (
                <span className="text-red-500 text-xs">✗ Failed</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
