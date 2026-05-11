import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { RepoStructure } from '../services/githubService';
import { CodebaseAnalysis, chatAboutCodebase } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatInterfaceProps {
  repoData: RepoStructure;
  analysis: CodebaseAnalysis;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ repoData, analysis }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `Identity verified. Analysis of **${repoData.owner}/${repoData.repo}** complete. I am operational and ready to guide you through this architecture. What would you like to explore first?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await chatAboutCodebase(repoData, analysis, userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response || "System failure: Unable to compute response." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Interrupt: Connection to AI Architech severed. Please retry." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-white/5 rounded-2xl bg-zinc-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Architech Terminal</h3>
        </div>
        <div className="text-[10px] font-mono text-zinc-600">v1.0.4-stable</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((message, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex gap-3",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-1",
              message.role === 'user' ? "bg-blue-600/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
            )}>
              {message.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={cn(
              "max-w-[85%] text-xs leading-relaxed transition-all",
              message.role === 'user' ? "text-right" : "text-left"
            )}>
              <div className={cn(
                "inline-block px-4 py-3 rounded-2xl markdown-body prose prose-invert prose-xs text-left",
                message.role === 'user' 
                  ? "bg-blue-600/10 border border-blue-500/20 text-blue-100 rounded-tr-none" 
                  : "bg-white/[0.03] border border-white/5 text-zinc-300 rounded-tl-none"
              )}>
                <div className="text-left whitespace-pre-wrap">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center mt-1">
              <Bot size={12} className="text-zinc-500" />
            </div>
            <div className="bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 rounded-full bg-zinc-600" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-zinc-600" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-zinc-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a command or question..."
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-xs placeholder:text-zinc-700 font-mono transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-all font-mono"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
