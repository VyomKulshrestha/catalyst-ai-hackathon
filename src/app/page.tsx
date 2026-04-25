"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { processJobDescription, autonomousEngageCandidate, MatchResult, AutonomousEngagementResult } from "./actions";
import defaultCandidates from "@/data/candidates.json";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [jd, setJd] = useState("");
  const [step, setStep] = useState<"API" | "JD" | "LOADING" | "RESULTS" | "ENGAGING" | "TRANSCRIPT" | "FINAL">("API");
  
  const [candidatesList, setCandidatesList] = useState<any[]>(defaultCandidates);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  
  const [engagementResults, setEngagementResults] = useState<Record<string, AutonomousEngagementResult>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [engagementResults, activeCandidateId]);

  const handleStartSearch = async () => {
    if (!jd.trim()) return;
    setStep("LOADING");
    try {
      const results = await processJobDescription(apiKey || undefined, jd, candidatesList);
      setMatchResults(results);
      setStep("RESULTS");
    } catch (e: any) {
      alert("Error processing JD: " + e.message);
      setStep("API");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Simple JSON parsing for hackathon constraints
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
           setCandidatesList(data);
           alert("Successfully loaded " + data.length + " candidates from database.");
        }
      } catch (err) {
        alert("Failed to parse database file. Ensure it is a valid JSON array.");
      }
    };
    reader.readAsText(file);
  };

  const handleAutonomousEngagement = async (candidateId: string) => {
    setActiveCandidateId(candidateId);
    setStep("ENGAGING");
    
    try {
      const candidateObj = candidatesList.find(c => c.id === candidateId || c.candidateId === candidateId);
      const res = await autonomousEngageCandidate(apiKey || undefined, candidateObj, jd);
      setEngagementResults(prev => ({ ...prev, [candidateId]: res }));
      setStep("TRANSCRIPT");
    } catch (e: any) {
      alert("Failed to engage candidate: " + e.message);
      setStep("RESULTS");
    }
  };

  const activeCandidate = matchResults.find(c => c.candidateId === activeCandidateId);
  const activeEngagement = activeCandidateId ? engagementResults[activeCandidateId] : null;

  const finalRanking = [...matchResults]
    .map(c => {
      const e = engagementResults[c.candidateId];
      const interestScore = e ? e.interestScore : 0;
      return {
        ...c,
        interestScore,
        globalScore: (c.matchScore * 0.6) + (interestScore * 0.4)
      };
    })
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
            <p className="text-zinc-500 font-headline text-[10px] tracking-[0.2em] uppercase mt-1">Autonomous Agent V.1</p>
        </div>
        <nav className="flex-1 space-y-1">
            <div className="bg-gradient-to-r from-[#360061]/40 to-[#120076]/40 text-[#c0bdff] border-r-2 border-[#9492ff] px-6 py-4 flex items-center gap-4 transition-all font-headline text-sm tracking-wide uppercase">
                <span className="material-symbols-outlined">radar</span>
                <span>Agent Pipeline</span>
            </div>
        </nav>
      </aside>

      {/* TopAppBar Shell */}
      <header className="fixed top-0 right-0 w-[calc(100%-18rem)] z-40 bg-[#0e0e0e]/20 backdrop-blur-md flex justify-between items-center px-12 h-20">
          <div className="flex items-center gap-8">
              <span className="font-black text-white italic tracking-widest font-headline">THE SCOUT</span>
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
                <p className="text-zinc-500 mt-2 text-sm">Provide your Gemini Key to initialize the Agent core.</p>
              </div>
              <input 
                type="password" 
                placeholder="AIzaSy... (Leave blank to use Server Key)" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-[#000000] border border-[#494847]/30 rounded-xl px-5 py-4 focus:outline-none focus:border-[#cc97ff] focus:shadow-[0_0_10px_rgba(204,151,255,0.2)] transition-all text-white mb-8"
              />
              <button 
                onClick={() => { setApiKeySaved(true); setStep("JD"); }}
                className="w-full bg-gradient-to-r from-[#9c48ea] to-[#cc97ff] text-[#360061] px-8 py-4 rounded-xl font-headline font-black text-sm uppercase tracking-widest glow-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Initialize Agent
              </button>
            </motion.div>
          )}

          {/* STEP 2: JOB DESCRIPTION */}
          {step === "JD" && (
            <motion.div key="jd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto w-full max-w-2xl bg-[#131313] border border-white/5 p-10 rounded-[2rem]">
              <div className="mb-8">
                <span className="material-symbols-outlined text-4xl text-[#69daff] mb-4">document_scanner</span>
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tighter">Target Parameters</h2>
                <p className="text-zinc-500 mt-2 text-sm">Provide the job description. The Agent will scan the talent pool.</p>
              </div>
              <textarea 
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Looking for a Senior AI Engineer..."
                className="w-full h-48 bg-[#000000] border border-[#494847]/30 rounded-xl p-5 focus:outline-none focus:border-[#69daff] transition-all text-white resize-none mb-6 font-body text-sm"
              />
              <div className="mb-8 border border-white/5 rounded-xl p-4 bg-[#0e0e0e] flex items-center justify-between">
                <div>
                   <h3 className="font-headline text-sm font-bold text-white mb-1">Talent Database</h3>
                   <p className="text-xs text-zinc-500">Currently loaded: {candidatesList.length} profiles</p>
                </div>
                <label className="cursor-pointer bg-[#262626] hover:bg-[#333] border border-[#494847]/30 text-zinc-300 px-4 py-2 rounded-lg font-headline text-xs tracking-widest uppercase transition-all">
                   Upload JSON DB
                   <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <button 
                onClick={handleStartSearch}
                disabled={!jd.trim() || candidatesList.length === 0}
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
              <h2 className="text-2xl font-headline font-bold uppercase tracking-widest text-[#cc97ff]">Agent is Scanning Network</h2>
            </motion.div>
          )}

          {/* STEP 4: DASHBOARD / RESULTS */}
          {step === "RESULTS" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <div className="flex justify-between items-end mb-12">
                  <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#69daff] animate-pulse"></span>
                          <span className="text-[#69daff] font-headline text-xs tracking-widest uppercase">Agent Discovery Complete</span>
                      </div>
                      <h2 className="text-5xl font-black font-headline tracking-tighter uppercase leading-none">Talent Pool</h2>
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
                              {engagementResults[candidate.candidateId] && (
                                <span className="text-[#ff6e84] text-[10px] font-headline tracking-widest uppercase glow-primary">Int: {engagementResults[candidate.candidateId].interestScore}%</span>
                              )}
                          </div>
                          <h3 className="text-2xl font-headline font-bold mb-1 text-white">{candidate.name}</h3>
                          <p className="text-[#9492ff] font-headline text-xs uppercase tracking-widest mb-4">{candidate.role}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-6">
                              {candidate.skills.slice(0, 3).map(s => (
                                  <span key={s} className="px-3 py-1 rounded-full bg-[#201f1f] text-[#adaaaa] text-[10px] font-label uppercase tracking-widest border border-white/5">{s}</span>
                              ))}
                          </div>
                          {engagementResults[candidate.candidateId] ? (
                            <button onClick={() => { setActiveCandidateId(candidate.candidateId); setStep("TRANSCRIPT"); }} className="w-full bg-[#360061] text-[#c284ff] border border-[#cc97ff]/30 px-8 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all">
                                View Agent Transcript
                            </button>
                          ) : (
                            <button onClick={() => handleAutonomousEngagement(candidate.candidateId)} className="w-full bg-[#262626] hover:bg-[#69daff] hover:text-[#004050] text-white px-8 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all">
                                Delegate Agent Outreach
                            </button>
                          )}
                      </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5A: ENGAGING (LOADING) */}
          {step === "ENGAGING" && (
            <motion.div key="engaging" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto text-center">
              <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 animate-spin">
                  <circle className="text-[#262626]" cx="64" cy="64" fill="transparent" r="60" stroke="currentColor" strokeWidth="2"></circle>
                  <circle className="text-[#ff6e84]" cx="64" cy="64" fill="transparent" r="60" stroke="currentColor" strokeDasharray="377" strokeDashoffset="250" strokeWidth="4" style={{ boxShadow: '0 0 10px rgba(255,110,132,0.5)' }}></circle>
                </svg>
                <span className="absolute material-symbols-outlined text-[#ff6e84] text-4xl animate-pulse">forum</span>
              </div>
              <h2 className="text-2xl font-headline font-bold uppercase tracking-widest text-white mb-2">Agent is negotiating...</h2>
              <p className="text-zinc-500 font-headline tracking-widest text-xs uppercase">Simulating autonomous dialogue</p>
            </motion.div>
          )}

          {/* STEP 5B: TRANSCRIPT */}
          {step === "TRANSCRIPT" && activeCandidate && activeEngagement && (
             <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl m-auto bg-[#131313] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.5)] h-[70vh]">
                <div className="bg-[#0e0e0e] border-b border-white/5 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button onClick={() => setStep("RESULTS")} className="text-zinc-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                      <h3 className="font-headline font-bold text-lg">{activeCandidate.name}</h3>
                      <p className="text-[10px] text-[#69daff] uppercase tracking-widest">Agent Interaction Log</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-headline font-bold">
                    <div className="flex items-center gap-2">
                       <span className="text-zinc-500 text-[10px] uppercase">Match</span>
                       <span className="text-[#69daff]">{activeCandidate.matchScore}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-zinc-500 text-[10px] uppercase">Calculated Interest</span>
                       <span className="text-[#ff6e84]">{activeEngagement.interestScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  <div className="max-w-[80%] mx-auto bg-[#cc97ff]/5 border border-[#cc97ff]/20 text-[#cc97ff] text-xs p-5 rounded-xl text-center font-body mb-8">
                    <span className="font-headline font-bold block mb-2 uppercase tracking-widest text-[10px]">Agent Profile Analysis</span>
                    {activeCandidate.explanation}
                  </div>

                  {activeEngagement.transcript.map((msg, i) => {
                    const isAgent = msg.speaker.toLowerCase().includes("agent") || msg.speaker.toLowerCase().includes("recruiter");
                    return (
                      <div key={i} className={`flex flex-col mb-4 ${isAgent ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-headline uppercase tracking-widest text-zinc-500 mb-1 px-2">{msg.speaker}</span>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                          isAgent 
                          ? 'bg-gradient-to-r from-[#9c48ea] to-[#cc97ff] text-[#360061] font-medium rounded-br-none' 
                          : 'bg-[#201f1f] text-white border border-white/5 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
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
                      <th className="px-8 py-5">Agent Assessed Interest</th>
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
