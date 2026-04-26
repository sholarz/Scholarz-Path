import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { GraduationCap, BookOpen, Star, Briefcase, Languages, Globe, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    institution: '',
    gpa: '',
    targetDegree: '',
    englishScore: '',
    experience: '',
    achievements: '',
    field: '',
    country: '',
    language: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        institution: profile.institution || '',
        gpa: profile.gpa || '',
        targetDegree: profile.targetDegree || '',
        englishScore: profile.englishScore || '',
        experience: profile.experience || '',
        achievements: profile.achievements || '',
        field: profile.field || '',
        country: profile.country || '',
        language: profile.language || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...formData,
        gpa: formData.gpa ? Number(formData.gpa) : null,
        updatedAt: new Date().toISOString()
      });
      toast.success("Profil berhasil diperbarui!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lengkapi Profil</h1>
          <p className="text-slate-500 font-medium">Berikan detail lengkap agar AI kami bisa memberikan rekomendasi beasiswa yang 100% akurat.</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <GraduationCap size={18} />
              </div>
              <CardTitle className="text-lg">Data Akademik</CardTitle>
            </div>
            <CardDescription>Informasi mengenai latar belakang pendidikan terakhir Anda.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="institution">Institusi Pendidikan</Label>
              <Input 
                id="institution" 
                placeholder="Contoh: Universitas Indonesia"
                value={formData.institution}
                onChange={(e) => setFormData({...formData, institution: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpa">IPK Terakhir</Label>
              <Input 
                id="gpa" 
                type="number" 
                step="0.01" 
                placeholder="Contoh: 3.75"
                value={formData.gpa}
                onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDegree">Target Jenjang</Label>
              <Input 
                id="targetDegree" 
                placeholder="Contoh: Master's Degree (S2)"
                value={formData.targetDegree}
                onChange={(e) => setFormData({...formData, targetDegree: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field">Bidang Studi (Jurusan)</Label>
              <Input 
                id="field" 
                placeholder="Contoh: Computer Science"
                value={formData.field}
                onChange={(e) => setFormData({...formData, field: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <Languages size={18} />
              </div>
              <CardTitle className="text-lg">Kemampuan Bahasa</CardTitle>
            </div>
            <CardDescription>Sertifikasi bahasa inggris atau bahasa asing lainnya.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="englishScore">Skor Bahasa Inggris (IELTS/TOEFL)</Label>
              <Input 
                id="englishScore" 
                placeholder="Contoh: IELTS 7.5 / TOEFL 105"
                value={formData.englishScore}
                onChange={(e) => setFormData({...formData, englishScore: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Bahasa Asing Lainnya</Label>
              <Input 
                id="language" 
                placeholder="Contoh: German B1, Japanese N3"
                value={formData.language}
                onChange={(e) => setFormData({...formData, language: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <Briefcase size={18} />
              </div>
              <CardTitle className="text-lg">Pengalaman & Prestasi</CardTitle>
            </div>
            <CardDescription>Detail pengalaman kerja, organisasi, atau lomba yang pernah diikuti.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="experience">Pengalaman Organisasi / Kerja</Label>
              <Textarea 
                id="experience" 
                placeholder="Sebutkan pengalaman paling relevan..."
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900 min-h-[120px]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="achievements">Prestasi Akademik / Non-Akademik</Label>
              <Textarea 
                id="achievements" 
                placeholder="Sebutkan medali, juara, atau penghargaan..."
                value={formData.achievements}
                onChange={(e) => setFormData({...formData, achievements: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900 min-h-[120px]" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <Globe size={18} />
              </div>
              <CardTitle className="text-lg">Target Negara</CardTitle>
            </div>
            <CardDescription>Negara impian tempat Anda ingin melanjutkan studi.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="country">Negara Tujuan</Label>
              <Input 
                id="country" 
                placeholder="Contoh: United Kingdom, Germany, Singapore"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="rounded-xl border-slate-200 focus:ring-slate-900" 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-12">
          <Button variant="outline" asChild className="rounded-xl px-8 border-slate-200 h-12">
            <Link to="/dashboard">Batal</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="rounded-xl px-8 bg-slate-900 text-white hover:bg-slate-800 h-12 min-w-[200px]">
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save size={18} />
                Simpan Semua Data
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
