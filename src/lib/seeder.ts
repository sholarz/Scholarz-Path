import { collection, getDocs, addDoc, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const MOCK_SCHOLARSHIPS = [
  {
    title: "Beasiswa Indonesia Bangkit (BIB) 2026",
    description: "Program beasiswa penuh kolaborasi Kemenag dan LPDP untuk gelar S1, S2, dan S3.",
    deadline: "2026-06-15",
    eligibility: "WNI, Lulusan MA/SMA/SMK, IPK minimal 3.0",
    country: "Indonesia",
    field: "Semua Bidang",
    link: "https://beasiswa.kemenag.go.id/"
  },
  {
    title: "Beasiswa Unggulan Kemendikbudristek",
    description: "Beasiswa untuk masyarakat berprestasi di tingkat nasional dan internasional.",
    deadline: "2026-08-30",
    eligibility: "Mahasiswa baru atau on-going, IPK 3.25",
    country: "Indonesia",
    field: "Seni, Teknologi, Sains",
    link: "https://beasiswaunggulan.kemdikbud.go.id/"
  },
  {
    title: "Djarum Beasiswa Plus",
    description: "Program beasiswa prestasi yang memberikan tunjangan dana dan soft skills.",
    deadline: "2026-05-20",
    eligibility: "Mahasiswa S1 semester 4, IPK 3.0",
    country: "Indonesia",
    field: "Semua Bidang",
    link: "https://djarumbeasiswaplus.org/"
  },
  {
    title: "Beasiswa Bank Indonesia",
    description: "Beasiswa untuk mahasiswa yang memiliki jiwa sosial dan prestasi akademik.",
    deadline: "2026-04-30",
    eligibility: "Semester 3-6, IPK 3.0, Aktif berorganisasi",
    country: "Indonesia",
    field: "Ekonomi, Hukum, Sosial",
    link: "https://www.bi.go.id/id/institute/beasiswa/"
  }
];

export async function seedMockData() {
  try {
    const q = query(collection(db, 'scholarships'), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      console.log("Seeding mock scholarships...");
      for (const s of MOCK_SCHOLARSHIPS) {
        await addDoc(collection(db, 'scholarships'), s);
      }
    }
  } catch (error) {
    console.debug("Skip seeding: Insufficient permissions or not logged in.");
  }
}
