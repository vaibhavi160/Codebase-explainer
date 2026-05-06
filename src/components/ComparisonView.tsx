import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitCompare, Loader2, Trophy, Swords, Zap, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { RepoStructure, fetchRepoData } from '../services/githubService';
import { compareCodebases } from '../services/geminiService';
import { cn } from '../lib/utils';

export const ComparisonView: React.FC = () => {
  const [urls, setUrls] = useState(['', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [comparison, setComparison] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<[RepoStructure, RepoStructure] | null>(null);

  const handleCompare = async () => {
    if (!urls[0] || !urls[1]) return;
    setIsLoading(true);
    setError(null);
    try {
      const data1 = await fetchRepoData(urls[0]);
      const data2 = await fetchRepoData(urls[1]);
      setRepos([data1, data2]);
      
      const result = await compareCodebases(data1, data2);
      setComparison(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to compare repositories.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-[0.25em]">
          <Swords size={14} className="animate-pulse" /> Battlefield Mode
        </div>
        <h2 className="text-5xl font-black text-white tracking-tight">COMPARE <span className="text-zinc-600">REPOS</span></h2>
        <p className="text-zinc-500 max-w-xl mx-auto">Analyze structural integrity, scalability, and technical debt between two codebases side-by-side.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
           <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 font-bold italic">VS</div>
        </div>

        {[0, 1].map((i) => (
          <div key={i} className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition" />
              <input
                type="text"
                value={urls[i]}
                onChange={(e) => {
                  const newUrls = [...urls];
                  newUrls[i] = e.target.value;
                  setUrls(newUrls);
                }}
                placeholder={`Repository ${i + 1} (org/repo)`}
                className="w-full relative bg-zinc-900/90 border border-white/5 rounded-2xl px-6 py-5 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:ring-2 ring-blue-500/20 transition-all"
              />
            </div>
            
            {repos && repos[i] && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <GitCompare size={16} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-600">Target identified</div>
                  <div className="text-xs font-mono text-zinc-300">{repos[i].owner}/{repos[i].repo}</div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          disabled={isLoading || !urls[0] || !urls[1]}
          className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 font-black px-12 py-5 rounded-2xl transition-all flex items-center gap-2 group shadow-2xl shadow-white/5"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Swords size={20} />}
          {isLoading ? 'ANALYZING...' : 'INITIATE COMPARISON'}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center justify-center gap-3"
          >
            <AlertCircle size={20} /> {error}
          </motion.div>
        )}

        {comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] bg-zinc-900/40 border border-white/5 p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <Trophy size={300} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10 pb-8 border-b border-white/5">
                <div className="p-4 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                  <Zap size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">Battle Report</h3>
                  <p className="text-zinc-500 font-medium tracking-wide">AI structural verdict and scalability scores.</p>
                </div>
              </div>
              
              <div className="markdown-body prose prose-invert max-w-none">
                <ReactMarkdown>{comparison}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
