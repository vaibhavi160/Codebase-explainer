import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitCompare, Loader2, Trophy, Swords, Zap, AlertCircle, CheckCircle2, XCircle, MinusCircle, BarChart3, Layout, Rocket } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { RepoStructure, fetchRepoData } from '../services/githubService';
import { compareCodebases, ComparisonAnalysis } from '../services/geminiService';
import { cn } from '../lib/utils';

export const ComparisonView: React.FC = () => {
  const [urls, setUrls] = useState(['', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<[RepoStructure, RepoStructure] | null>(null);
  const [activeTab, setActiveTab] = useState<'scores' | 'features' | 'architecture' | 'details'>('scores');

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

  const StatusIcon = ({ status }: { status: 'supported' | 'partial' | 'unsupported' }) => {
    switch (status) {
      case 'supported': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'partial': return <MinusCircle className="text-yellow-500" size={18} />;
      case 'unsupported': return <XCircle className="text-red-500" size={18} />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-[0.25em]">
          <Swords size={14} className="animate-pulse" /> Battlefield Mode
        </div>
        <h2 className="text-6xl font-black text-white tracking-tight uppercase">Architectural <span className="text-zinc-600">Warfare</span></h2>
        <p className="text-zinc-500 max-w-xl mx-auto font-medium">Deep structural analysis and feature battle between two codebases.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
           <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-500 font-black italic shadow-2xl rotate-45">
             <span className="-rotate-45">VS</span>
           </div>
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
                className="w-full relative bg-zinc-900/90 border border-white/5 rounded-2xl px-6 py-6 text-xl text-white font-black placeholder:text-zinc-800 focus:outline-none focus:ring-2 ring-blue-500/20 transition-all"
              />
            </div>
            
            {repos && repos[i] && (
              <motion.div 
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <GitCompare size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Base identified</div>
                    <div className="text-sm font-bold text-white tracking-tight">{repos[i].owner}/{repos[i].repo}</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
                  {Object.keys(repos[i].languages || {}).slice(0, 1)}
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
          className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 font-black px-16 py-6 rounded-3xl transition-all flex items-center gap-3 group shadow-2xl shadow-blue-500/10 active:scale-95"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={24} className="group-hover:fill-current" />}
          {isLoading ? 'CALCULATING ENTROPY...' : 'INITIATE WARFARE'}
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
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Verdict Card */}
            <div className="rounded-[40px] bg-white text-black p-12 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-175 duration-700">
                 <Trophy size={400} />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                 <div className="shrink-0 text-center space-y-4">
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">The Victor</div>
                   <div className="text-8xl font-black italic tracking-tighter leading-none">{comparison.finalVerdict.winner}</div>
                   <div className="inline-block px-4 py-1 rounded-full bg-black/5 text-[10px] font-bold uppercase tracking-widest">Victory Confirmed</div>
                 </div>
                 <div className="space-y-6">
                   <h3 className="text-4xl font-black uppercase tracking-tight leading-tight">
                     {comparison.finalVerdict.summary}
                   </h3>
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-black uppercase tracking-widest opacity-40">Best configuration for:</span>
                     <span className="text-sm font-bold bg-black/10 px-4 py-1.5 rounded-full">{comparison.finalVerdict.bestFor}</span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center justify-center gap-2 bg-zinc-900/50 p-1.5 rounded-3xl border border-white/5 w-fit mx-auto">
              {[
                { id: 'scores', icon: <BarChart3 size={16} />, label: 'Metric Stats' },
                { id: 'features', icon: <CheckCircle2 size={16} />, label: 'Tech Stack' },
                { id: 'architecture', icon: <Layout size={16} />, label: 'Schematics' },
                { id: 'details', icon: <Rocket size={16} />, label: 'Deep Dive' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    activeTab === tab.id ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white"
                  )}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
              {activeTab === 'scores' && (
                <div className="grid grid-cols-1 gap-6">
                  {comparison.scores.map((score, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 rounded-[32px] bg-zinc-900/40 border border-white/5 space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black uppercase tracking-tight text-white">{score.category}</h4>
                        <div className="text-xs font-medium text-zinc-500 max-w-md text-right">{score.reasoning}</div>
                      </div>

                      <div className="space-y-6">
                        {[
                          { label: 'Repo A', score: score.repoAScore, color: 'bg-blue-500' },
                          { label: 'Repo B', score: score.repoBScore, color: 'bg-zinc-600' }
                        ].map((item, j) => (
                          <div key={j} className="space-y-2">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                               <span className="text-zinc-500">{item.label}</span>
                               <span className="text-white">{item.score}%</span>
                             </div>
                             <div className="h-4 bg-zinc-800/50 rounded-full overflow-hidden p-1 border border-white/5">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${item.score}%` }}
                                 className={cn("h-full rounded-full shadow-lg", item.color)}
                                />
                             </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'features' && (
                <div className="rounded-[40px] bg-zinc-900/40 border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5 font-black uppercase text-[10px] tracking-[0.25em] text-zinc-500">
                        <th className="px-8 py-5">Feature Matrix</th>
                        <th className="px-8 py-5">Repo A</th>
                        <th className="px-8 py-5">Repo B</th>
                        <th className="px-8 py-5">Verdict Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {comparison.features.map((f, i) => (
                        <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-8 py-6 font-bold text-white text-sm">{f.feature}</td>
                          <td className="px-8 py-6"><StatusIcon status={f.repoAStatus} /></td>
                          <td className="px-8 py-6"><StatusIcon status={f.repoBStatus} /></td>
                          <td className="px-8 py-6 text-xs text-zinc-500 font-medium">{f.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'architecture' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comparison.architecture.map((arch, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 rounded-[32px] bg-zinc-900/40 border border-white/5 flex flex-col justify-between"
                    >
                      <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8">{arch.title}</h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">Repo A</div>
                           <p className="text-sm font-medium text-zinc-300 leading-relaxed">{arch.repoA}</p>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="space-y-2">
                           <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Repo B</div>
                           <p className="text-sm font-medium text-zinc-300 leading-relaxed">{arch.repoB}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="p-8 rounded-[32px] bg-blue-500/5 border border-blue-500/20 md:col-span-2 lg:col-span-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                      <Layout size={16} /> Scalability Thesis
                    </h4>
                    <p className="text-sm font-medium text-zinc-400 leading-relaxed">
                      {comparison.scalabilityVerdict}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[40px] bg-zinc-900/40 border border-white/5 p-12 relative overflow-hidden"
                >
                  <div className="markdown-body prose prose-invert max-w-none">
                    <ReactMarkdown>{comparison.markdownReport}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
