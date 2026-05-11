import React, { useState, useEffect } from 'react';
import { X, Loader2, BookOpen, Bug, FunctionSquare, Zap, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { RepoStructure, getFileContent } from '../services/githubService';
import { analyzeFileDeepDive } from '../services/geminiService';
import { cn } from '../lib/utils';

interface FileDeepDiveProps {
  filePath: string;
  repoData: RepoStructure;
  onClose: () => void;
}

export const FileDeepDive: React.FC<FileDeepDiveProps> = ({ filePath, repoData, onClose }) => {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performAnalysis = async (l = level) => {
    setIsLoading(true);
    try {
      const content = await getFileContent(repoData.owner, repoData.repo, filePath);
      const res = await analyzeFileDeepDive(repoData, filePath, content, l);
      setAnalysis(res);
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to deep-dive into this file. It might be a binary or too large.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performAnalysis();
  }, [filePath]);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-[#0c0c0e] border-l border-white/10 z-[100] shadow-2xl flex flex-col"
    >
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-blue-500 mb-1 flex items-center gap-2">
            <Zap size={12} /> Deep Dive Analysis
          </div>
          <h2 className="text-sm font-mono text-white truncate max-w-[400px]">{filePath}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <X size={20} className="text-zinc-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        {/* Knowledge Level Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
            <GraduationCap size={14} className="text-indigo-400" /> Mentor Level
          </div>
          <div className="flex bg-zinc-900 rounded-xl p-1 gap-1 border border-white/5">
            {(['beginner', 'intermediate', 'expert'] as const).map(l => (
              <button
                key={l}
                onClick={() => { setLevel(l); performAnalysis(l); }}
                className={cn(
                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                  level === l ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-zinc-500 hover:text-white"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <div className="text-center">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Deconstructing Logic</p>
              <p className="text-[10px] text-zinc-700 mt-1">Cross-referencing imports and dependencies...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={analysis}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="markdown-body prose prose-invert max-w-none"
            >
              <ReactMarkdown>{analysis || ''}</ReactMarkdown>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="p-6 bg-zinc-900/50 border-t border-white/5">
        <div className="flex gap-4">
          <div className="flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-600 mb-2">Complexity</div>
            <div className="text-lg font-mono text-white">O(n)</div>
          </div>
          <div className="flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-600 mb-2">Risk Factor</div>
            <div className="text-lg font-mono text-yellow-500">Low</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
