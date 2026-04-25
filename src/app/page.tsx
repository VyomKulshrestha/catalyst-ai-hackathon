"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { processJobDescription, chatWithCandidate, MatchResult, ChatMessage } from "./actions";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [jd, setJd] = useState("");
  const [step, setStep] = useState<"API" | "JD" | "LOADING" | "RESULTS" | "CHAT" | "FINAL">("API");
  
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [interestScores, setInterestScores] = useState<Record<string, number>>({});
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  
  const [draftMessage, setDraftMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistories, activeCandidateId]);

  const handleStartSearch = async () => {
    if (!jd.trim()) return;
    setStep("LOADING");
    try {
      const results = await processJobDescription(apiKey, jd);
      setMatchResults(results);
      const initialChats: Record<string, ChatMessage[]> = {};
      const initialScores: Record<string, number> = {};
      results.forEach(r => {
        initialChats[r.candidateId] = [];
        initialScores[r.candidateId] = 0;
      });
      setChatHistories(initialChats);
      setInterestScores(initialScores);
      setStep("RESULTS");
    } catch (e) {
      alert("Error processing JD. Please check your API key.");
      setStep("API");
    }
  };

  const handleSendMessage = async () => {
    if (!draftMessage.trim() || !activeCandidateId) return;
    
    setIsChatLoading(true);
    const history = chatHistories[activeCandidateId] || [];
    const newHistory: ChatMessage[] = [...history, { role: "user", text: draftMessage }];
    setChatHistories(prev => ({ ...prev, [activeCandidateId]: newHistory }));
    setDraftMessage("");
    
    try {
      const res = await chatWithCandidate(apiKey, activeCandidateId, newHistory, jd);
      const updatedHistory: ChatMessage[] = [...newHistory, { role: "model", text: res.response }];
      setChatHistories(prev => ({ ...prev, [activeCandidateId]: updatedHistory }));
      setInterestScores(prev => ({ ...prev, [activeCandidateId]: res.interestScore }));
    } catch (e) {
      alert("Failed to send message.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const activeCandidate = matchResults.find(c => c.candidateId === activeCandidateId);
  const finalRanking = [...matchResults]
    .map(c => ({
      ...c,
      interestScore: interestScores[c.candidateId] || 0,
      globalScore: (c.matchScore * 0.6) + ((interestScores[c.candidateId] || 0) * 0.4)
    }))
    .sort((a, b) => b.globalScore - a.globalScore);

  return (
    <div className="bg-[#0e0e0e] min-h-screen overflow-x-hidden text-white font-body">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#9c48ea]/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#3323cc]/10 blur-[100px]"></div>
      </div>

      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-zinc-900/50 backdrop-blur-[30px] shadow-[0px_24px_48px_rgba(54,0,97,0.1)] flex flex-col py-8 z-50 border-r border-white/5">
        <div className="px-8 mb-12">
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#c284ff] to-[#69daff] font-headline uppercase">LUMINAL</h1>
            <p className="text-zinc-500 font-headline text-[10px] tracking-[0.2em] uppercase mt-1">Oracle V.1</p>
        </div>
        <nav className="flex-1 space-y-1">
            <a className="text-zinc-500 hover:text-zinc-300 px-6 py-4 flex items-center gap-4 transition-all font-headline text-sm tracking-wide uppercase hover:bg-white/5" href="#">
                <span className="material-symbols-outlined">psychology</span>
                <span>Intelligence</span>
            </a>
            <a className="bg-gradient-to-r from-[#360061]/40 to-[#120076]/40 text-[#c0bdff] border-r-2 border-[#9492ff] px-6 py-4 flex items-center gap-4 transition-all font-headline text-sm tracking-wide uppercase" href="#">
                <span className="material-symbols-outlined">radar</span>
                <span>Scout Pipeline</span>
            </a>
            <a className="text-zinc-500 hover:text-zinc-300 px-6 py-4 flex items-center gap-4 transition-all font-headline text-sm tracking-wide uppercase hover:bg-white/5" href="#">
                <span className="material-symbols-outlined">groups</span>
                <span>Talent Market</span>
            </a>
        </nav>
      </aside>

      {/* TopAppBar Shell */}
      <header className="fixed top-0 right-0 w-[calc(100%-18rem)] z-40 bg-[#0e0e0e]/20 backdrop-blur-md flex justify-between items-center px-12 h-20">
          <div className="flex items-center gap-8">
              <span className="font-black text-white italic tracking-widest font-headline">THE SCOUT</span>
          </div>
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-zinc-400">
                  <span className="material-symbols-outlined">notifications_active</span>
                  <div className="w-8 h-8 rounded-full border border-[#cc97ff]/30 bg-[#262626] flex items-center justify-center overflow-hidden">
                     <span className="material-symbols-outlined text-sm">person</span>
                  </div>
              </div>
          </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-72 pt-32 px-12 pb-20 relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: API KEY */}
          {step === "API" && (
            <motion.div key="api" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto w-full max-w-lg bg-[#131313] border border-white/5 p-10 rounded-[2rem]">
              <div className="mb-8">
                <span className="material-symbols-outlined text-4xl text-[#cc97ff] mb-4">vpn_key</span>
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tighter">System Access</h2>
                <p className="text-zinc-500 mt-2 text-sm">Provide your Gemini Key to initialize the Oracle intelligence layer.</p>
              </div>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-[#000000] border border-[#494847]/30 rounded-xl px-5 py-4 focus:outline-none focus:border-[#cc97ff] focus:shadow-[0_0_10px_rgba(204,151,255,0.2)] transition-all text-white mb-8"
              />
              <button 
                onClick={() => { if (apiKey) { setApiKeySaved(true); setStep("JD"); } }}
                disabled={!apiKey}
                className="w-full bg-gradient-to-r from-[#9c48ea] to-[#cc97ff] text-[#360061] px-8 py-4 rounded-xl font-headline font-black text-sm uppercase tracking-widest glow-primary transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                Initialize Oracle
              </button>
            </motion.div>
          )}

          {/* STEP 2: JOB DESCRIPTION */}
          {step === "JD" && (
            <motion.div key="jd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto w-full max-w-2xl bg-[#131313] border border-white/5 p-10 rounded-[2rem]">
              <div className="mb-8">
                <span className="material-symbols-outlined text-4xl text-[#69daff] mb-4">document_scanner</span>
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tighter">Target Parameters</h2>
                <p className="text-zinc-500 mt-2 text-sm">Provide the job description. The Oracle will parse tech stack and seniority.</p>
              </div>
              <textarea 
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Looking for a Senior AI Engineer..."
                className="w-full h-64 bg-[#000000] border border-[#494847]/30 rounded-xl p-5 focus:outline-none focus:border-[#69daff] transition-all text-white resize-none mb-8 font-body text-sm"
              />
              <button 
                onClick={handleStartSearch}
                disabled={!jd.trim()}
                className="w-full bg-gradient-to-r from-[#00c0ea] to-[#69daff] text-[#004050] px-8 py-4 rounded-xl font-headline font-black text-sm uppercase tracking-widest glow-tertiary transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                Launch Discovery Protocol
              </button>
            </motion.div>
          )}

          {/* STEP 3: LOADING */}
          {step === "LOADING" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto text-center">
              <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 animate-spin">
                  <circle className="text-[#262626]" cx="64" cy="64" fill="transparent" r="60" stroke="currentColor" strokeWidth="2"></circle>
                  <circle className="text-[#69daff] glow-tertiary" cx="64" cy="64" fill="transparent" r="60" stroke="currentColor" strokeDasharray="377" strokeDashoffset="250" strokeWidth="4"></circle>
                </svg>
                <span className="absolute material-symbols-outlined text-[#69daff] text-4xl animate-pulse">radar</span>
              </div>
              <h2 className="text-2xl font-headline font-bold uppercase tracking-widest text-[#cc97ff]">Scanning Luminal Layer</h2>
            </motion.div>
          )}

          {/* STEP 4: DASHBOARD / RESULTS */}
          {step === "RESULTS" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <div className="flex justify-between items-end mb-12">
                  <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#69daff] animate-pulse"></span>
                          <span className="text-[#69daff] font-headline text-xs tracking-widest uppercase">Live Pulse Monitoring</span>
                      </div>
                      <h2 className="text-5xl font-black font-headline tracking-tighter uppercase leading-none">Candidate Pipeline</h2>
                  </div>
                  <button onClick={() => setStep("FINAL")} className="bg-gradient-to-r from-[#9c48ea] to-[#cc97ff] text-[#360061] px-8 py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-widest glow-primary transition-transform active:scale-[0.98]">
                      Finalize Shortlist
                  </button>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {matchResults.map((candidate, i) => (
                  <div key={candidate.candidateId} className="col-span-12 xl:col-span-6 bg-[#131313] rounded-[2rem] p-8 border border-white/5 hover:bg-[#201f1f] transition-all relative overflow-hidden flex flex-col md:flex-row gap-8">
                      <div className="flex-shrink-0 relative">
                          <div className="relative w-24 h-24 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                  <circle className="text-[#262626]" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeWidth="4"></circle>
                                  <circle className="text-[#69daff] glow-tertiary" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeDasharray="276" strokeDashoffset={276 - (276 * candidate.matchScore) / 100} strokeWidth="4"></circle>
                              </svg>
                              <span className="absolute text-sm font-headline font-black text-white">{candidate.matchScore}%</span>
                          </div>
                      </div>
                      <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                              <span className="bg-[#cc97ff]/10 text-[#cc97ff] text-[10px] px-2 py-0.5 rounded font-headline uppercase tracking-tighter border border-[#cc97ff]/20">Match</span>
                              <span className="text-zinc-500 text-[10px] font-headline tracking-widest uppercase">Int: {interestScores[candidate.candidateId] > 0 ? interestScores[candidate.candidateId]+'%' : 'N/A'}</span>
                          </div>
                          <h3 className="text-2xl font-headline font-bold mb-1 text-white">{candidate.name}</h3>
                          <p className="text-[#9492ff] font-headline text-xs uppercase tracking-widest mb-4">{candidate.role}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-6">
                              {candidate.skills.slice(0, 3).map(s => (
                                  <span key={s} className="px-3 py-1 rounded-full bg-[#201f1f] text-[#adaaaa] text-[10px] font-label uppercase tracking-widest border border-white/5">{s}</span>
                              ))}
                          </div>
                          <button onClick={() => { setActiveCandidateId(candidate.candidateId); setStep("CHAT"); }} className="w-full bg-[#262626] hover:bg-[#cc97ff] hover:text-[#360061] text-white px-8 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all">
                              Engage Candidate
                          </button>
                      </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5: CHAT UI */}
          {step === "CHAT" && activeCandidate && (
             <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl m-auto bg-[#131313] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.5)] h-[70vh]">
                <div className="bg-[#0e0e0e] border-b border-white/5 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button onClick={() => setStep("RESULTS")} className="text-zinc-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                      <h3 className="font-headline font-bold text-lg">{activeCandidate.name}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{activeCandidate.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-headline font-bold">
                    <div className="flex items-center gap-2">
                       <span className="text-zinc-500 text-[10px] uppercase">Match</span>
                       <span className="text-[#69daff]">{activeCandidate.matchScore}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-zinc-500 text-[10px] uppercase">Interest</span>
                       <span className="text-[#ff6e84]">{interestScores[activeCandidate.candidateId] || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  <div className="max-w-[80%] mx-auto bg-[#cc97ff]/5 border border-[#cc97ff]/20 text-[#cc97ff] text-xs p-5 rounded-xl text-center font-body">
                    <span className="font-headline font-bold block mb-2 uppercase tracking-widest text-[10px]">Oracle Assessment</span>
                    {activeCandidate.explanation}
                  </div>

                  {chatHistories[activeCandidate.candidateId]?.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                        msg.role === 'user' 
                        ? 'bg-gradient-to-r from-[#9c48ea] to-[#cc97ff] text-[#360061] font-medium rounded-br-none' 
                        : 'bg-[#201f1f] text-white border border-white/5 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#201f1f] border border-white/5 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-200"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="bg-[#0e0e0e] p-6 border-t border-white/5 flex gap-4">
                  <input 
                    type="text" 
                    value={draftMessage}
                    onChange={e => setDraftMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Initiate engagement sequence..."
                    className="flex-1 bg-[#000000] border border-[#494847]/30 rounded-xl px-5 py-3 focus:outline-none focus:border-[#cc97ff] transition-all text-white text-sm"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!draftMessage.trim() || isChatLoading}
                    className="bg-[#cc97ff] hover:bg-[#c284ff] disabled:opacity-50 text-[#360061] px-6 rounded-xl flex items-center justify-center transition-all glow-primary"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
             </motion.div>
          )}

          {/* STEP 6: FINAL SHORTLIST */}
          {step === "FINAL" && (
            <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <div className="flex items-center justify-between mb-12">
                  <div className="space-y-2">
                      <h2 className="text-5xl font-black font-headline tracking-tighter uppercase leading-none text-[#cc97ff]">Global Ranking</h2>
                      <p className="text-zinc-500 text-sm tracking-widest uppercase">Combined Metric Analysis</p>
                  </div>
                  <button onClick={() => setStep("RESULTS")} className="bg-[#131313] hover:bg-[#201f1f] border border-white/5 text-white px-6 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all">
                      Return to Pipeline
                  </button>
              </div>

              <div className="bg-[#131313] border border-white/5 rounded-[2rem] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#000000] text-zinc-500 text-[10px] font-headline uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Rank</th>
                      <th className="px-8 py-5">Candidate</th>
                      <th className="px-8 py-5">Match Confidence</th>
                      <th className="px-8 py-5">Engagement Level</th>
                      <th className="px-8 py-5 text-white">Luminal Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {finalRanking.map((c, idx) => (
                      <tr key={c.candidateId} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 text-xl font-headline font-black text-zinc-600">0{idx + 1}</td>
                        <td className="px-8 py-6">
                          <div className="font-headline font-bold text-white text-lg">{c.name}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{c.role}</div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                               <div className="flex-1 bg-[#000000] rounded-full h-1.5 overflow-hidden">
                                 <div className="bg-[#69daff] h-full glow-tertiary" style={{ width: `${c.matchScore}%` }}></div>
                               </div>
                               <span className="text-xs text-[#69daff] font-headline font-bold">{c.matchScore}%</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                               <div className="flex-1 bg-[#000000] rounded-full h-1.5 overflow-hidden">
                                 <div className="bg-[#ff6e84] h-full" style={{ width: `${c.interestScore}%`, boxShadow: '0 0 10px rgba(255,110,132,0.5)' }}></div>
                               </div>
                               <span className="text-xs text-[#ff6e84] font-headline font-bold">{c.interestScore}%</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-3xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-[#cc97ff] to-[#69daff]">
                            {c.globalScore.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
