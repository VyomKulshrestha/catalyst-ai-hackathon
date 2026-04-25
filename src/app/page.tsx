"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, Search, MessageSquare, Star, Key, Play, 
  Send, User, TrendingUp, ChevronLeft, ArrowRight, CheckCircle 
} from "lucide-react";
import { processJobDescription, chatWithCandidate, MatchResult, ChatMessage } from "./actions";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [jd, setJd] = useState("");
  const [step, setStep] = useState<"API" | "JD" | "LOADING" | "RESULTS" | "CHAT" | "FINAL">("API");
  
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  
  // Track interest scores over time or at end of chat
  const [interestScores, setInterestScores] = useState<Record<string, number>>({});
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  
  const [draftMessage, setDraftMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistories, activeCandidateId]);

  const handleStartSearch = async () => {
    if (!jd.trim()) return;
    setStep("LOADING");
    try {
      const results = await processJobDescription(apiKey, jd);
      setMatchResults(results);
      // Initialize chat histories and default interest scores
      const initialChats: Record<string, ChatMessage[]> = {};
      const initialScores: Record<string, number> = {};
      results.forEach(r => {
        initialChats[r.candidateId] = [];
        initialScores[r.candidateId] = 0; // Not engaged yet
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
  
  // Final composite ranking calculation
  const finalRanking = [...matchResults]
    .map(c => ({
      ...c,
      interestScore: interestScores[c.candidateId] || 0,
      globalScore: (c.matchScore * 0.6) + ((interestScores[c.candidateId] || 0) * 0.4)
    }))
    .sort((a, b) => b.globalScore - a.globalScore);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950 z-0 pointer-events-none" />
      
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12 flex flex-col items-center"
        >
          <div className="bg-indigo-500/10 p-4 rounded-full mb-6 border border-indigo-500/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]">
            <Briefcase className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight">Catalyst AI Scout</h1>
          <p className="mt-4 text-neutral-400 max-w-2xl text-lg">Autonomous Talent Scouting & Engagement Agent</p>
        </motion.div>

        <AnimatePresence mode="wait">
          
          {/* STEP 1: API KEY */}
          {step === "API" && (
            <motion.div 
              key="api"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 block w-full text-center text-center items-center justify-center">
                <Key className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-semibold">Gemini API Key</h2>
              </div>
              <p className="text-sm text-neutral-400 mb-6 text-center">Required to power the AI reasoning and conversational agent.</p>
              
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-neutral-200 placeholder-neutral-600 mb-6"
              />
              
              <button 
                onClick={() => { if (apiKey) { setApiKeySaved(true); setStep("JD"); } }}
                disabled={!apiKey}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 group"
              >
                Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: JOB DESCRIPTION */}
          {step === "JD" && (
            <motion.div 
              key="jd"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl flex flex-col"
            >
              <h2 className="text-2xl font-semibold mb-2">Configure Search Parameters</h2>
              <p className="text-neutral-400 mb-6">Paste the job description. The AI will parse tech stack, seniority, and soft skills.</p>
              
              <textarea 
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="We are looking for a Senior AI Engineer with strong background in Python, PyTorch, and LLMs..."
                className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-neutral-200 placeholder-neutral-700 resize-none mb-6 font-mono text-sm"
              />
              
              <button 
                onClick={handleStartSearch}
                disabled={!jd.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2 group"
              >
                <Search className="w-5 h-5" /> Launch Autonomous Scouting
              </button>
            </motion.div>
          )}

          {/* STEP 3: LOADING */}
          {step === "LOADING" && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
                <div className="absolute w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin direction-reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <Search className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-xl font-medium animate-pulse text-indigo-200">Scanning talent pools & scoring profiles...</p>
            </motion.div>
          )}

          {/* STEP 4: DASHBOARD / RESULTS */}
          {step === "RESULTS" && (
            <motion.div 
              key="results"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-5xl"
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Candidate Pipeline</h2>
                  <p className="text-neutral-400 mt-2">AI found {matchResults.length} matches. Engage them to gauge interest.</p>
                </div>
                <button 
                  onClick={() => setStep("FINAL")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors border border-neutral-700 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" /> Generate Final Shortlist
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchResults.map((candidate, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={candidate.candidateId}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{candidate.name}</h3>
                        <p className="text-sm text-indigo-400">{candidate.role}</p>
                      </div>
                      <div className="bg-neutral-950 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-md text-sm font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-indigo-400" /> {candidate.matchScore}% 
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {candidate.skills.slice(0,4).map(s => (
                        <span key={s} className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded border border-neutral-700">{s}</span>
                      ))}
                      {candidate.skills.length > 4 && <span className="bg-neutral-800 text-neutral-500 text-xs px-2 py-1 rounded">+{candidate.skills.length - 4}</span>}
                    </div>

                    <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center">
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                         <TrendingUp className="w-3 h-3" /> Interest Score: 
                         <span className={interestScores[candidate.candidateId] > 0 ? "text-pink-400 font-bold" : ""}>
                           {interestScores[candidate.candidateId] > 0 ? `${interestScores[candidate.candidateId]}%` : "N/A"}
                         </span>
                      </div>
                      <button 
                        onClick={() => { setActiveCandidateId(candidate.candidateId); setStep("CHAT"); }}
                        className="text-indigo-400 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                      >
                        Engage <Play className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5: CHAT UI */}
          {step === "CHAT" && activeCandidate && (
             <motion.div 
               key="chat"
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[70vh]"
             >
                {/* Chat Header */}
                <div className="bg-neutral-950 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep("RESULTS")} className="text-neutral-500 hover:text-white transition-colors">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                        <User className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{activeCandidate.name}</h3>
                        <p className="text-xs text-neutral-400">{activeCandidate.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                       Match: <span className="text-indigo-400">{activeCandidate.matchScore}%</span>
                    </div>
                    <div className="bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                       Interest: <span className="text-pink-400 transition-all">{interestScores[activeCandidate.candidateId] || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Explainer Node */}
                  <div className="max-w-[80%] mx-auto bg-indigo-900/10 border border-indigo-500/20 text-indigo-200 text-sm p-4 rounded-xl text-center">
                    <Star className="w-4 h-4 inline-block mb-1 mr-1 text-indigo-400" />
                    <span className="font-semibold block mb-1">AI Match Explanation</span>
                    {activeCandidate.explanation}
                  </div>

                  {chatHistories[activeCandidate.candidateId]?.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-800 text-neutral-400 border border-neutral-700 p-4 rounded-2xl rounded-bl-none flex gap-1">
                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="bg-neutral-950 p-4 border-t border-neutral-800 flex gap-3">
                  <input 
                    type="text" 
                    value={draftMessage}
                    onChange={e => setDraftMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Hi there! Saw your background and thought you'd be a great fit for..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-neutral-200"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!draftMessage.trim() || isChatLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
             </motion.div>
          )}

          {/* STEP 6: FINAL SHORTLIST */}
          {step === "FINAL" && (
            <motion.div 
              key="final"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-4xl"
            >
              <div className="flex items-center gap-3 justify-center mb-8">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <h2 className="text-3xl font-bold">Final Ranked Shortlist</h2>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-neutral-950/50 text-neutral-400 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Rank</th>
                      <th className="px-6 py-4 font-medium">Candidate</th>
                      <th className="px-6 py-4 font-medium">Match (%)</th>
                      <th className="px-6 py-4 font-medium">Interest (%)</th>
                      <th className="px-6 py-4 font-medium text-white">Global Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {finalRanking.map((c, idx) => (
                      <tr key={c.candidateId} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-5 text-xl font-bold text-neutral-500">#{idx + 1}</td>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-white">{c.name}</div>
                          <div className="text-xs text-neutral-400">{c.role}</div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="w-full bg-neutral-800 rounded-full h-2 mb-1">
                             <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${c.matchScore}%` }}></div>
                           </div>
                           <span className="text-xs text-indigo-400 font-medium">{c.matchScore}% Match</span>
                        </td>
                        <td className="px-6 py-5">
                           <div className="w-full bg-neutral-800 rounded-full h-2 mb-1">
                             <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${c.interestScore}%` }}></div>
                           </div>
                           <span className="text-xs text-pink-400 font-medium">{c.interestScore === 0 ? "Not Assessed" : `${c.interestScore}% Interest`}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                            {c.globalScore.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 text-center flex justify-center">
                <button 
                  onClick={() => setStep("RESULTS")}
                  className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
