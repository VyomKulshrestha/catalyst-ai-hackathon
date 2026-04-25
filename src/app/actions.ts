"use server";

import { GoogleGenAI } from "@google/genai";
import candidates from "@/data/candidates.json";

/**
 * Represents the structured Output of the Job Description Matching Engine.
 */
export interface MatchResult {
  candidateId: string;
  name: string;
  role: string;
  skills: string[];
  matchScore: number;
  explanation: string;
}

/**
 * Processes the Job Description against the candidate database.
 * 
 * Approach:
 * We iterate our local database of candidates. For each candidate, we pass their
 * profile and the JD to Gemini. Gemini acts as an expert recruiter and evaluates
 * the compatibility, outputting a precise score and an actionable explanation.
 * 
 * @param apiKey - User's Gemini API Key
 * @param jd - Raw Job Description text
 * @returns Array of Candidates with initial Match Scores, sorted descending.
 */
export async function processJobDescription(apiKey: string, jd: string): Promise<MatchResult[]> {
  if (!apiKey) throw new Error("API Key is required");
  const ai = new GoogleGenAI({ apiKey });
  const results: MatchResult[] = [];

  for (const candidate of candidates) {
    const prompt = `You are an expert technical recruiter analyzing a candidate's fit for a job description.
Job Description:
${jd}

Candidate Profile:
Name: ${candidate.name}
Role: ${candidate.role}
Skills: ${candidate.skills.join(", ")}
Experience: ${candidate.experience_years} years

Evaluate the candidate's match for this job description.
Provide your response strictly in the following JSON format:
{
  "matchScore": <number between 0 and 100 depending on how well they match the JD. Focus heavily on tech stack and years of experience. Be realistic, not overly generous.>,
  "explanation": "<2-3 concise sentences explaining exactly why this score was given, highlighting strengths and missing requirements>"
}
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      
      results.push({
        candidateId: candidate.id,
        name: candidate.name,
        role: candidate.role,
        skills: candidate.skills,
        matchScore: parsed.matchScore || 0,
        explanation: parsed.explanation || "No explanation provided."
      });
    } catch (error) {
      console.error(error);
      results.push({
        candidateId: candidate.id,
        name: candidate.name,
        role: candidate.role,
        skills: candidate.skills,
        matchScore: 0,
        explanation: "Error processing candidate."
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

export interface AutonomousEngagementResult {
  transcript: { speaker: string; text: string }[];
  interestScore: number;
}

/**
 * Autonomously engages a candidate by simulating a conversation between an AI Recruiter Agent 
 * and the Candidate based on their hidden persona constraints.
 * 
 * Approach:
 * To fulfill the "Agentic AI" requirement, the user does not manually chat. The AI agent 
 * handles the outreach, pitches the JD, handles objections based on the candidate's salary 
 * and personality expectations, and outputs a transcript and a final Interest Score.
 */
export async function autonomousEngageCandidate(apiKey: string, candidateId: string, jd: string): Promise<AutonomousEngagementResult> {
  if (!apiKey) throw new Error("API Key is required");
  const ai = new GoogleGenAI({ apiKey });
  
  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) throw new Error("Candidate not found");

  const prompt = `You are the core intelligence of "LUMINAL SCOUT", an autonomous AI recruiting agent.
Your task is to simulate a short 3-4 turn outreach conversation between yourself (AI Recruiter) and a Candidate.

Job Description being pitched:
${jd}

Candidate Hidden Profile (Do not reveal these raw constraints to the recruiter persona, let the candidate persona act on them):
- Name: ${candidate.name}
- Role: ${candidate.role}
- Experience: ${candidate.experience_years} years
- Salary Expectation: ${candidate.salary_expectation}
- Personality/Context: ${candidate.personality_context}

Write a realistic, professional transcript. The AI Recruiter pitches the role. The Candidate responds based heavily on their Salary Expectation and Personality Context. The AI Recruiter tries to address concerns. The Candidate gives a final verdict.
Based on the transcript, assign a final "interestScore" (0-100) indicating how likely the candidate is to accept an interview.

Output your response strictly as JSON:
{
  "transcript": [
    { "speaker": "AI Recruiter", "text": "..." },
    { "speaker": "Candidate", "text": "..." }
  ],
  "interestScore": <number between 0 and 100>
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      transcript: parsed.transcript || [],
      interestScore: parsed.interestScore || 0
    };
  } catch (error) {
    console.error("Agent simulation error:", error);
    return {
      transcript: [{ speaker: "System", text: "Failed to establish neural link with candidate." }],
      interestScore: 0
    };
  }
}
