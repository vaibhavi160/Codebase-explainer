import React, { useState } from 'react';
import { Github, Search, Loader2, Code2, Layers, Cpu, Zap, ArrowRight, Info, AlertCircle, ShieldCheck, FileText, Compass, Heart, Share2, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchRepoData, RepoStructure } from './services/githubService';
import { analyzeCodebase, CodebaseAnalysis, generateDocumentation } from './services/geminiService';
import { GraphView } from './components/GraphView';
import { ChatInterface } from './components/ChatInterface';
import { FileDeepDive } from './components/FileDeepDive';
import { ComparisonView } from './components/ComparisonView';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

type Tab = 'visual' | 'health' | 'docs' | 'chat' | 'compare';

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<RepoStructure | null>(null);
  const [analysis, setAnalysis] = useState<CodebaseAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('visual');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<{ type: string, content: string } | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isBattleMode, setIsBattleMode] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setLoadingStep('Accessing GitHub API...');
    setError(null);
    setRepoData(null);
    setAnalysis(null);

    try {
      const data = await fetchRepoData(url);
      setRepoData(data);
      
      setLoadingStep('AI Architech Analyzing...');
      const result = await analyzeCodebase(data);
      setAnalysis(result);
      setActiveTab('visual');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze repository. Make sure it is public.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDoc = async (type: 'readme' | 'quickstart' | 'learning-path') => {
    if (!repoData) return;
    setIsGeneratingDoc(true);
    try {
      const content = await generateDocumentation(repoData, type);
      setGeneratedDoc({ type, content });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>
      
      <main className="relative z-10 max-w-[1700px] mx-auto px-6 py-6 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!analysis ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-16 py-20"
            >
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-[0.25em]"
                  >
                    <Cpu size={14} className="animate-pulse" /> Neural Repo Intelligence
                  </motion.div>
                  
                  <div className="bg-zinc-900/50 p-1 rounded-2xl border border-white/5 flex gap-1">
                    <button 
                      onClick={() => setIsBattleMode(false)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        !isBattleMode ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Exploration
                    </button>
                    <button 
                      onClick={() => setIsBattleMode(true)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        isBattleMode ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Battlefront
                    </button>
                  </div>
                </div>

                <h1 className="text-7xl md:text-9xl font-black tracking-tight text-white leading-[0.9]">
                  {isBattleMode ? 'VERSUS' : 'SEE THE'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500">{isBattleMode ? 'MODE.' : 'CODEBASE.'}</span>
                </h1>
                <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-medium">
                  {isBattleMode 
                    ? "Side-by-side architectural warfare. Compare two repositories for structural superiority."
                    : "The ultimate visual tool to decode logic, spot smells, and master any GitHub repository instantly."}
                </p>
              </div>

              <div className="w-full max-w-5xl">
                {isBattleMode ? (
                  <ComparisonView />
                ) : isLoading ? (
                  <div className="p-16 rounded-[40px] bg-zinc-900/40 border border-white/5 backdrop-blur-3xl flex flex-col items-center gap-8 shadow-2xl">
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 rounded-full border-2 border-dashed border-blue-500/40" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-mono text-blue-400 uppercase tracking-widest">{loadingStep}</p>
                      <p className="text-xs text-zinc-600 font-medium">Decompressing graph nodes and edge weights...</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative group max-w-3xl mx-auto">
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                    <div className="relative flex items-center bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 pl-6 focus-within:ring-2 ring-blue-500/30 transition-all shadow-2xl">
                      <Github className="text-zinc-500 shrink-0" size={28} />
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="Organization / Repository (e.g. facebook/react)"
                        className="w-full bg-transparent border-none focus:ring-0 px-6 py-5 text-white placeholder:text-zinc-700 outline-none font-bold text-lg"
                      />
                      <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !url}
                        className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 font-black px-10 py-5 rounded-xl transition-all flex items-center gap-2 group/btn"
                      >
                        ANALYZE
                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-14 left-0 right-0 flex items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                        <AlertCircle size={16} /> {error}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {!isBattleMode && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-6xl">
                  {[
                    { icon: <Layers size={22} />, title: "Code Mapping", desc: "Interactive D3-powered relationship graph." },
                    { icon: <ShieldCheck size={22} />, title: "Health Auditor", desc: "AI spot-checks for smells and long methods." },
                    { icon: <Compass size={22} />, title: "Learning Paths", desc: "Start-to-finish guides for any new codebase." },
                    { icon: <FileText size={22} />, title: "Doc Forge", desc: "Auto-generate READMEs and setup guides." },
                  ].map((feat, i) => (
                    <div key={i} className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all text-left">
                      <div className="mb-6 p-3 rounded-2xl bg-zinc-800/80 w-fit text-blue-400">{feat.icon}</div>
                      <h3 className="font-black text-white mb-3 text-lg uppercase tracking-tight">{feat.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed font-medium">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col gap-6 h-full min-h-0"
            >
              <header className="flex items-center justify-between bg-zinc-900/60 backdrop-blur-3xl border border-white/5 p-4 rounded-3xl shadow-xl">
                 <div className="flex items-center gap-6">
                    <button 
                      onClick={() => { setAnalysis(null); setRepoData(null); }}
                      className="p-3 rounded-2xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all transform hover:-translate-x-1"
                    >
                      <ArrowRight className="rotate-180" size={24} />
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div className="flex flex-col">
                       <h2 className="text-lg font-black text-white tracking-tight leading-none mb-1">
                         {repoData?.owner} / {repoData?.repo}
                       </h2>
                       <div className="flex gap-2 items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                             LIVE ANALYSIS VERSION 4.0.2
                          </span>
                       </div>
                    </div>
                 </div>

                 <nav className="hidden md:flex bg-black/40 border border-white/5 p-1 rounded-2xl">
                    {(['visual', 'health', 'docs', 'chat'] as const).map((tab) => (
                       <button
                         key={tab}
                         onClick={() => setActiveTab(tab)}
                         className={cn(
                           "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                           activeTab === tab ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                         )}
                       >
                         {tab}
                       </button>
                    ))}
                 </nav>

                 <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-2xl bg-zinc-800/80 border border-white/5 flex flex-col items-end">
                       <span className="text-[10px] uppercase font-black text-zinc-500 tracking-tighter">Health Score</span>
                       <span className={cn(
                         "text-lg font-black leading-none",
                         analysis.healthScore > 80 ? "text-green-500" : analysis.healthScore > 50 ? "text-yellow-500" : "text-red-500"
                       )}>
                         {analysis.healthScore}/100
                       </span>
                    </div>
                    <button className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform active:scale-95">
                       <Share2 size={20} />
                    </button>
                 </div>
              </header>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
                {/* Main Visual/Content Area */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
                  <AnimatePresence mode="wait">
                    {activeTab === 'visual' && (
                      <motion.div 
                        key="visual" 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative"
                      >
                        <GraphView 
                          nodes={repoData?.tree || []} 
                          relationships={analysis.fileRelationships} 
                          onNodeClick={(id) => setSelectedFile(id)}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'health' && (
                      <motion.div 
                        key="health" 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex-1 rounded-3xl bg-zinc-900/40 border border-white/5 p-10 overflow-y-auto custom-scrollbar"
                      >
                        <div className="max-w-3xl mx-auto space-y-10">
                           <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                              <ShieldCheck size={48} className="text-green-500" />
                              <div>
                                 <h2 className="text-3xl font-black text-white">Codebase Health Audit</h2>
                                 <p className="text-zinc-500">Automated structural and documentation assessment.</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {analysis.healthFindings.map((finding, i) => (
                                <div key={i} className={cn(
                                  "p-6 rounded-3xl border flex gap-4 items-start",
                                  finding.type === 'positive' ? "bg-green-500/10 border-green-500/20" : 
                                  finding.type === 'negative' ? "bg-red-500/10 border-red-500/20" : 
                                  "bg-zinc-800 border-white/5"
                                )}>
                                  <div className={cn(
                                    "mt-1 w-2 h-2 rounded-full shrink-0",
                                    finding.type === 'positive' ? "bg-green-400" : finding.type === 'negative' ? "bg-red-400" : "bg-zinc-400"
                                  )} />
                                  <p className="text-sm text-zinc-300 font-medium leading-relaxed">{finding.message}</p>
                                </div>
                              ))}
                           </div>

                           <div className="p-8 rounded-3xl bg-blue-600/5 border border-blue-500/10 space-y-4">
                              <h3 className="text-lg font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                 <AlertCircle size={20} /> AI Risk Assessment
                              </h3>
                              <p className="text-zinc-400 leading-relaxed">
                                 The project adheres to modern standards for {repoData ? Object.keys(repoData.languages)[0] : 'core'} development. 
                                 However, noticed {analysis.healthFindings.filter(f => f.type === 'negative').length} potential architectural concerns. 
                                 Maintainability is {analysis.healthScore > 75 ? 'Excellent' : 'Moderate'}.
                              </p>
                           </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'docs' && (
                      <motion.div 
                        key="docs" 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col gap-6"
                      >
                         <div className="grid grid-cols-3 gap-6">
                            {[
                               { id: 'readme', icon: <FileText />, label: "README.md", desc: "Strategic project overview" },
                               { id: 'quickstart', icon: <Zap />, label: "Quickstart", desc: "Setup in 3 minutes" },
                               { id: 'learning-path', icon: <Compass />, label: "Learning Path", desc: "Guided tour through logic" },
                            ].map((doc) => (
                               <button
                                 key={doc.id}
                                 onClick={() => handleGenerateDoc(doc.id as any)}
                                 className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-blue-500/50 transition-all text-left group"
                               >
                                  <div className="mb-4 p-3 rounded-2xl bg-zinc-800 w-fit text-blue-400 group-hover:scale-110 transition-transform">{doc.icon}</div>
                                  <h3 className="font-black text-white uppercase tracking-tight">{doc.label}</h3>
                                  <p className="text-xs text-zinc-500 mt-2">{doc.desc}</p>
                               </button>
                            ))}
                         </div>

                         <div className="flex-1 rounded-3xl bg-zinc-900/40 border border-white/5 p-10 overflow-y-auto custom-scrollbar relative font-medium leading-relaxed">
                            {isGeneratingDoc ? (
                               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                                  <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                                  <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest italic animate-pulse">Forging Documentation...</p>
                               </div>
                            ) : generatedDoc ? (
                               <div className="max-w-4xl mx-auto">
                                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                                     <h2 className="text-2xl font-black uppercase tracking-tight text-white">{generatedDoc.type.replace('-', ' ')}</h2>
                                     <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 transition-all">
                                        <Clipboard size={14} /> Copy to Clipboard
                                     </button>
                                  </div>
                                  <div className="markdown-body prose prose-invert max-w-none">
                                     <ReactMarkdown>{generatedDoc.content}</ReactMarkdown>
                                  </div>
                               </div>
                            ) : (
                               <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                  <FileText size={80} className="mb-4" />
                                  <p className="text-lg font-bold uppercase tracking-widest">Select a Document Type to Forge</p>
                               </div>
                            )}
                         </div>
                      </motion.div>
                    )}

                    {activeTab === 'chat' && (
                       <motion.div 
                        key="chat" 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1"
                       >
                         <ChatInterface repoData={repoData!} analysis={analysis} />
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Sidebar: Quick Stats & Insights */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                   <div className="p-8 rounded-[32px] bg-indigo-600 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-20 group-hover:scale-110 transition-transform duration-700">
                         <Github size={180} />
                      </div>
                      <div className="relative z-10 space-y-6">
                         <div>
                            <div className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.2em] mb-4">Core Tech Stack</div>
                            <div className="flex flex-wrap gap-2">
                               {analysis.techStack.map(tech => (
                                 <span key={tech} className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase">
                                   {tech}
                                 </span>
                               ))}
                            </div>
                         </div>
                         
                         <div className="space-y-4">
                            <div className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.2em]">Architecture Snapshot</div>
                            <p className="text-sm text-indigo-50 font-medium leading-relaxed italic">
                              "{analysis.mainFlow.slice(0, 160)}..."
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 rounded-[32px] bg-zinc-900/40 border border-white/5 p-8 overflow-y-auto custom-scrollbar space-y-8">
                      <div>
                         <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                           <Layers size={14} className="text-blue-500" /> Blueprint Hub
                         </h3>
                         <div className="grid grid-cols-1 gap-4">
                            {analysis.keyFiles.map((file, i) => (
                              <button 
                                key={i} 
                                onClick={() => setSelectedFile(file.path)}
                                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all text-left text-xs group"
                              >
                                 <div className="font-mono text-zinc-300 font-bold mb-1 truncate group-hover:text-blue-400 transition-colors">{file.path.split('/').pop()}</div>
                                 <div className="text-[10px] text-zinc-500 leading-tight line-clamp-2">{file.purpose}</div>
                              </button>
                            ))}
                         </div>
                      </div>

                      <div>
                         <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                           <Heart size={14} className="text-red-500" /> Repository Pulse
                         </h3>
                         <div className="space-y-6">
                            <div className="space-y-3">
                               {Object.entries(repoData?.languages || {}).map(([lang, bytes]) => (
                                  <div key={lang} className="space-y-2">
                                     <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span className="text-zinc-400">{lang}</span>
                                        <span className="text-zinc-500">{Math.round((bytes / Object.values(repoData?.languages || {}).reduce((a, b) => a + (b as number), 0)) * 100)}%</span>
                                     </div>
                                     <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(bytes / Object.values(repoData?.languages || {}).reduce((a, b) => a + (b as number), 0)) * 100}%` }}
                                          className="h-full bg-blue-600 rounded-full"
                                        />
                                     </div>
                                  </div>
                               ))}
                            </div>

                            {repoData?.contributors && repoData.contributors.length > 0 && (
                               <div className="pt-6 border-t border-white/5 space-y-4">
                                  <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Key Contributors</div>
                                  <div className="flex flex-wrap gap-3">
                                     {repoData.contributors.map(c => (
                                       <div key={c.login} className="flex items-center gap-2 bg-white/[0.03] p-1.5 pr-4 rounded-xl border border-white/5">
                                          <img src={c.avatar_url} alt={c.login} className="w-6 h-6 rounded-lg" referrerPolicy="no-referrer" />
                                          <div className="flex flex-col">
                                             <span className="text-[10px] font-bold text-white leading-none">{c.login}</span>
                                             <span className="text-[8px] text-zinc-600 uppercase font-black">{c.contributions} pts</span>
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Selection Drawer */}
              <AnimatePresence>
                {selectedFile && (
                  <>
                    <motion.div 
                      key="overlay"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setSelectedFile(null)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" 
                    />
                    <FileDeepDive 
                      key="drawer"
                      filePath={selectedFile} 
                      repoData={repoData!} 
                      onClose={() => setSelectedFile(null)} 
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
