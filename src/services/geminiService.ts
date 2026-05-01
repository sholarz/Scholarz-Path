import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function extractJson(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fencedMatch?.[1] ?? text).trim();
}

async function generateJsonObject<T>(prompt: string, model = "llama-3.3-70b-versatile") {
  const response = await groq.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a precise scholarship assistant. Return valid JSON only. Do not include markdown or extra commentary. All narrative output values must be in Bahasa Indonesia unless explicitly requested otherwise.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned empty response.");
  }

  return JSON.parse(extractJson(content)) as T;
}

function normalizeMatchScore(value: unknown) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function normalizeMatchItems(items: Array<{ scholarshipId: string; score: unknown; reason: string }>) {
  return items
    .map((item) => ({
      scholarshipId: item.scholarshipId,
      score: normalizeMatchScore(item.score),
      reason: item.reason,
    }))
    .sort((left, right) => right.score - left.score);
}

export async function matchScholarships(userProfile: any, scholarships: any[]) {
  const prompt = `Evaluate how well each scholarship matches the user profile.

Use this scoring rubric strictly:
- 90-100: excellent match, user clearly satisfies most requirements
- 75-89: strong match, only minor gaps or flexible requirements
- 60-74: moderate match, relevant and plausible but with notable gaps
- 40-59: weak match, partially relevant but several requirements are missing
- 0-39: poor match, user is unlikely to qualify or it is not relevant

Important scoring rules:
- Do not be overly conservative. If the scholarship is broadly compatible, the score should usually be at least 60.
- Consider all available profile signals: GPA, field, country, language, institution, target degree, experience, achievements, and English score.
- Consider scholarship signals: eligibility, field, country, deadline, and general program fit.
- Give higher scores when the user clearly fits the eligibility and study direction.
- Return all scores as integers from 0 to 100.
- Write the reason in Bahasa Indonesia and keep it specific to the profile and scholarship.

Return valid JSON with this exact shape:
{
  "items": [
    { "scholarshipId": "string", "score": 0, "reason": "string" }
  ]
}

User Profile: ${JSON.stringify(userProfile)}
Scholarships: ${JSON.stringify(scholarships)}`;

  const parsed = await generateJsonObject<{ items: Array<{ scholarshipId: string; score: number; reason: string }> }>(prompt);
  return normalizeMatchItems(parsed.items ?? []);
}

export async function generateRoadmap(userProfile: any, scholarship: any) {
  const prompt = `Generate a personalized application roadmap for this scholarship.
  User: ${JSON.stringify(userProfile)}
  Scholarship: ${JSON.stringify(scholarship)}
  Include milestones like IELTS preparation, essay writing, and document submission tailored to the deadline.
  Important: The 'date' field MUST be in YYYY-MM-DD format based on the current year and scholarship deadline.
  Return JSON object with format:
  {
    "steps": [
      { "title": "string", "date": "YYYY-MM-DD", "description": "string" }
    ]
  }`;

  return generateJsonObject<{ steps: Array<{ title: string; date: string; description: string }> }>(prompt);
}

export async function extractScholarshipFromText(text: string) {
  const prompt = `Extract scholarship details from the provided text with extreme precision and professional Markdown formatting.
  
  Important Instructions:
  - If the scholarship has multiple tracks (e.g., Track A: Academic, Track B: Non-Academic, Track C: Influencer), DO NOT skip any.
  - For 'eligibility', combine all requirements. Use clear Markdown headers (e.g., ### Jalur Prestasi) to separate tracks.
  - Use bullet points (- ) and numbered lists (1. ) extensively in 'eligibility', 'benefits', and 'selectionProcess'.
  - Ensure every requirement, benefit, and selection step mentioned in the text is captured.
  - Summarize the main purpose in 'description' in a professional paragraph.
  - Extract 'deadline' (if multiple, use the main one or a range).
  - Identify 'field' (e.g., "Semua Bidang", "IT", "Ekonomi").
  - Identify 'country' (default to 'Indonesia').
  - Ensure the output is valid JSON.
  
  Return JSON object with format:
  {
    "title": "string",
    "description": "string",
    "deadline": "string",
    "eligibility": "string",
    "benefits": "string",
    "selectionProcess": "string",
    "country": "string",
    "field": "string",
    "link": "string"
  }
  
  Text: ${text}`;

  return generateJsonObject<{
    title: string;
    description: string;
    deadline: string;
    eligibility: string;
    benefits?: string;
    selectionProcess?: string;
    country?: string;
    field?: string;
    link?: string;
  }>(prompt);
}

export async function searchScholarshipOnWeb(query: string) {
  const prompt = `Cari informasi beasiswa terbaru berdasarkan kueri: "${query}". 
  Berikan daftar beasiswa yang relevan dengan detail ringkas.
  Return JSON object with format:
  {
    "items": [
      { "title": "string", "snippet": "string", "sourceUrl": "string", "deadline": "string" }
    ]
  }`;

  const parsed = await generateJsonObject<{ items: Array<{ title: string; snippet?: string; sourceUrl: string; deadline?: string }> }>(prompt);
  return parsed.items ?? [];
}

export async function extractFromUrl(url: string) {
  const prompt = `Ekstrak detail beasiswa dari URL berikut secara mendalam. 
  Pastikan semua kriteria, manfaat, dan proses seleksi tertangkap dengan format Markdown yang rapi.
  Return JSON object with format:
  {
    "title": "string",
    "description": "string",
    "deadline": "string",
    "eligibility": "string",
    "benefits": "string",
    "selectionProcess": "string",
    "country": "string",
    "field": "string",
    "link": "string"
  }
  URL: ${url}`;

  return generateJsonObject<{
    title: string;
    description: string;
    deadline: string;
    eligibility: string;
    benefits?: string;
    selectionProcess?: string;
    country?: string;
    field?: string;
    link?: string;
  }>(prompt);
}

export async function reviewEssay(essay: string) {
  const prompt = `Review this scholarship essay and provide constructive feedback. 
  Focus on:
  1. Structure and Flow
  2. Clarity of goals and motivation
  3. Strength of arguments
  4. Areas for improvement
  
  Provide findings in a clear, formatted structure in Indonesian.
  Provide an overall score from 0 to 100.
  
  Return JSON object with format:
  {
    "overallScore": number,
    "feedback": "string",
    "strengths": ["string"],
    "weaknesses": ["string"],
    "suggestions": ["string"]
  }
  Essay Content: ${essay}`;

  try {
    const parsed = await generateJsonObject<{
      overallScore: number;
      feedback: string;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    }>(prompt);

    // Basic validation / normalization to avoid rendering crashes downstream
    const safe = {
      overallScore: Number(parsed?.overallScore ?? 0),
      feedback: parsed?.feedback ?? "",
      strengths: Array.isArray(parsed?.strengths) ? parsed!.strengths : [],
      weaknesses: Array.isArray(parsed?.weaknesses) ? parsed!.weaknesses : [],
      suggestions: Array.isArray(parsed?.suggestions) ? parsed!.suggestions : [],
    };

    return safe;
  } catch (err) {
    console.error("reviewEssay error:", err);
    // Re-throw so callers can handle and show a friendly fallback UI
    throw err;
  }
}
