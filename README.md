# Luminal Scout | Autonomous AI Talent Agent

**Live Deployment:** [https://catalyst-ai-hackathon.vercel.app/](https://catalyst-ai-hackathon.vercel.app/)

An AI-Powered Talent Scouting & Engagement Agent built for the Deccan AI Catalyst Hackathon.

## Overview
Recruiters spend hours sifting through profiles and chasing candidate interest. Luminal Scout autonomously parses a Job Description (JD), discovers matching candidates from a database, and *autonomously* engages them in the background using a simulated AI-to-AI conversation to gauge their genuine interest. It outputs a composite final ranking based on both the technical fit (Match Score) and the candidate's responsiveness (Interest Score).

## Architecture & Logic
*(For the full architecture, approach, trade-offs, and tool declarations, see the [WRITE_UP.md](./WRITE_UP.md))*

1. **Job Description Parsing & Matching**
   - **Input:** User provides a JD text and their Gemini API key.
   - **Matching Engine:** We use Gemini 2.5 Flash to compare the JD against our internal `candidates.json` mock database. It generates a **Match Score (0-100)** and a technical explanation of *why* the candidate fits the role.

2. **Autonomous Engagement Simulation**
   - **Execution:** Instead of a simple chatbot interface, the user clicks "Delegate Agent Outreach". The Agent takes over and spins up an autonomous simulation where the AI Recruiter pitches the role to the Candidate persona (who evaluates the pitch based on their hidden salary expectations and current job satisfaction).
   - **Interest Extraction:** The Agent handles the entire 3-4 turn negotiation autonomously, extracts the final **Interest Score (0-100)**, and generates an Agent Interaction Log (Transcript) for the user to read.

3. **Global Ranking**
   - **Scoring:** The agent generates a final pipeline combining `(Match Score * 0.6) + (Interest Score * 0.4)` to yield a **Global Score**. The recruiter can immediately make an offer to the highest-scoring candidate.

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- A Gemini API Key from Google AI Studio.

### Steps
1. Clone the repository.
   ```bash
   git clone https://github.com/VyomKulshrestha/catalyst-ai-hackathon.git
   cd catalyst-ai-hackathon
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser.
5. Provide your Gemini API key in the UI and test the scout!

## Sample Inputs and Outputs
**Sample JD Input:**
> "We are looking for a Senior AI Engineer deeply experienced with Python, PyTorch, and deploying LLMs. Must have 5+ years of experience. We offer competitive salary up to $180k."

**Sample Match Output:**
> Alice Chen (Senior AI Engineer) - Match 95%. "Alice aligns perfectly with the required 5+ years of experience and core skills in Python, PyTorch, and LLMs. Her current role heavily prepares her for this position."

**Sample Engagement Output (Agent Log):**
> *AI Recruiter:* We are looking for a Senior AI Engineer deeply experienced with Python and LLMs. The salary goes up to $180k. Would you be interested?
> *Candidate:* That sounds extremely compelling. I am currently making $150k but I am looking to step into a Senior role with a pay bump.
> *AI Recruiter:* Perfect, you exceed the 5+ years of experience required. Let's get you on a call with the hiring manager.
> *Candidate:* I would love to. Please send me the details.
> *(Final Interest Score: 90%)*

## Demo Video
*(Your Demo Video Link Here)*
