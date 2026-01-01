import { useState, useCallback } from 'react';
import { Upload, FileCheck, AlertTriangle, Loader2, Shield, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ScanResult {
  fileName: string;
  fileSize: number;
  isClean: boolean;
  scanner_type?: string;
  stats: {
    malicious?: number;
    suspicious?: number;
    undetected?: number;
    harmless?: number;
    timeout?: number;
    // SAST Stats
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  findings?: Array<{ severity: string, line: number, description: string }>;
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

      // PERSIST LOG TO DB (Critical for Map/Live Feed)
      try {
        const { error: dbError } = await supabase.from('scan_logs').insert({
          prompt_text: `FILE: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          verdict: data.isClean ? "SAFE" : "BLOCKED",
          risk_score: data.isClean ? 0 : 85,
          threat_type: data.scanner_type || (data.isClean ? "None" : "Malware Detected"),
          attack_category: data.isClean ? "None" : (data.scanner_type?.includes('SAST') ? "Code Vulnerability" : "Malware"),
          // Mock coordinates for map (optional, DB has defaults or mapped in Map component)
          latitude: (Math.random() * 140) - 70,
          longitude: (Math.random() * 360) - 180
        });
        if (dbError) console.error("Failed to persist file log", dbError);
      } catch (err) {
        console.error("Log persistence skipped", err);
      }

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
    <div className="cyber-card-premium border-glow-blue relative overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-neon-blue" />
        </div>
        <div>
          <h3 className="font-display font-bold text-xl text-foreground uppercase tracking-wider">File Sentinel</h3>
          <p className="text-xs text-muted-foreground">Deep Packet Inspection & SAST</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative flex-1 border-2 border-dashed rounded-xl p-8 text-center transition-all overflow-hidden group ${dragActive
          ? 'border-neon-blue bg-neon-blue/5'
          : 'border-white/10 hover:border-neon-blue/50'
          } ${isScanning ? 'pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
          onChange={handleFileInput}
          disabled={isScanning}
        />

        {/* Scanning Laser Animation */}
        {isScanning && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="w-full h-1 bg-neon-blue shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-scan-vertical" />
            <div className="absolute inset-0 bg-neon-blue/10 animate-pulse" />
          </div>
        )}

        {isScanning ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 relative z-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-neon-blue border-t-transparent animate-spin" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-neon-purple border-b-transparent animate-spin-reverse opacity-70" />
              <Shield className="absolute inset-0 m-auto w-6 h-6 text-neon-blue animate-pulse" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-neon-blue animate-pulse">ANALYZING SIGNATURES</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">running heuristics engine...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 relative z-10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-neon-blue/50">
              <Upload className="w-8 h-8 text-muted-foreground group-hover:text-neon-blue transition-colors" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-foreground">
                DROP FILES TO SCAN
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                Drag & drop executables, docs, or source code for instant analysis.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scan Result Overlay */}
      {scanResult && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl p-6 flex flex-col animate-in slide-in-from-bottom-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-display font-bold text-lg text-foreground">Analysis Report</h4>
            <button onClick={clearResult} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`rounded-xl border p-6 flex flex-col items-center justify-center text-center mb-4 ${scanResult.isClean
            ? 'bg-neon-blue/5 border-neon-blue/30'
            : 'bg-red-500/10 border-red-500/30'
            }`}>
            {scanResult.isClean ? (
              <>
                <div className="w-20 h-20 rounded-full bg-neon-blue/20 flex items-center justify-center mb-4">
                  <FileCheck className="w-10 h-10 text-neon-blue" />
                </div>
                <h2 className="text-2xl font-bold text-neon-blue mb-1">THREAT NEUTRALIZED</h2>
                <p className="text-sm text-neon-blue/70 font-mono">Verdict: {scanResult.verdict}</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-red-500 mb-1">THREAT DETECTED</h2>
                <p className="text-sm text-red-500/70 font-mono">Verdict: {scanResult.verdict}</p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-2">{scanResult.scanner_type || "Standard Scan"}</p>
          </div>

          {/* Conditional Stats Display */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {scanResult.stats.critical !== undefined ? (
              // SAST Stats
              <>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-red-500 font-bold text-xl">{scanResult.stats.critical}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Crit</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-orange-500 font-bold text-xl">{scanResult.stats.high}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">High</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-yellow-500 font-bold text-xl">{scanResult.stats.medium}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Med</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-neon-blue font-bold text-xl">{scanResult.stats.low}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Low</div>
                </div>
              </>
            ) : (
              // VirusTotal Stats
              <>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-red-500 font-bold text-xl">{scanResult.stats.malicious || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Malicious</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-orange-400 font-bold text-xl">{scanResult.stats.suspicious || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Suspicious</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-neon-blue font-bold text-xl">{scanResult.stats.harmless || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Safe</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <div className="text-slate-400 font-bold text-xl">{scanResult.stats.undetected || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Unknown</div>
                </div>
              </>
            )}
          </div>

          {/* SAST Findings List */}
          {scanResult.findings && scanResult.findings.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-bold text-sm text-muted-foreground">Detailed Findings:</h5>
              {scanResult.findings.map((f, i) => (
                <div key={i} className="text-xs p-2 bg-white/5 rounded border border-white/10">
                  <span className={`font-bold mr-2 ${f.severity === 'High' ? 'text-red-500' : 'text-yellow-500'}`}>[{f.severity}]</span>
                  <span className="text-muted-foreground mr-2">Line {f.line}:</span>
                  <span>{f.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
