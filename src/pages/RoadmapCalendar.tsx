import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Badge } from '../components/ui/badge';
import { 
  Roadmap as RoadmapType, 
  Scholarship, 
  RoadmapStep 
} from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon, 
  Loader2, 
  Sparkles,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { generateRoadmap } from '../services/geminiService';
import { toast } from 'sonner';

declare const google: any;

export default function RoadmapCalendar() {
  const { user, profile, isPremium } = useAuth();
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);

  const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
  const SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' ');

  const getAccessToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!CLIENT_ID) {
          return reject(new Error('VITE_CLIENT_ID belum dikonfigurasi. Silakan hubungi admin.'));
        }
        const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error('Gagal mendapatkan access token: ' + (response.error || 'Unknown error')));
            }
          },
        });
        client.requestAccessToken();
      } catch (error) {
        reject(error);
      }
    });
  };

  const syncToGoogleCalendar = async (roadmap: any) => {
    setSyncingId(roadmap.id);
    try {
      const accessToken = await getAccessToken();
      
      const events = roadmap.steps.map((step: any) => {
        // Basic check if date is ISO format YYYY-MM-DD
        const isISO = /^\d{4}-\d{2}-\d{2}$/.test(step.date);
        const startDate = isISO ? step.date : new Date().toISOString().split('T')[0];
        
        return {
          summary: `[Beasiswa] ${step.title}`,
          description: `${step.description}\n\nBeasiswa: ${roadmap.scholarshipTitle}`,
          start: { date: startDate },
          end: { date: startDate },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 24 * 60 }, // 1 day before
            ],
          },
        };
      });

      // Create events sequentially to avoid rate limits and keep it simple
      for (const event of events) {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Gagal menyimpan event: ${errData.error?.message || response.statusText}`);
        }
      }

      toast.success(`Berhasil menambahkan ${events.length} jadwal ke Google Calendar!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal sinkronisasi dengan Google Calendar');
    } finally {
      setSyncingId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roadmapQ = query(collection(db, 'roadmaps'), where('userId', '==', user?.uid));
        const roadmapSnap = await getDocs(roadmapQ);
        setRoadmaps(roadmapSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Get bookmarks to show relevant scholarships
        const bookmarksQ = query(collection(db, `users/${user?.uid}/bookmarks`));
        const bookmarksSnap = await getDocs(bookmarksQ);
        const bookmarkedIds = bookmarksSnap.docs.map(d => d.id);

        if (bookmarkedIds.length > 0) {
          const schSnap = await getDocs(query(collection(db, 'scholarships')));
          const allSch = schSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Scholarship[];
          setScholarships(allSch.filter(s => bookmarkedIds.includes(s.id!)));
        } else {
          // Fallback to top 3 if no bookmarks
          const schQ = query(collection(db, 'scholarships'), limit(3));
          const schSnap = await getDocs(schQ);
          setScholarships(schSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Scholarship[]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleGenerate = async (scholarshipId: string) => {
    if (!isPremium && roadmaps.length >= 1) {
      toast.error('Limit roadmap gratis tercapai (1 per 3 bulan). Silakan Upgrade!');
      return;
    }

    setGenerating(true);
    try {
      const sch = scholarships.find(s => s.id === scholarshipId);
      if (!sch) throw new Error('Beasiswa tidak ditemukan');
      
      const res = await generateRoadmap(profile, sch);
      const steps = res.steps.map((s: any) => ({ ...s, completed: false }));
      
      await addDoc(collection(db, 'roadmaps'), {
        userId: user!.uid,
        scholarshipId,
        scholarshipTitle: sch.title,
        steps,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Roadmap berhasil dibuat!');
      window.location.reload();
    } catch (error) {
      toast.error('Gagal membuat roadmap AI');
    } finally {
      setGenerating(false);
    }
  };

  const toggleStep = async (roadmapId: string, idx: number) => {
    try {
      const roadmap = roadmaps.find(r => r.id === roadmapId);
      const newSteps = [...roadmap.steps];
      newSteps[idx].completed = !newSteps[idx].completed;
      
      await updateDoc(doc(db, 'roadmaps', roadmapId), {
        steps: newSteps
      });
      
      setRoadmaps(roadmaps.map(r => r.id === roadmapId ? { ...r, steps: newSteps } : r));
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  return (
    <div className="sp-page-container">
      <div className="sp-page-header">
        <h1 className="sp-page-title">Roadmap & Kalender Beasiswa</h1>
        <p className="sp-page-subtitle">Ikuti langkah-langkah strategis untuk melamar beasiswa impian Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Calendar & Shortcuts */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Kalender Planner</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="mx-auto rounded-md border-0"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Buat Roadmap AI
              </CardTitle>
              <CardDescription className="text-slate-400">
                AI akan membantu merancang timeline pendaftaran Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              {generating ? (
                <div className="flex flex-col items-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-400 mb-2" />
                  <p className="text-xs text-slate-300">Merancang roadmap...</p>
                </div>
              ) : (
                <div className="space-y-4">
                   <p className="text-xs text-slate-400 italic">Pilih dari beasiswa yang Anda simpan (Bookmarks) untuk membuat timeline.</p>
                   {scholarships.length > 0 ? scholarships.map(s => (
                     <Button 
                       key={s.id} 
                       variant="outline" 
                       onClick={() => handleGenerate(s.id)}
                       className="w-full justify-between border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                     >
                       <span className="truncate">{s.title}</span>
                       <ChevronRight className="h-4 w-4 shrink-0" />
                     </Button>
                   )) : (
                     <p className="text-xs text-slate-500 text-center py-4 italic">Belum ada beasiswa di bookmarks Anda.</p>
                   )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Active Roadmaps */}
        <div className="space-y-6 lg:col-span-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100">
              <div className="rounded-full bg-slate-50 p-6 mb-4">
                <CalendarIcon className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Belum ada Roadmap Aktif</h3>
              <p className="mt-2 text-slate-500 max-w-sm">Mulailah dengan membuat roadmap dari daftar beasiswa yang tersedia.</p>
            </div>
          ) : (
            roadmaps.map((roadmap) => (
              <Card key={roadmap.id} className="border-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="mb-2 bg-slate-900">Active Roadmap</Badge>
                      <CardTitle className="text-xl">{roadmap.scholarshipTitle}</CardTitle>
                    </div>
                    <div className="text-right">
                       <span className="text-2xl font-bold text-slate-900">
                         {Math.round((roadmap.steps.filter((s:any) => s.completed).length / roadmap.steps.length) * 100)}%
                       </span>
                       <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Progress</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {roadmap.steps.map((step: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-4 p-5 transition-colors cursor-pointer hover:bg-slate-50/50 group ${step.completed ? 'opacity-60' : ''}`}
                        onClick={() => toggleStep(roadmap.id, idx)}
                      >
                        <div className="mt-1">
                          {step.completed ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-bold ${step.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {step.title}
                            </h4>
                            <span className="text-xs font-mono text-slate-500">{step.date}</span>
                          </div>
                          {step.description && (
                            <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/30 p-4 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-500 hover:text-slate-900"
                    onClick={() => syncToGoogleCalendar(roadmap)}
                    disabled={syncingId === roadmap.id}
                  >
                    {syncingId === roadmap.id ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Menghubungkan...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Unduh Jadwal ke Google Calendar <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { addDoc } from 'firebase/firestore';
