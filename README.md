# Catalyst AI Scout

An AI-Powered Talent Scouting & Engagement Agent built for the Deccan AI Catalyst Hackathon.

## Overview
Recruiters spend hours sifting through profiles and chasing candidate interest. Catalyst AI Scout autonomously parses a Job Description (JD), discovers matching candidates from a database, and engages them using a simulated AI conversation to gauge their genuine interest. It outputs a composite final ranking based on both the technical fit (Match Score) and the candidate's responsiveness (Interest Score).

## Architecture & Logic
*(For the full architecture, approach, trade-offs, and tool declarations, see the [WRITE_UP.md](./WRITE_UP.md))*

1. **Job Description Parsing & Matching**
   - **Input:** User provides a JD text and their Gemini API key.
   - **Matching Engine:** We use Gemini 2.5 Flash to compare the JD against our internal `candidates.json` mock database. It generates a **Match Score (0-100)** and a technical explanation of *why* the candidate fits the role.

2. **Autonomous Engagement Simulation**
   - **Execution:** When the recruiter decides to engage a candidate, a simulated chat UI opens. The candidate is powered by the Gemini model, heavily prompted with their character profile (including hidden personality traits, salary expectations, and current job satisfaction).
   - **Interest Extraction:** With every candidate reply, the model secretly evaluates and returns an **Interest Score (0-100)** based on how well the opportunity (JD + recruiter pitch) aligns with their hidden preferences.

3. **Global Ranking**
   - **Scoring:** The agent generates a final pipeline combining `(Match Score * 0.6) + (Interest Score * 0.4)` to yield a **Global Score**. The recruiter can immediately make an offer to the highest-scoring candidate.

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- A Gemini API Key from Google AI Studio.

### Steps
1. Clone the repository.
   ```bash
   git clone https://github.com/hackathon-deccan-ai/your-repo-name.git
   cd your-repo-name
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

**Sample Engagement Output:**
> *Recruiter:* Hey Alice, how would you feel about moving to a new AI product role paying $180k?
> *Candidate:* That sounds extremely compelling as I am highly motivated by hard technical problems. I'd love to learn more.
> *(Interest Score updates to 90%)*

## Demo Video
*(Your Demo Video Link Here)*
