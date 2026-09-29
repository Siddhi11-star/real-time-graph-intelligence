import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Database, 
  Radio, 
  Zap, 
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface DatasetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestionSuccess?: (count: number) => void;
}

export const DatasetUploadModal: React.FC<DatasetUploadModalProps> = ({
  isOpen,
  onClose,
  onIngestionSuccess,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ingestMode, setIngestMode] = useState<'batch' | 'stream'>('batch');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; message: string; count?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setResultMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResultMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setResultMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`http://localhost:8000/api/graph/ingest/upload?mode=${ingestMode}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      setResultMessage({
        type: 'success',
        message: `Successfully ingested ${data.events_count} events from ${data.filename}! (${data.anomalies_count} anomalies flagged)`,
        count: data.events_count,
      });
      setSelectedFile(null);
      if (onIngestionSuccess) onIngestionSuccess(data.events_count);
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        message: err.message || 'Error uploading dataset',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async (sampleName: string) => {
    setIsUploading(true);
    setResultMessage(null);

    try {
      const res = await fetch(`http://localhost:8000/api/graph/ingest/sample/${sampleName}?mode=${ingestMode}`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to load sample dataset');
      }

      const data = await res.json();
      setResultMessage({
        type: 'success',
        message: `Loaded sample '${sampleName}': ${data.events_count} events added to graph!`,
        count: data.events_count,
      });
      if (onIngestionSuccess) onIngestionSuccess(data.events_count);
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        message: err.message || 'Error loading sample',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 md:p-8 border border-white/30 dark:border-white/10 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/[0.04] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Description */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Custom Dataset Ingestion
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Upload external cybersecurity logs, network PCAP/Zeek records, or JSON event streams.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="my-5 p-3 rounded-2xl bg-white/40 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ingestion Pipeline Mode:
          </span>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setIngestMode('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                ingestMode === 'batch'
                  ? 'bg-rose-500 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Batch</span>
            </button>

            <button
              onClick={() => setIngestMode('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                ingestMode === 'stream'
                  ? 'bg-rose-500 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Replay Live Stream</span>
            </button>
          </div>
        </div>

        {/* Drag and Drop Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[170px] ${
            dragActive
              ? 'border-rose-500 bg-rose-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-white/20 hover:border-rose-400 hover:bg-rose-500/[0.03]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.ndjson,.log,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-500 mb-3">
            <Upload className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <>
              <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-white m-0">
                Drag and drop your dataset here, or <span className="text-rose-500 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports CSV (source, target, relationship), JSON Array, NDJSON, and Zeek conn.log
              </p>
            </>
          )}
        </div>

        {/* Feedback Message */}
        {resultMessage && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
            resultMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}>
            {resultMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{resultMessage.message}</span>
          </div>
        )}

        {/* Action Button */}
        {selectedFile && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Dataset...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Start Ingestion ({ingestMode})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Pre-Bundled Ready Samples */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Or Try One-Click Pre-Built Sample Datasets:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <button
              onClick={() => handleLoadSample('enterprise_auth')}
              disabled={isUploading}
              className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] hover:bg-rose-500/15 border border-slate-200 dark:border-white/[0.08] text-left transition-all group disabled:opacity-50"
            >
              <div className="font-bold text-slate-900 dark:text-white group-hover:text-rose-500">
                📁 Enterprise Auth (.csv)
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Logins, token escalation, compromised endpoints
              </p>
            </button>

            <button
              onClick={() => handleLoadSample('zeek_conn')}
              disabled={isUploading}
              className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] hover:bg-rose-500/15 border border-slate-200 dark:border-white/[0.08] text-left transition-all group disabled:opacity-50"
            >
              <div className="font-bold text-slate-900 dark:text-white group-hover:text-rose-500">
                🌐 Zeek Traffic (.log)
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                IDS connection records, port scans, gateway traffic
              </p>
            </button>

            <button
              onClick={() => handleLoadSample('dns_tunneling')}
              disabled={isUploading}
              className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] hover:bg-rose-500/15 border border-slate-200 dark:border-white/[0.08] text-left transition-all group disabled:opacity-50"
            >
              <div className="font-bold text-slate-900 dark:text-white group-hover:text-rose-500">
                🛰️ DNS Tunneling (.json)
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                High-entropy C2 beaconing & data exfiltration
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
