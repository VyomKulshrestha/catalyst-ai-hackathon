"use server";

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

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
 * @param apiKey - User's API Key
 * @param jd - Raw Job Description text
 * @param candidatesList - Dynamic array of candidates to process
 * @param provider - Model provider (gemini, openai, anthropic)
 * @returns Array of Candidates with initial Match Scores, sorted descending.
 */
export async function processJobDescription(apiKey: string | undefined, jd: string, candidatesList: any[], provider: string = "gemini"): Promise<MatchResult[]> {
  const keyToUse = apiKey || process.env.MODEL_API_KEY || process.env.GEMINI_API_KEY;
  if (!keyToUse) throw new Error("API Key is required or must be set in Vercel environment variables.");
  
  const results: MatchResult[] = [];

  for (const candidate of candidatesList) {
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
      let text = "{}";
      
      if (provider === "openai") {
        const openai = new OpenAI({ apiKey: keyToUse });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        });
        text = response.choices[0].message.content || "{}";
      } 
      else if (provider === "anthropic") {
        const anthropic = new Anthropic({ apiKey: keyToUse });
        const response = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt + "\n\nCRITICAL: OUTPUT ONLY RAW JSON WITH NO MARKDOWN BLOCK OR OTHER TEXT." }]
        });
        text = response.content[0].type === 'text' ? response.content[0].text : "{}";
      }
      else {
        // default to gemini
        const ai = new GoogleGenAI({ apiKey: keyToUse });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        text = response.text || "{}";
      }
      
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
 * @param apiKey - User's API Key
 * @param candidate - The candidate object being engaged
 * @param jd - The original job description for context
 * @param provider - Model provider
 */
export async function autonomousEngageCandidate(apiKey: string | undefined, candidate: any, jd: string, provider: string = "gemini"): Promise<AutonomousEngagementResult> {
  const keyToUse = apiKey || process.env.MODEL_API_KEY || process.env.GEMINI_API_KEY;
  if (!keyToUse) throw new Error("API Key is required or must be set in Vercel environment variables.");
  
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
    let text = "{}";
    
    if (provider === "openai") {
      const openai = new OpenAI({ apiKey: keyToUse });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      });
      text = response.choices[0].message.content || "{}";
    } 
    else if (provider === "anthropic") {
      const anthropic = new Anthropic({ apiKey: keyToUse });
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt + "\n\nCRITICAL: OUTPUT ONLY RAW JSON WITH NO MARKDOWN BLOCK OR OTHER TEXT." }]
      });
      text = response.content[0].type === 'text' ? response.content[0].text : "{}";
    }
    else {
      // default to gemini
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      text = response.text || "{}";
    }

    // Attempt to extract raw json if anthropic/openai leaked markdown
    if (text.startsWith('```json')) {
       text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(text);
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
