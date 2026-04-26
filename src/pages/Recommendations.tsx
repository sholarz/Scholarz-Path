import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, limit, doc, getDoc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Sparkles, 
  Loader2, 
  Lock, 
  CheckCircle2, 
  Calendar, 
  User as UserIcon,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { matchScholarships } from '../services/geminiService';
import { Scholarship, UserProfile } from '../types';
import { toast } from 'sonner';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

export default function Recommendations() {
  const { user, profile, isPremium } = useAuth();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [matching, setMatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'scholarships'), limit(50));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Scholarship[];
        setScholarships(data);
      } catch (error) {
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRunMatching = async () => {
    if (!profile) return;
    if (!isPremium && profile.matchCount >= 3) {
      toast.error('Batas limit matching tercapai untuk akun gratis. Silakan Upgrade!');
      return;
    }

    setMatching(true);
    try {
      const results = await matchScholarships(profile, scholarships);
      setMatches(results);
      
      const userRef = doc(db, 'users', user!.uid);
      await updateDoc(userRef, {
        matchCount: (profile.matchCount || 0) + 1
      });

      // Create notification for matching
      await addDoc(collection(db, 'notifications'), {
        userId: user!.uid,
        title: 'Hasil AI Matching Tersedia! 🚀',
        message: `Hore! Kami menemukan ${results.filter((r:any) => r.score > 70).length} beasiswa yang sangat cocok untuk Anda.`,
        type: 'match',
        read: false,
        createdAt: serverTimestamp()
      });
      
      toast.success('Matching selesai!');
    } catch (error) {
      toast.error('Gagal melakukan matching AI');
    } finally {
      setMatching(false);
    }
  };

  if (!profile?.gpa || !profile?.field) {
    return (
      <div className="max-w-md mx-auto py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-6">
          <UserIcon className="h-10 w-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 italic">Lengkapi Profil</h2>
        <p className="mt-4 text-slate-500 text-sm leading-relaxed">
          Kami membutuhkan data IPK dan bidang studi Anda untuk memberikan rekomendasi AI yang akurat.
        </p>
        <Button asChild className="mt-8 bg-indigo-600 rounded-xl px-10 font-bold shadow-lg shadow-indigo-100">
          <Link to="/dashboard">Buka Fokus Profil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic uppercase">Smart Matching</h1>
          <p className="mt-2 text-slate-500">Rekomendasi berbasis Gemini Flash 1.5 khusus untuk profil akademik Anda.</p>
        </div>
        
        <Button 
          onClick={handleRunMatching} 
          disabled={matching}
          size="lg"
          className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-xl px-8 font-bold"
        >
          {matching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Luncurkan AI Matching
        </Button>
      </div>

      {!isPremium && profile.matchCount >= 3 && matches.length === 0 && (
        <div className="mb-12 bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={80} />
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg">
            <Lock className="h-8 w-8" />
          </div>
          <div className="flex-grow text-center md:text-left text-white">
            <h3 className="text-xl font-bold">Limit Pencarian Tercapai</h3>
            <p className="text-slate-400 text-sm mt-1">Buka akses tak terbatas dengan upgrade ke Premium sekarang.</p>
          </div>
          <Button className="shrink-0 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold transition-transform hover:scale-105 px-8">
            <Zap className="mr-2 h-4 w-4 fill-indigo-600 text-indigo-600" /> Tingkatkan Paket
          </Button>
        </div>
      )}

      {matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((m, idx) => {
            const scholarship = scholarships.find(s => s.id === m.scholarshipId);
            if (!scholarship) return null;
            
            return (
              <Card key={idx} className="group flex flex-col border-slate-200 bg-white rounded-2xl transition-all hover:border-indigo-200 hover:shadow-xl overflow-hidden relative">
                <div className="p-1.5 absolute top-0 right-0 z-10">
                   <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                    {m.score}% Cocok
                   </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="mb-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {scholarship.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pt-2">
                   <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4">
                     <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">"{m.reason}"</p>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                     <Calendar className="h-3 w-3" />
                     <span>Batas: {scholarship.deadline}</span>
                   </div>
                </CardContent>
                <CardFooter className="pt-0 border-t border-slate-50 p-4">
                  <Dialog>
                    <DialogTrigger render={
                      <Button variant="ghost" className="w-full text-indigo-600 font-bold hover:bg-indigo-50 group-hover:bg-indigo-50/50 flex items-center justify-center gap-2">
                        Lihat Analisis Detail <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    } />
                    <DialogContent className="sm:max-w-md rounded-3xl">
                      <DialogHeader>
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                          <Sparkles size={24} />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight">Kenapa Anda Cocok?</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-2">
                          Analisis AI ScholarsPath untuk beasiswa <strong>{scholarship.title}</strong>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-6 space-y-6">
                        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                          <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Skor Kesesuaian: {m.score}%
                          </h4>
                          <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                            {m.reason}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                           <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Parameter Match</h4>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <p className="text-[10px] text-slate-400 font-bold uppercase">Akademik</p>
                               <p className="text-xs font-bold text-slate-700 mt-1">{scholarship.field || 'General'}</p>
                             </div>
                             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <p className="text-[10px] text-slate-400 font-bold uppercase">Lokasi</p>
                               <p className="text-xs font-bold text-slate-700 mt-1">{scholarship.country || 'Indonesia'}</p>
                             </div>
                           </div>
                        </div>
                      </div>
                      <div className="mt-8">
                        <Button asChild className="w-full h-12 bg-slate-900 rounded-2xl font-bold">
                          <a href={scholarship.link} target="_blank" rel="noopener noreferrer">
                            Daftar Sekarang <ExternalLink size={16} className="ml-2" />
                          </a>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
          <div className="rounded-full bg-slate-50 p-8 shadow-inner mb-6">
            <Sparkles className="h-12 w-12 text-indigo-200" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 italic tracking-tight">Siap Untuk Sukses?</h3>
          <p className="mt-4 text-slate-500 max-w-sm text-sm font-medium leading-relaxed">
            Klik tombol di atas untuk menjalankan analisis AI pada data akademik Anda dan temukan beasiswa impian.
          </p>
        </div>
      )}
    </div>
  );
}
