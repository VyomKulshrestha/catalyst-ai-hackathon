"use server"

import { GoogleGenAI } from "@google/genai";
import candidates from "@/data/candidates.json";

export interface MatchResult {
  candidateId: string;
  name: string;
  role: string;
  skills: string[];
  matchScore: number;
  explanation: string;
}

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
  "matchScore": <number between 0 and 100 depending on how well they match the JD. Focus heavily on tech stack and years of experience.>,
  "explanation": "<2-3 sentences explaining exactly why this score was given, highlighting strengths and missing requirements>"
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

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatResponse {
  response: string;
  interestScore: number;
}

export async function chatWithCandidate(apiKey: string, candidateId: string, history: ChatMessage[], jd: string): Promise<ChatResponse> {
  if (!apiKey) throw new Error("API Key is required");
  const ai = new GoogleGenAI({ apiKey });
  
  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) throw new Error("Candidate not found");

  const systemPrompt = `You are playing the role of a candidate named ${candidate.name}.
Your background:
- Role: ${candidate.role}
- Experience: ${candidate.experience_years} years
- Current Company: ${candidate.current_company}
- Salary Expectation: ${candidate.salary_expectation}
- Personality/Context: ${candidate.personality_context}

A recruiter is chatting with you about the following job description:
${jd}

Respond to the recruiter naturally in character. Limit responses to 1-3 short sentences. 
You can be convinced if the recruiter mentions things that align with your personality / salary expectations.
Maintain an internal "Interest Score" from 0 to 100 representing how interested you are in this opportunity so far.

Output your response strictly as JSON:
{
  "response": "<your conversational reply>",
  "interestScore": <number between 0 and 100>
}
`;

  // construct Gemini conversation
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: '{"response": "Got it. I will respond in character.", "interestScore": 50}' }] },
  ];

  for (const msg of history) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      response: parsed.response || "I have nothing to say.",
      interestScore: parsed.interestScore || 50
    };
  } catch (error) {
    console.error(error);
    return {
      response: "I'm having trouble connecting right now.",
      interestScore: 0
    };
  }
}
