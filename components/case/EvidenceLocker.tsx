'use client';

import React, { useState } from 'react';
import { FileNode } from '@/lib/github/client';
import { fetchFileContent } from '@/app/case/actions';
import { Folder, FileText, FileWarning, ArrowLeft, Loader2 } from 'lucide-react';

interface EvidenceLockerProps {
  files: FileNode[];
  owner: string;
  repo: string;
  totalFiles: number;
}

export default function EvidenceLocker({ files, owner, repo, totalFiles }: EvidenceLockerProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'dir') return;

    setSelectedFile(file);
    setLoading(true);
    setError(null);
    setFileContent(null);

    try {
      const result = await fetchFileContent(owner, repo, file.path);
      if (result.success && result.content) {
        setFileContent(result.content);
      } else {
        setError('Failed to decrypt file content.');
      }
    } catch (err) {
      setError('Connection lost during retrieval.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedFile(null);
    setFileContent(null);
    setError(null);
  };

  // Sort files: directories first, then files
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === b.type) return a.path.localeCompare(b.path);
    return a.type === 'dir' ? -1 : 1;
  });

  // Limit to show structure without overwhelming
  const displayFiles = sortedFiles.slice(0, 100);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border border-zinc-800 shadow-2xl relative overflow-hidden">
      {/* Coffee Stain Overlay */}
      <div className="absolute top-10 right-10 w-32 h-32 rounded-full border-[16px] border-[#3f2e18]/10 opacity-40 pointer-events-none blur-sm transform scale-110"></div>

      <div className="p-4 border-b border-zinc-800 bg-[#0f0f0f] flex justify-between items-center sticky top-0 z-20 shadow-md shrink-0">
        <h2 className="text-sm font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-widest font-typewriter">
          <Folder className="w-4 h-4" /> Evidence Locker
        </h2>
        <span className="text-xs text-zinc-600 font-mono bg-black/20 px-2 py-1 rounded">
          {selectedFile ? 'EVIDENCE VIEW' : `INDEX: ${totalFiles} FILES`}
        </span>
      </div>

      <div className="flex-1 overflow-hidden p-6 font-mono text-xs relative z-10">
        {selectedFile ? (
          <div className="flex flex-col h-full">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-4 transition-colors uppercase tracking-widest font-bold text-[10px] shrink-0"
            >
              <ArrowLeft className="w-3 h-3" /> Return to Index
            </button>
            
            <div className="border border-zinc-800 bg-[#050505] p-4 rounded-sm relative flex-1 min-h-0 flex flex-col">
              <div className="absolute top-0 right-0 px-2 py-1 bg-zinc-900 text-zinc-500 text-[10px] border-b border-l border-zinc-800 font-typewriter z-10">
                {selectedFile.path}
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="animate-pulse font-typewriter">DECRYPTING...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-900/70 gap-2">
                  <FileWarning className="w-8 h-8" />
                  <span className="font-typewriter">{error}</span>
                </div>
              ) : (
                <div className="absolute inset-0 top-8 overflow-auto custom-scrollbar p-4">
                  <pre className="font-mono text-zinc-400 text-xs leading-relaxed whitespace-pre">
                    <code>{fileContent}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Typed Index Look */
          files.length > 0 ? (
            <div className="pl-2 border-l border-zinc-800/50 ml-1 h-full overflow-y-auto custom-scrollbar">
              {displayFiles.map((file) => (
                <div 
                  key={file.path} 
                  onClick={() => handleFileClick(file)}
                  className={`flex items-center gap-2 py-1 group transition-colors ${
                    file.type === 'dir' 
                      ? 'cursor-default' 
                      : 'cursor-pointer hover:bg-zinc-900/50'
                  }`}
                >
                  {file.type === 'dir' ? (
                    <Folder className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                  ) : (
                    <FileText className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500" />
                  )}
                  <span className={`truncate ${file.type === 'dir' ? 'text-zinc-500 font-bold' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                    {file.path}
                  </span>
                </div>
              ))}
              {files.length > 100 && (
                <div className="pl-6 py-2 text-zinc-700 italic text-[10px]">
                  ... {files.length - 100} more files redacted ...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-600">
              <FileWarning className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="uppercase tracking-widest font-typewriter">Evidence Locked</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
