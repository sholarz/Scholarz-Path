import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc, deleteDoc, collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Search, MapPin, Calendar, BookOpen, ExternalLink, SlidersHorizontal, Loader2, Bookmark, BookmarkCheck, X, Filter, Check } from "lucide-react";
import { Scholarship } from "../types";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from "../components/ui/sheet";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";

export default function Scholarships() {
  const { user, profile, isPremium } = useAuth();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Scholarship[]>([]);

  // Filter States
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [fieldSearchQuery, setFieldSearchQuery] = useState("");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [showAllFilterChips, setShowAllFilterChips] = useState(false);
  const [failedImageMap, setFailedImageMap] = useState<Record<string, boolean>>({});

  const DEFAULT_COUNTRIES = ["Indonesia", "Amerika Serikat", "Inggris", "Australia", "Kanada", "Jerman", "Belanda", "Jepang", "Korea Selatan", "Singapura", "Malaysia", "Prancis", "Swiss"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "scholarships"), orderBy("deadline", "asc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Scholarship[];
        setScholarships(data);
        setFiltered(data);

        if (user) {
          const bSnapshot = await getDocs(collection(db, "users", user.uid, "bookmarks"));
          setBookmarks(bSnapshot.docs.map((doc) => doc.id));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Combined Filter Logic
  useEffect(() => {
    let result = scholarships;

    // Search Filter
    if (search.trim()) {
      const low = search.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(low) || s.description.toLowerCase().includes(low) || s.field?.toLowerCase().includes(low) || s.country?.toLowerCase().includes(low) || s.eligibility?.toLowerCase().includes(low),
      );
    }

    // Field Filter (multi-select)
    if (selectedFields.length > 0) {
      result = result.filter((s) => selectedFields.includes(s.field));
    }

    // Country Filter (multi-select)
    if (selectedCountries.length > 0) {
      result = result.filter((s) => selectedCountries.includes(s.country));
    }

    setFiltered(result);
  }, [search, selectedFields, selectedCountries, scholarships]);

  // Derived Filter Options
  const fields = Array.from(new Set(scholarships.map((s) => s.field).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const countries = Array.from(new Set([...DEFAULT_COUNTRIES, ...scholarships.map((s) => s.country).filter(Boolean)])).sort((a, b) => a.localeCompare(b));

  const filteredFieldOptions = fields.filter((field) => field.toLowerCase().includes(fieldSearchQuery.trim().toLowerCase()));

  const filteredCountryOptions = countries.filter((country) => country.toLowerCase().includes(countrySearchQuery.trim().toLowerCase()));

  const toggleBookmark = async (s: Scholarship) => {
    if (!user) return toast.error("Silakan login untuk menyimpan beasiswa");

    const isBookmarked = bookmarks.includes(s.id!);
    const docRef = doc(db, "users", user.uid, "bookmarks", s.id!);

    try {
      if (isBookmarked) {
        await deleteDoc(docRef);
        setBookmarks((prev) => prev.filter((id) => id !== s.id));
        toast.info("Berhasil dihapus dari simpanan");
      } else {
        // Check limit for free users
        if (!isPremium && bookmarks.length >= 3) {
          return toast.error("Batas bookmark gratis (3) tercapai. Upgrade ke Premium untuk akses Unlimited!");
        }

        await setDoc(docRef, {
          scholarshipId: s.id,
          title: s.title,
          deadline: s.deadline,
          createdAt: new Date().toISOString(),
        });
        setBookmarks((prev) => [...prev, s.id!]);
        toast.success("Berhasil disimpan!");
      }
    } catch (error) {
      toast.error("Gagal memperbarui bookmark");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedFields([]);
    setSelectedCountries([]);
    setFieldSearchQuery("");
    setCountrySearchQuery("");
  };

  const toggleFieldSelection = (field: string) => {
    setSelectedFields((prev) => (prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field]));
  };

  const toggleCountrySelection = (country: string) => {
    setSelectedCountries((prev) => (prev.includes(country) ? prev.filter((item) => item !== country) : [...prev, country]));
  };

  const activeFilterItems = [
    ...selectedFields.map((field) => ({ type: "field" as const, value: field })),
    ...selectedCountries.map((country) => ({ type: "country" as const, value: country })),
  ];

  const compactPreviewItems = activeFilterItems.slice(0, 3);
  const hiddenFilterCount = Math.max(activeFilterItems.length - compactPreviewItems.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 italic">Jelajahi Beasiswa</h1>
          <p className="mt-3 text-slate-500 max-w-lg leading-relaxed">Temukan ribuan peluang pendidikan dari berbagai institusi terbaik di Indonesia.</p>
        </div>

        <div className="flex w-full max-w-xl items-center gap-3">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Cari kata kunci, universitas..."
              className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className={`h-12 px-5 rounded-2xl border-slate-200 bg-white shadow-sm shrink-0 font-bold flex items-center gap-2 hover:border-indigo-200 hover:bg-white transition-all relative ${selectedFields.length > 0 || selectedCountries.length > 0 ? "border-indigo-400 ring-2 ring-indigo-500/10 bg-indigo-50/10" : ""}`}
                >
                  <SlidersHorizontal className={`h-4 w-4 ${selectedFields.length > 0 || selectedCountries.length > 0 ? "text-indigo-600" : "text-slate-600"}`} />
                  <span className={selectedFields.length > 0 || selectedCountries.length > 0 ? "text-indigo-700" : "text-slate-700"}>Filter</span>
                  {(selectedFields.length > 0 || selectedCountries.length > 0) && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in duration-300">
                      {selectedFields.length + selectedCountries.length}
                    </span>
                  )}
                </Button>
              }
            />
            <SheetContent className="border-l border-slate-100 flex flex-col p-0 sm:right-6 sm:top-6 sm:bottom-6 sm:h-auto sm:w-[min(28rem,calc(100vw-3rem))] sm:max-w-[28rem] sm:rounded-3xl sm:shadow-2xl">
              <SheetHeader className="p-6 pb-6 border-b border-slate-100">
                <SheetTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Filter className="h-5 w-5" />
                  </div>
                  Filter Hasil
                </SheetTitle>
                <SheetDescription className="text-slate-500 font-medium pt-1">Sesuaikan kriteria untuk menemukan peluang beasiswa yang paling relevan bagi Anda.</SheetDescription>
              </SheetHeader>

              <div className="flex-grow overflow-y-auto p-6 space-y-8 py-6">
                {(selectedFields.length > 0 || selectedCountries.length > 0) && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Filter Aktif</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedFields.map((field) => (
                        <Badge key={`sheet-field-${field}`} variant="secondary" className="bg-white text-indigo-700 border-indigo-100/70 px-2.5 py-1 text-[10px] font-bold">
                          {field}
                        </Badge>
                      ))}
                      {selectedCountries.map((country) => (
                        <Badge key={`sheet-country-${country}`} variant="secondary" className="bg-white text-indigo-700 border-indigo-100/70 px-2.5 py-1 text-[10px] font-bold">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-indigo-500" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori Bidang</label>
                  </div>
                  <Input value={fieldSearchQuery} onChange={(e) => setFieldSearchQuery(e.target.value)} placeholder="Cari bidang..." className="h-11 rounded-xl border-slate-100 bg-white" />
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2 max-h-52 overflow-auto space-y-1.5">
                    {filteredFieldOptions.length > 0 ? (
                      filteredFieldOptions.map((field) => {
                        const active = selectedFields.includes(field);
                        return (
                          <button
                            key={field}
                            type="button"
                            onClick={() => toggleFieldSelection(field)}
                            className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors min-h-11 flex items-start justify-between gap-3 ${active ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"}`}
                          >
                            <span className="leading-snug break-words">{field}</span>
                            <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-white/80 bg-white/15" : "border-slate-300 bg-white"}`}>
                              {active && <Check size={12} />}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-2 py-1 text-xs font-medium text-slate-400">Tidak ada bidang yang cocok.</p>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Anda bisa pilih lebih dari satu bidang.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-indigo-500" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Wilayah / Negara</label>
                  </div>
                  <Input value={countrySearchQuery} onChange={(e) => setCountrySearchQuery(e.target.value)} placeholder="Cari negara..." className="h-11 rounded-xl border-slate-100 bg-white" />
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2 max-h-52 overflow-auto space-y-1.5">
                    {filteredCountryOptions.length > 0 ? (
                      filteredCountryOptions.map((country) => {
                        const active = selectedCountries.includes(country);
                        return (
                          <button
                            key={country}
                            type="button"
                            onClick={() => toggleCountrySelection(country)}
                            className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors min-h-11 flex items-start justify-between gap-3 ${active ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"}`}
                          >
                            <span className="leading-snug break-words">{country}</span>
                            <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-white/80 bg-white/15" : "border-slate-300 bg-white"}`}>
                              {active && <Check size={12} />}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-2 py-1 text-xs font-medium text-slate-400">Tidak ada negara yang cocok.</p>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Anda bisa pilih lebih dari satu negara.</p>
                </div>
              </div>

              <SheetFooter className="p-6 border-t border-slate-100 flex-row gap-3 bg-slate-50/50">
                <Button variant="ghost" onClick={clearFilters} className="flex-1 rounded-2xl font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all h-12">
                  Reset
                </Button>
                <SheetClose render={<Button className="flex-1 bg-slate-900 text-white rounded-2xl font-bold h-12 shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all">Selesai</Button>} />
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedFields.length > 0 || selectedCountries.length > 0 || search) && (
        <div className="mb-10 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Penyaringan</span>
            {activeFilterItems.length > 0 && (
              <Badge variant="secondary" className="bg-slate-900 text-white border-none px-2.5 py-1 text-[10px] font-bold">
                {activeFilterItems.length} filter aktif
              </Badge>
            )}

            {search && (
              <Badge variant="secondary" className="pl-3 pr-1 py-1 rounded-full bg-slate-900 text-white flex items-center gap-2 border-none shadow-sm text-[10px] font-bold">
                <span>"{search}"</span>
                <button onClick={() => setSearch("")} className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/60 hover:text-white">
                  <X size={11} strokeWidth={3} />
                </button>
              </Badge>
            )}

            {(showAllFilterChips ? activeFilterItems : compactPreviewItems).map((item) => (
              <Badge key={`${item.type}-${item.value}`} variant="secondary" className="pl-3 pr-1 py-1 rounded-full bg-indigo-50 text-indigo-700 border-indigo-100/70 flex items-center gap-2 shadow-sm text-[10px] font-bold">
                {item.type === "field" ? <BookOpen size={11} className="text-indigo-400" /> : <MapPin size={11} className="text-indigo-400" />}
                <span className="uppercase tracking-tight">{item.value}</span>
                <button
                  onClick={() => (item.type === "field" ? toggleFieldSelection(item.value) : toggleCountrySelection(item.value))}
                  className="p-1 rounded-full hover:bg-indigo-100 transition-colors text-indigo-400 hover:text-indigo-700"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </Badge>
            ))}

            {!showAllFilterChips && hiddenFilterCount > 0 && (
              <Badge variant="outline" className="px-2.5 py-1 text-[10px] font-bold border-slate-200 text-slate-500 bg-slate-50">
                +{hiddenFilterCount} lainnya
              </Badge>
            )}

            {activeFilterItems.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllFilterChips((prev) => !prev)}
                className="h-7 px-3 rounded-full text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                {showAllFilterChips ? "Ringkas" : "Lihat Semua"}
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 uppercase tracking-widest ml-auto h-7 px-3 rounded-full">
              Bersihkan Semua
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-400 font-medium animate-pulse">Menyiapkan inspirasi masa depan...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, user ? filtered.length : 3).map((s, idx) => (
            <Card
              key={s.id}
              className="group flex flex-col overflow-hidden border-slate-100 shadow-sm rounded-3xl transition-all hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 bg-white animate-in zoom-in-95 duration-500"
            >
              <div className={`relative aspect-[16/10] w-full overflow-hidden ${s.imageUrl && !failedImageMap[s.id || s.title] ? "bg-slate-50" : "bg-slate-100"}`}>
                {(!s.imageUrl || failedImageMap[s.id || s.title]) && (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,23,42,0.08),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(15,23,42,0.06),transparent_45%)]" />
                    {idx % 3 === 0 && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center text-slate-700/80">
                          <GraduationCap size={96} strokeWidth={1.2} />
                        </div>
                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-slate-500/80">
                          <BookOpen size={24} strokeWidth={1.5} />
                          <BookOpen size={20} strokeWidth={1.5} />
                        </div>
                      </>
                    )}
                    {idx % 3 === 1 && (
                      <>
                        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-slate-700/80">
                          <GraduationCap size={90} strokeWidth={1.1} />
                        </div>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-1.5 w-28 rounded-full bg-slate-400/40" />
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 h-6 w-20 rounded-md border border-slate-400/40 bg-white/60" />
                      </>
                    )}
                    {idx % 3 === 2 && (
                      <>
                        <div className="absolute left-6 top-6 text-slate-600/80">
                          <GraduationCap size={46} strokeWidth={1.2} />
                        </div>
                        <div className="absolute right-6 top-10 text-slate-600/70">
                          <GraduationCap size={34} strokeWidth={1.2} />
                        </div>
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-slate-700/80">
                          <GraduationCap size={72} strokeWidth={1.1} />
                        </div>
                      </>
                    )}
                  </>
                )}
                {s.imageUrl && !failedImageMap[s.id || s.title] && (
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      const imageKey = s.id || s.title;
                      setFailedImageMap((prev) => ({ ...prev, [imageKey]: true }));
                    }}
                  />
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-white/95 backdrop-blur text-indigo-700 shadow-sm border-none font-bold px-3">{s.country || "Indonesia"}</Badge>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={`h-9 w-9 rounded-full shadow-lg backdrop-blur border-none transition-all ${bookmarks.includes(s.id!) ? "bg-indigo-600 text-white hover:bg-indigo-700 scale-110" : "bg-white/80 text-slate-400 hover:text-indigo-600 hover:bg-white"}`}
                    onClick={() => toggleBookmark(s)}
                  >
                    {bookmarks.includes(s.id!) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </Button>
                </div>
              </div>
              <CardHeader className="p-6 pb-0">
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3 px-3 py-1 bg-indigo-50/50 w-fit rounded-full border border-indigo-100/50">
                  <BookOpen size={12} />
                  <span>{s.field || "Semua Bidang"}</span>
                </div>
                <CardTitle className="text-xl font-black line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{s.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-3 text-slate-500 font-medium leading-relaxed">{s.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-6 pt-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Batas Akhir</p>
                    <p className="text-xs font-bold text-slate-900">{s.deadline}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 p-6">
                {user ? (
                  <Dialog>
                    <DialogTrigger render={<Button className="w-full h-12 bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95">Detail Beasiswa</Button>} />
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl">
                      <div className="p-8 bg-indigo-600 text-white">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-100 opacity-80">
                          <MapPin size={14} /> {s.country || "Indonesia"} • {s.field || "Umum"}
                        </div>
                        <DialogTitle className="text-3xl font-black leading-tight mb-2 pr-8">{s.title}</DialogTitle>
                        <div className="flex items-center gap-2 mt-4">
                          <Badge variant="secondary" className="bg-white/20 text-white border-none font-bold">
                            Deadline: {s.deadline}
                          </Badge>
                        </div>
                      </div>

                      <ScrollArea className="flex-grow">
                        <div className="p-8 space-y-10">
                          <section>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">Tentang Beasiswa</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">{s.description}</p>
                          </section>

                          <section className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">Kriteria Kelayakan</h3>
                            <div className="text-indigo-800 leading-relaxed font-medium text-sm prose prose-sm prose-indigo max-w-none prose-p:my-2 prose-li:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-indigo-400">
                              <Markdown>{s.eligibility}</Markdown>
                            </div>
                          </section>

                          {s.benefits && (
                            <section>
                              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">Benefit & Besaran</h3>
                              <div className="text-slate-600 leading-relaxed font-medium text-sm prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-indigo-300">
                                <Markdown>{s.benefits}</Markdown>
                              </div>
                            </section>
                          )}

                          {s.selectionProcess && (
                            <section>
                              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">Proses Seleksi</h3>
                              <div className="text-slate-600 leading-relaxed font-medium text-sm prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-indigo-300">
                                <Markdown>{s.selectionProcess}</Markdown>
                              </div>
                            </section>
                          )}
                        </div>
                      </ScrollArea>

                      <div className="p-8 pt-4 border-t border-slate-100 flex items-center gap-4">
                        <Button asChild className="flex-grow h-14 bg-indigo-600 text-white hover:bg-slate-900 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all">
                          <a href={s.link || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                            DAFTAR SEKARANG <ExternalLink size={18} />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-14 w-14 rounded-2xl border-2 transition-all ${bookmarks.includes(s.id!) ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-slate-100 text-slate-300"}`}
                          onClick={() => toggleBookmark(s)}
                        >
                          <Bookmark size={20} fill={bookmarks.includes(s.id!) ? "currentColor" : "none"} />
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button asChild className="w-full h-12 bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95">
                    <Link to="/auth">Login untuk Detail</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
          <div className="rounded-full bg-slate-50 p-10 mb-6 shadow-inner">
            <Search className="h-12 w-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase italic">Pencarian Nihil</h3>
          <p className="mt-3 text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">Kami tidak menemukan beasiswa yang cocok. Coba atur ulang filter atau gunakan kata kunci lain.</p>
          <Button variant="outline" onClick={clearFilters} className="mt-8 rounded-xl px-8 h-12 font-bold">
            Atur Ulang Semua Filter
          </Button>
        </div>
      )}
    </div>
  );
}

const GraduationCap = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.42 10.922 12 4.19 2.58 10.922l8.97 6.47a1 1 0 0 0 1.1 0z" />
    <path d="M6 12.5v5.5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5.5" />
    <path d="M22 10v6" />
  </svg>
);
