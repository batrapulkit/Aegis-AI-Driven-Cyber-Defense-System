import { useState, useCallback } from 'react';
import { Upload, FileCheck, AlertTriangle, Loader2, Shield, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ScanResult {
  fileName: string;
  fileSize: number;
  isClean: boolean;
  stats: {
    malicious: number;
    suspicious: number;
    undetected: number;
    harmless: number;
    timeout: number;
  };
  scanDate: string;
  verdict: string;
}

export const FileScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { playAlert } = useSoundEffects();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const scanFile = async (file: File) => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // OPTIMIZATION: Pass local env key if available
      const localKey = import.meta.env.VITE_VIRUSTOTAL_API_KEY;
      if (localKey) {
        formData.append('x_api_key', localKey);
      }

      const { data, error } = await supabase.functions.invoke('scan-file', {
        body: formData,
      });

      if (error) throw error;

      setScanResult(data);

      if (data.isClean) {
        toast.success('File is clean - no threats detected');
      } else {
        toast.error(`Threat detected in ${file.name}`);
        playAlert();
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || 'Failed to scan file');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      scanFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      scanFile(e.target.files[0]);
    }
  };

  const clearResult = () => {
    setScanResult(null);
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">File Virus Scanner</h3>
          <p className="text-sm text-muted-foreground">Upload files to scan for malware</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
          ? 'border-primary bg-primary/5'
          : 'border-border/50 hover:border-primary/50'
          } ${isScanning ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          disabled={isScanning}
        />

        {isScanning ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Scanning file for threats...</p>
            <p className="text-xs text-muted-foreground">This may take up to a minute</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <p className="text-foreground font-medium">
              Drop a file here or click to upload
            </p>
            <p className="text-sm text-muted-foreground">
              Supports any file type up to 32MB
            </p>
          </div>
        )}
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div
          className={`mt-6 p-4 rounded-xl border ${scanResult.isClean
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-destructive/10 border-destructive/30'
            }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {scanResult.isClean ? (
                <FileCheck className="w-6 h-6 text-green-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-destructive" />
              )}
              <div>
                <p className="font-medium text-foreground">{scanResult.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {(scanResult.fileSize / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={clearResult}
              className="p-1 hover:bg-background/50 rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-destructive">
                {scanResult.stats.malicious}
              </p>
              <p className="text-xs text-muted-foreground">Malicious</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">
                {scanResult.stats.suspicious}
              </p>
              <p className="text-xs text-muted-foreground">Suspicious</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-500">
                {scanResult.stats.harmless}
              </p>
              <p className="text-xs text-muted-foreground">Harmless</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">
                {scanResult.stats.undetected}
              </p>
              <p className="text-xs text-muted-foreground">Undetected</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span
              className={`px-3 py-1 rounded-full font-medium ${scanResult.isClean
                ? 'bg-green-500/20 text-green-500'
                : 'bg-destructive/20 text-destructive'
                }`}
            >
              {scanResult.verdict}
            </span>
            <span className="text-muted-foreground">
              Scanned: {new Date(scanResult.scanDate).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
