import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

function extractJson(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fencedMatch?.[1] ?? text).trim();
}

type GenerateJsonOptions = {
  signal?: AbortSignal;
  retries?: number;
};

function isAbortError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    ((error as { name?: string }).name === "AbortError" ||
      (error as { code?: string }).code === "ABORT_ERR" ||
      /aborted/i.test((error as { message?: string }).message || ""))
  );
}

function isTransientAiError(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : undefined;
  return status === 429 || status === 500 || status === 503;
}

function isRateLimitError(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : undefined;
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = String((error as { message?: string })?.message || "");

  return status === 429 || code === "rate_limit_exceeded" || /rate limit/i.test(message) || /tokens per day/i.test(message);
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function parseJsonContent<T>(content: string): T {
  const raw = extractJson(content);
  const parsed = JSON.parse(raw) as T;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI response was not a valid JSON object.");
  }
  return parsed;
}

async function generateJsonObject<T>(prompt: string, model = "llama-3.3-70b-versatile", options: GenerateJsonOptions = {}) {
  const { signal, retries = 2 } = options;
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GROQ_API_KEY is missing from the environment.");
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    try {
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
      } as any);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Groq returned an empty response.");
      }

      return parseJsonContent<T>(content);
    } catch (error) {
      lastError = error;

      if (isAbortError(error)) {
        throw error;
      }

      if (isRateLimitError(error)) {
        throw new Error("Kuota AI Groq sedang habis. Coba lagi nanti atau gunakan model lain.");
      }

      const shouldRetry = attempt < retries && (isTransientAiError(error) || error instanceof SyntaxError || /JSON/i.test(String((error as { message?: string })?.message || "")));
      if (!shouldRetry) {
        break;
      }

      await delay(250 * (attempt + 1), signal);
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Gagal memproses respons AI: ${lastError.message}`);
  }

  throw new Error("Gagal memproses respons AI.");
}

function normalizeMatchScore(value: unknown) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function normalizeMatchItems(items: Array<{ scholarshipId: string; score: unknown; reason: string }>) {
  return items
    .filter((item) => typeof item?.scholarshipId === "string" && item.scholarshipId.length > 0)
    .map((item) => ({
      scholarshipId: item.scholarshipId,
      score: normalizeMatchScore(item.score),
      reason: item.reason,
    }))
    .sort((left, right) => right.score - left.score);
}

export async function matchScholarships(userProfile: any, scholarships: any[], options: GenerateJsonOptions = {}) {
  if (!userProfile) {
    throw new Error("User profile tidak tersedia untuk matching.");
  }

  if (!Array.isArray(scholarships) || scholarships.length === 0) {
    throw new Error("Daftar beasiswa kosong. Tidak ada yang bisa dicocokkan.");
  }

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

  const parsed = await generateJsonObject<{ items: Array<{ scholarshipId: string; score: number; reason: string }> }>(prompt, "llama-3.3-70b-versatile", options);
  return normalizeMatchItems(Array.isArray(parsed.items) ? parsed.items : []);
}

export async function generateRoadmap(userProfile: any, scholarship: any, isOverdue: boolean = false) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  const todayString = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const overdueContext = isOverdue 
    ? `PENTING: Beasiswa ini sudah melewati deadline tahun ini (${currentYear}). 
    Namun, roadmap ini MULAI DARI HARI INI (${todayString}) untuk persiapan pendaftaran tahun depan (${nextYear}).
    User ingin mulai persiapan sekarang, jadi timeline harus realistis dari hari ini sampai mendekati deadline tahun depan.
    Jangan bikin tanggal yang sudah lewat - semua harus ${currentYear} atau ${nextYear} tapi logical dari sekarang.`
    : `PENTING: User membuat roadmap hari ini (${todayString}). 
    Timeline roadmap harus mulai dari tanggal hari ini atau beberapa hari ke depan (tahun ${currentYear}), 
    dan berlanjut sampai sebelum deadline beasiswa.
    Semua dates HARUS realistis - tidak boleh tanggal yang sudah lewat dari hari ini.`;

  // Get scholarship deadline untuk konteks
  let deadlineInfo = "";
  if (scholarship.deadline) {
    deadlineInfo = `\nDeadline beasiswa: ${scholarship.deadline}`;
  }
  
  const prompt = `Buat roadmap aplikasi beasiswa yang KOMPREHENSIF, ACTIONABLE, dan DISESUAIKAN DENGAN SPESIFIK REQUIREMENTS beasiswa.

PROFIL USER:
${JSON.stringify(userProfile, null, 2)}

DETAIL BEASISWA & REQUIREMENTS:
${JSON.stringify(scholarship, null, 2)}${deadlineInfo}

HARI INI (saat user membuat roadmap): ${todayString}

${overdueContext}

ANALISIS REQUIREMENTS:
1. EXTRACT dari beasiswa:
   - Test scores yang diperlukan (IELTS, TOEFL, GRE, GMAT, dll) beserta target score
   - GPA minimum dan area study/major focus
   - Jumlah recommendation letters dan dari siapa (academic/professional)
   - Essay/SOP requirements - jumlah, tema, panjang
   - Documents yang wajib (transcript, passport, CV, portfolio)
   - Language proficiency requirements
   - Work experience requirements (jika ada)
   - Specific application platform atau portal

2. MATCH dengan user profile:
   - Identifikasi gap antara user current state dan beasiswa requirements
   - Prioritas: gap terbesar harus dikerjakan dulu
   - Kalau user sudah punya test score, focus pada improvement atau next steps

PANDUAN MEMBUAT ROADMAP YANG CUSTOMIZED:
1. STRUKTUR: 10-15 langkah konkret, disesuaikan dengan beasiswa requirements
2. LANGKAH HARUS SPECIFIC:
   - Instead of "Prepare test" → "Take IELTS practice test, target score 6.5 (dari requirement beasiswa)"
   - Instead of "Get recommendation letters" → "Contact 2 academic advisors + 1 work supervisor untuk recommendation letters 300-400 kata"
   - Instead of "Write essay" → "Draft main essay: 'Why you deserve this scholarship' (1000 kata, explain motivation & fit dengan beasiswa)"

3. REQUIREMENT-DRIVEN TIMELINE:
   - Group related tasks (e.g., all test prep before test date)
   - For each beasiswa requirement, ada dedicated step atau sequence of steps
   - Buffer antara preparation dan submission (e.g., test 1 bulan sebelum deadline kalau score perlu time untuk process)

4. PRIORITY ORDER:
   - Long-lead items first (test prep, work experience, GPA boost)
   - Medium-term (document gathering, recommendation letters)
   - Short-term (essays, application filling, final review)

5. REALISM & EFFORT ESTIMATION:
   - Setiap step mention estimated effort (e.g., "5-10 jam minggu untuk IELTS prep")
   - Space out tasks so tidak overwhelming
   - Consider user background dari profile

6. MOTIVASI & TIPS:
   - Dalam description, kasih concrete tips atau motivational notes
   - Example: "Hubungi dosen favoritmu yang kenal performance akademikmu - dia paling reliable untuk surat rekomendasi berkualitas tinggi!"

RESPONSE FORMAT (STRICTLY JSON):
{
  "steps": [
    {
      "title": "string (SPECIFIC ke beasiswa requirement, bukan generic)",
      "date": "YYYY-MM-DD (deadline step ini)",
      "description": "string (2-4 kalimat, konkriet + tips + motivasi, Bahasa Indonesia)"
    }
  ]
}

PENTING:
- SETIAP STEP harus linked ke beasiswa requirement atau gap yang ada
- SPESIFIK: mention nama test, score target, jumlah recommendation letters, essay theme, dll
- Tidak boleh generic - customize sepenuhnya ke beasiswa ini
- Urutan chronological dan REALISTIK dimulai dari HARI INI (${todayString})
- 10-15 steps total (lebih detail dari sebelumnya karena requirement-driven)
- SEMUA DATES HARUS REALISTIK DAN TIDAK BOLEH LEBIH AWAL DARI HARI INI (${todayString})
- Mulai dari ${todayString} atau beberapa hari ke depan
- Gunakan HANYA Bahasa Indonesia`;

  return generateJsonObject<{ steps: Array<{ title: string; date: string; description: string }> }>(prompt);
}

export async function rerouteRoadmap(roadmapState: any, changedTask: { id: string; newDate: string }) {
  const prompt = `Anda adalah asisten penjadwalan yang bertugas mengoptimalisasi timeline pendaftaran beasiswa.
  Diberikan state roadmap saat ini (array tasks dengan fields: id, title, date, description, completed) dan sebuah perubahan tanggal pada satu tugas, hitung dampak perubahan ini terhadap deadline akhir pendaftaran. Jika perubahan menyebabkan bottleneck atau tugas saling bertabrakan, usulkan jadwal ulang yang terdistribusi ulang untuk sisa tugas sehingga target akhir masih realistis.

  Masukan:
  - roadmapState: ${JSON.stringify(roadmapState)}
  - changedTask: ${JSON.stringify(changedTask)}

  Keluaran yang diharapkan (valid JSON):
  {
    "steps": [
      { "id": "string", "title": "string", "date": "YYYY-MM-DD", "description": "string (optional)" }
    ],
    "note": "string (penjelasan singkat, Bahasa Indonesia)"
  }

  Berikan hanya JSON yang valid tanpa markdown. Semua narasi harus berbahasa Indonesia.`;

  return generateJsonObject<{ steps: Array<{ id: string; title: string; date: string; description?: string }>; note?: string }>(prompt, "llama-3.3-70b-versatile");
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
