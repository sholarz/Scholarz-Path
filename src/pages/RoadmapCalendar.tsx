import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { getActiveUpcomingDeadlines } from "../lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Roadmap as RoadmapType, Scholarship, RoadmapStep } from "../types";
import {
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Loader2,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { generateRoadmap } from "../services/geminiService";
import { rerouteRoadmap } from "../services/geminiService";
import { toast } from "sonner";

declare const google: any;

export default function RoadmapCalendar() {
  const { user, profile, isPremium } = useAuth();
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [loading, setLoading] = useState(true);
  const [eventsMap, setEventsMap] = useState<Record<string, Array<any>>>({});
  const [generating, setGenerating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>("");
  const [expandedRoadmapIds, setExpandedRoadmapIds] = useState<Set<string>>(new Set());

  const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
  const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" ");

  const formatLocalDate = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const getAccessToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!CLIENT_ID) {
          return reject(
            new Error(
              "VITE_CLIENT_ID belum dikonfigurasi. Silakan hubungi admin.",
            ),
          );
        }
        const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(
                new Error(
                  "Gagal mendapatkan access token: " +
                    (response.error || "Unknown error"),
                ),
              );
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
        const startDate = isISO
          ? step.date
          : new Date().toISOString().split("T")[0];

        return {
          summary: `[Beasiswa] ${step.title}`,
          description: `${step.description}\n\nBeasiswa: ${roadmap.scholarshipTitle}`,
          start: { date: startDate },
          end: { date: startDate },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 24 * 60 }, // 1 day before
            ],
          },
        };
      });

      // Create events sequentially to avoid rate limits and keep it simple
      for (const event of events) {
        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          },
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(
            `Gagal menyimpan event: ${errData.error?.message || response.statusText}`,
          );
        }
      }

      toast.success(
        `Berhasil menambahkan ${events.length} jadwal ke Google Calendar!`,
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal sinkronisasi dengan Google Calendar");
    } finally {
      setSyncingId(null);
    }
  };

  useEffect(() => {
    // Real-time listener for roadmaps for this user
    if (!user) {
      setLoading(false);
      setRoadmaps([]);
      setEventsMap({});
      return;
    }

    const roadmapQ = query(collection(db, "roadmaps"), where("userId", "==", user.uid));
    const unsub = onSnapshot(roadmapQ, async (snapshot) => {
      const items: any[] = [];
      const map: Record<string, Array<any>> = {};

      for (const d of snapshot.docs) {
        const data: any = d.data();
        let steps = Array.isArray(data.steps) ? data.steps : [];

        // Ensure each step has a stable id
        let needsPatch = false;
        steps = steps.map((s: any, idx: number) => {
          if (!s.id) {
            needsPatch = true;
            return { ...s, id: typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function' ? (crypto as any).randomUUID() : `${d.id}-${idx}-${Date.now()}` };
          }
          return s;
        });

        if (needsPatch) {
          try {
            await updateDoc(doc(db, "roadmaps", d.id), { steps });
          } catch (err) {
            console.error("Failed to patch step ids", err);
          }
        }

        items.push({ id: d.id, ...data, steps });

        // Build events map
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (!step || !step.date) continue;
          const key = String(step.date);
          if (!map[key]) map[key] = [];
          map[key].push({
            id: step.id,
            title: step.title,
            completed: !!step.completed,
            roadmapId: d.id,
            idx: i,
            description: step.description,
            date: step.date,
          });
        }
        
      }

      setRoadmaps(items);
      setEventsMap(map);
    });

    const loadScholarships = async () => {
      try {
        // Get bookmarks to show relevant scholarships
        const bookmarksQ = query(collection(db, 'users', user.uid, 'bookmarks'));
        const bookmarksSnap = await getDocs(bookmarksQ);
        const bookmarkedIds = bookmarksSnap.docs.map((d) => d.data().scholarshipId || d.id);
        
        console.log("📚 Bookmarks count:", bookmarksSnap.docs.length);
        console.log("📚 Bookmarked IDs:", bookmarkedIds);

        if (bookmarkedIds.length > 0) {
          const schSnap = await getDocs(query(collection(db, "scholarships")));
          const allSch = schSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Scholarship[];
          
          console.log("🎓 Total scholarships:", allSch.length);
          
          const bookmarkedScholarships = allSch.filter((s) =>
            bookmarkedIds.includes(s.id!),
          );
          
          console.log("✅ Bookmarked scholarships found:", bookmarkedScholarships.length, bookmarkedScholarships.map(s => ({ id: s.id, title: s.title, deadline: s.deadline })));
          
          // Show bookmarked scholarships directly (user can generate roadmap for any bookmarked scholarship)
          setScholarships(bookmarkedScholarships);
        } else {
          console.log("⚠️ No bookmarks found, using fallback");
          // Fallback to top scholarships with upcoming deadlines if no bookmarks
          const schQ = query(collection(db, "scholarships"), limit(50));
          const schSnap = await getDocs(schQ);
          const allSch = schSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Scholarship[];
          const activeUpcomingScholarships = getActiveUpcomingDeadlines(
            allSch,
            30,
          );
          setScholarships(activeUpcomingScholarships.slice(0, 3));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadScholarships();
    }

    return () => unsub && unsub();
  }, [user]);

  const handleGenerate = async (scholarshipId: string) => {
    if (!isPremium && roadmaps.length >= 1) {
      toast.error(
        "Limit roadmap gratis tercapai (1 per 3 bulan). Silakan Upgrade!",
      );
      return;
    }

    setGenerating(true);
    try {
      const sch = scholarships.find((s) => s.id === scholarshipId);
      if (!sch) throw new Error("Beasiswa tidak ditemukan");

      // Check if scholarship deadline is overdue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let deadlineDate: Date | null = null;
      if (sch.deadline) {
        deadlineDate = new Date(sch.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
      }
      const isOverdue = deadlineDate && deadlineDate < today;

      if (isOverdue) {
        toast("📅 Beasiswa ini sudah melewati deadline tahun ini. Kami akan membuat roadmap untuk persiapan tahun depan — semangat! 💪", {
          duration: 5000,
        });
      }

      const res = await generateRoadmap(profile, sch, isOverdue || false);
      const steps = res.steps.map((s: any) => ({ ...s, completed: false }));

      await addDoc(collection(db, "roadmaps"), {
        userId: user!.uid,
        scholarshipId,
        scholarshipTitle: sch.title,
        steps,
        createdAt: new Date().toISOString(),
      });

      toast.success("Roadmap berhasil dibuat!");
      window.location.reload();
    } catch (error) {
      toast.error("Gagal membuat roadmap AI");
    } finally {
      setGenerating(false);
    }
  };

  const toggleStep = async (roadmapId: string, idx: number) => {
    try {
      const roadmap = roadmaps.find((r) => r.id === roadmapId);
      const newSteps = [...roadmap.steps];
      newSteps[idx].completed = !newSteps[idx].completed;

      await updateDoc(doc(db, "roadmaps", roadmapId), {
        steps: newSteps,
      });

      setRoadmaps(
        roadmaps.map((r) =>
          r.id === roadmapId ? { ...r, steps: newSteps } : r,
        ),
      );
    } catch (error) {
      toast.error("Gagal memperbarui status");
    }
  };

  const scrollToTask = (taskId: string) => {
    const el = document.getElementById(`task-${taskId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-amber-400", "bg-amber-50");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-amber-400", "bg-amber-50");
      }, 3000);
    }
  };

  const handleDateChange = async (taskId: string, newDate: string) => {
    try {
      // locate roadmap and step
      const roadmap = roadmaps.find((r) => r.steps?.some((s: any) => s.id === taskId));
      if (!roadmap) throw new Error("Roadmap not found for task");

      const newSteps = roadmap.steps.map((s: any) => (s.id === taskId ? { ...s, date: newDate } : s));
      await updateDoc(doc(db, "roadmaps", roadmap.id), { steps: newSteps });

      // Call AI reroute
      try {
        const aiResp = await rerouteRoadmap({ ...roadmap, steps: newSteps }, { id: taskId, newDate });
        if (aiResp && Array.isArray(aiResp.steps) && aiResp.steps.length > 0) {
          toast("AI menemukan penjadwalan ulang potensial", {
            action: {
              label: "AI Re-route",
              onClick: async () => {
                try {
                  await updateDoc(doc(db, "roadmaps", roadmap.id), { steps: aiResp.steps });
                  toast.success("Roadmap diperbarui oleh AI");
                } catch (err) {
                  console.error(err);
                  toast.error("Gagal menerapkan jadwal AI");
                }
              },
            },
          });
        }
      } catch (err) {
        console.error("AI reroute error", err);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengubah tanggal tugas");
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string, roadmapTitle: string) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus roadmap "${roadmapTitle}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setDeletingId(roadmapId);
    try {
      await deleteDoc(doc(db, "roadmaps", roadmapId));
      toast.success(`Roadmap "${roadmapTitle}" berhasil dihapus`);
    } catch (error: any) {
      console.error("Delete roadmap error:", error);
      toast.error(error.message || "Gagal menghapus roadmap");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRoadmapExpand = (roadmapId: string) => {
    const newSet = new Set(expandedRoadmapIds);
    if (newSet.has(roadmapId)) {
      newSet.delete(roadmapId);
    } else {
      newSet.add(roadmapId);
    }
    setExpandedRoadmapIds(newSet);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">
          Roadmap & Kalender Beasiswa
        </h1>
        <p className="mt-2 text-slate-500">
          Ikuti langkah-langkah strategis untuk melamar beasiswa impian Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Calendar & Shortcuts */}
        <div className="space-y-6 lg:col-span-5">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            <Card className="border-slate-200 lg:w-1/2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Kalender Planner</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 overflow-auto max-h-[520px]">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="mx-auto w-fit rounded-md border-0"
                    eventsMap={eventsMap}
                    onDateClick={(events) => {
                      if (events && events.length > 0) scrollToTask(events[0].id);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 lg:w-1/2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Legend & Events</CardTitle>
                <CardDescription className="text-slate-400">Penjelasan warna dot dan daftar tugas</CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[520px]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    <span className="text-sm text-slate-600">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    <span className="text-sm text-slate-600">Selesai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                    <span className="text-sm text-slate-600">Overdue</span>
                  </div>
                </div>

                {/* Events list for selected date */}
                <div>
                  <h4 className="text-sm font-bold mb-2">Tugas pada {selectedDate ? formatLocalDate(selectedDate) : formatLocalDate(new Date())}</h4>
                  <div className="space-y-2">
                    {(() => {
                      const iso = formatLocalDate(selectedDate || new Date());
                      const list = eventsMap[iso] || [];
                      if (list.length === 0) return <p className="text-xs text-slate-500">Tidak ada tugas pada tanggal ini.</p>;
                      return list.map((ev: any) => {
                        const todayIso = formatLocalDate(new Date());
                        const isOverdue = !ev.completed && ev.date && ev.date < todayIso;
                        const color = isOverdue ? 'bg-red-500' : ev.completed ? 'bg-green-500' : 'bg-blue-500';
                        return (
                          <div key={ev.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                              <button onClick={() => scrollToTask(ev.id)} className="text-sm text-slate-700 text-left">
                                {ev.title}
                              </button>
                            </div>
                            <div className="text-xs text-slate-500">{ev.date || ''}</div>
                          </div>
                        );
                      })
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
            <CardContent className="pt-0">
              {generating ? (
                <div className="flex flex-col items-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-400 mb-2" />
                  <p className="text-xs text-slate-300">Merancang roadmap...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 italic">
                    Pilih dari beasiswa yang Anda simpan (Bookmarks) untuk
                    membuat timeline.
                  </p>
                  {scholarships.length > 0 ? (
                    <div className="space-y-3">
                      <Select
                        value={selectedScholarshipId}
                        onValueChange={(value) => value !== null && setSelectedScholarshipId(value)}
                      >
                        <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-slate-200">
                          <SelectValue placeholder="Pilih beasiswa bookmarked" />
                        </SelectTrigger>
                        <SelectContent>
                          {scholarships.map((s) => (
                            <SelectItem key={s.id} value={s.id || ""}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => selectedScholarshipId && handleGenerate(selectedScholarshipId)}
                        disabled={!selectedScholarshipId}
                        className="w-full justify-between border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                      >
                        <span className="truncate">
                          {selectedScholarshipId
                            ? scholarships.find((s) => s.id === selectedScholarshipId)?.title || "Generate Roadmap"
                            : "Generate Roadmap"}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4 italic">
                      Belum ada beasiswa di bookmarks Anda.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Active Roadmaps */}
        <div className="space-y-6 lg:col-span-7">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100">
              <div className="rounded-full bg-slate-50 p-6 mb-4">
                <CalendarIcon className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Belum ada Roadmap Aktif
              </h3>
              <p className="mt-2 text-slate-500 max-w-sm">
                Mulailah dengan membuat roadmap dari daftar beasiswa yang
                tersedia.
              </p>
            </div>
          ) : (
            roadmaps.map((roadmap) => {
              const isExpanded = expandedRoadmapIds.has(roadmap.id);
              return (
                <Card key={roadmap.id} className="border-slate-200 overflow-hidden">
                  <CardHeader
                    className="bg-slate-50/50 border-b cursor-pointer hover:bg-slate-100/50 transition-colors"
                    onClick={() => toggleRoadmapExpand(roadmap.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <Badge className="mb-2 bg-slate-900">Active Roadmap</Badge>
                        <CardTitle className="text-xl">{roadmap.scholarshipTitle}</CardTitle>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-2xl font-bold text-slate-900">
                            {Math.round(
                              (roadmap.steps.filter((s: any) => s.completed).length /
                                roadmap.steps.length) *
                                100,
                            )}
                            %
                          </span>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                            Progress
                          </p>
                        </div>
                        <div>
                          <ChevronRight
                            className={`h-6 w-6 text-slate-400 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <>
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                          {roadmap.steps.map((step: any, idx: number) => {
                            const todayIso = new Date().toISOString().slice(0, 10);
                            const isOverdue = step.date && !step.completed && step.date < todayIso;
                            return (
                              <div
                                id={`task-${step.id}`}
                                key={step.id || idx}
                                className={`flex items-start gap-4 p-5 transition-colors cursor-pointer hover:bg-slate-50/50 group ${step.completed ? "opacity-60" : ""} ${isOverdue ? "bg-red-50 border-l-4 border-red-500" : ""}`}
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
                                    <h4
                                      className={`font-bold ${step.completed ? "line-through text-slate-400" : "text-slate-900"}`}
                                    >
                                      {step.title}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <input
                                        aria-label={`Ubah tanggal untuk ${step.title}`}
                                        type="date"
                                        value={step.date || ""}
                                        onChange={(e) => handleDateChange(step.id, e.target.value)}
                                        disabled={!!step.completed}
                                        className="text-xs font-mono text-slate-500 bg-transparent border border-slate-100 rounded px-2 py-1"
                                      />
                                    </div>
                                  </div>
                                  {step.description && (
                                    <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50/30 p-4 border-t flex gap-3 flex-col sm:flex-row">
                        <Button
                          variant="ghost"
                          className="flex-1 text-slate-500 hover:text-slate-900"
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
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteRoadmap(roadmap.id, roadmap.scholarshipTitle)}
                          disabled={deletingId === roadmap.id}
                        >
                          {deletingId === roadmap.id ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Menghapus...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Hapus Roadmap
                            </span>
                          )}
                        </Button>
                      </CardFooter>
                    </>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


