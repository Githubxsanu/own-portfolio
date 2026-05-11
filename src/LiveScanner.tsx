import { useState, useEffect, useRef } from "react";
import { Terminal, X, FilePlus, FileMinus, FileEdit, FolderSearch } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";

declare global {
  interface Window {
    showDirectoryPicker: (options?: any) => Promise<any>;
  }
}

export function LiveScanner({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [logs, setLogs] = useState<{ id: number; type: 'info' | 'add' | 'delete' | 'modify'; message: string; time: string }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTarget, setScanTarget] = useState<string | null>(null);
  const dirHandleRef = useRef<any>(null);
  const filesRef = useRef<Map<string, { size: number, lastModified: number }>>(new Map());
  const intervalRef = useRef<number | null>(null);

  const addLog = (type: 'info' | 'add' | 'delete' | 'modify', message: string) => {
    setLogs(prev => {
      const newLogs = [{ id: Date.now() + Math.random(), type, message, time: new Date().toLocaleTimeString() }, ...prev];
      return newLogs.slice(0, 50); // Keep last 50 logs
    });
  };

  const startScan = async () => {
    try {
      if (!window.showDirectoryPicker) {
        addLog('info', "Your browser does not support the Live Directory Scanning API. Please use a Chromium-based browser like Chrome or Edge.");
        return;
      }
      
      addLog('info', "Awaiting user permission to access local directory...");
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      dirHandleRef.current = dirHandle;
      setScanTarget(dirHandle.name);
      setIsScanning(true);
      filesRef.current = new Map();
      setLogs([]); // clear waiting logs
      addLog('info', `Permission granted. Initializing live forensic scan on: /${dirHandle.name}`);
      
      // Initial scan
      await performScan(true);

      // Start live polling every 1.5 seconds
      intervalRef.current = window.setInterval(() => performScan(false), 1500);

    } catch (err: any) {
      if (err.name === 'AbortError') {
         addLog('info', "Scan aborted by user. Permission denied.");
      } else {
         addLog('info', `Error initiating scan: ${err.message}`);
      }
    }
  };

  const stopScan = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScanning(false);
    dirHandleRef.current = null;
    setScanTarget(null);
    addLog('info', "Live scan terminated.");
  };

  const performScan = async (isInitial: boolean) => {
    if (!dirHandleRef.current) return;
    try {
      const currentFiles = new Map<string, { size: number, lastModified: number }>();
      
      // Shallow scan of the selected directory
      for await (const entry of dirHandleRef.current.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          currentFiles.set(entry.name, { size: file.size, lastModified: file.lastModified });
        }
      }

      if (isInitial) {
        filesRef.current = currentFiles;
        addLog('info', `Initial scan complete. Baseline established with ${currentFiles.size} files. Monitoring for live changes...`);
        return;
      }

      // Compare new files against old files
      const oldFiles = filesRef.current;
      
      // Check for Additions and Modifications
      currentFiles.forEach((details, name) => {
        const oldDetails = oldFiles.get(name);
        if (!oldDetails) {
          addLog('add', `[DETECTED: CREATION] File downloaded or created: ${name} (${formatBytes(details.size)})`);
        } else if (oldDetails.lastModified !== details.lastModified || oldDetails.size !== details.size) {
          addLog('modify', `[DETECTED: MODIFICATION] File modified: ${name}`);
        }
      });

      // Check for Deletions
      oldFiles.forEach((_, name) => {
        if (!currentFiles.has(name)) {
          addLog('delete', `[DETECTED: DELETION] File removed or permanently deleted: ${name}`);
        }
      });

      filesRef.current = currentFiles;
    } catch (error) {
      console.error("Scanning error:", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-[#0a0a0a]/90 backdrop-blur-md"
      >
        <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-[#050505] border border-cyber-green/30 rounded-xl shadow-[0_0_50px_rgba(0,255,65,0.15)] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-green/20 bg-cyber-green/5">
            <div className="flex items-center gap-3 text-cyber-green font-mono">
              <Terminal className="w-5 h-5" />
              <span className="font-bold tracking-widest uppercase text-sm">Live Directory Forensic Tool</span>
              {isScanning && (
                <span className="flex items-center gap-2 ml-4 px-2 py-1 bg-cyber-green/10 rounded text-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-cyber-green"></span>
                  Monitoring Target: /{scanTarget}
                </span>
              )}
            </div>
            <button onClick={() => { stopScan(); onClose(); }} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 flex flex-col relative">
            {!isScanning && logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <FolderSearch className="w-16 h-16 text-cyber-green/50 mb-6" />
                <h3 className="text-xl font-display font-bold text-white mb-2">Live Directory Forensics</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                  This tool uses the native File System Access API to perform live forensic monitoring on a local folder of your choice (e.g., your Downloads folder). It detects real-time file creations, downloads, modifications, and deletions.
                </p>
                <button 
                  onClick={startScan}
                  className="px-8 py-3 bg-cyber-green/10 border border-cyber-green text-cyber-green font-mono font-medium rounded hover:bg-cyber-green hover:text-black transition-all group flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4 group-hover:animate-pulse" />
                  Select Target Folder & Begin Scan
                </button>
                <p className="text-xs text-cyber-green/50 mt-4 max-w-sm">
                  Requires browser permission. Only the selected folder will be scanned locally. No data is sent to any server.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col font-mono text-sm overflow-hidden">
                <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                  <span className="text-gray-400 uppercase text-xs tracking-widest">Active Event Logs</span>
                  {isScanning ? (
                    <button onClick={stopScan} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-500/30 rounded transition-colors">Stop Scan</button>
                  ) : (
                    <button onClick={startScan} className="text-cyber-green hover:text-white text-xs px-2 py-1 border border-cyber-green/30 rounded transition-colors">Restart Scan</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto pr-4 space-y-2 flex flex-col-reverse">
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-4 p-2 rounded bg-white/[0.02] border-l-2 border-transparent transition-colors" style={{
                      borderColor: log.type === 'add' ? '#00ff41' : log.type === 'delete' ? '#ef4444' : log.type === 'modify' ? '#eab308' : 'transparent',
                      backgroundColor: log.type === 'info' ? 'transparent' : undefined
                    }}>
                      <span className="text-gray-500 w-20 shrink-0">[{log.time}]</span>
                      <div className="flex items-start gap-2 flex-1">
                        {log.type === 'add' && <FilePlus className="w-4 h-4 text-cyber-green shrink-0 mt-0.5" />}
                        {log.type === 'delete' && <FileMinus className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                        {log.type === 'modify' && <FileEdit className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
                        {log.type === 'info' && <Terminal className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />}
                        <span className={`break-all ${log.type === 'add' ? 'text-cyber-green' : log.type === 'delete' ? 'text-red-400' : log.type === 'modify' ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {log.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
