import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Bookmark, Calendar, ExternalLink, Trash2, Loader2, GraduationCap, ArrowRight, MapPin, MapPinIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Scholarship } from '../types';
import Markdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";

export default function Bookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const fetchScholarshipDetail = async (scholarshipId: string) => {
    setFetchingDetail(true);
    try {
      const docSnap = await getDoc(doc(db, 'scholarships', scholarshipId));
      if (docSnap.exists()) {
        setSelectedScholarship({ id: docSnap.id, ...docSnap.data() } as Scholarship);
      } else {
        toast.error("Detail beasiswa tidak ditemukan");
      }
    } catch (error) {
      toast.error("Gagal memuat detail beasiswa");
    } finally {
      setFetchingDetail(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users', user.uid, 'bookmarks'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setBookmarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', id));
      setBookmarks(prev => prev.filter(b => b.id !== id));
      toast.success("Berhasil dihapus dari simpanan");
    } catch (error) {
      toast.error("Gagal menghapus bookmark");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Bookmark className="text-indigo-600" />
          Beasiswa Disimpan
          {useAuth().isPremium && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 ml-2">Unlimited Capacity</Badge>
          )}
        </h1>
        <p className="text-slate-500 mt-2">Daftar beasiswa yang Anda simpan untuk dipantau lebih lanjut.</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookmarks.map((b) => (
            <Card key={b.id} className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 cursor-pointer" onClick={() => fetchScholarshipDetail(b.scholarshipId || b.id)}>
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{b.title}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Calendar size={12} />
                    <span>DL: {b.deadline}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmark(b.id);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </CardHeader>
              <CardFooter className="pt-2 pb-4">
                <Button 
                  variant="outline" 
                  className="w-full text-xs font-bold border-slate-200 h-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all" 
                  onClick={() => fetchScholarshipDetail(b.scholarshipId || b.id)}
                  disabled={fetchingDetail && selectedScholarship?.id === (b.scholarshipId || b.id)}
                >
                  {fetchingDetail && selectedScholarship?.id === (b.scholarshipId || b.id) ? (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  ) : (
                    <span className="flex items-center gap-2">Lihat Detail Beasiswa <ArrowRight size={14} /></span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="text-slate-300 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Belum ada beasiswa disimpan</h2>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
            Jelajahi berbagai beasiswa menarik dan simpan yang paling sesuai dengan kriteria Anda.
          </p>
          <Button asChild className="mt-8 bg-indigo-600 text-white hover:bg-indigo-700 px-8 rounded-xl font-bold">
            <Link to="/scholarships">Mulai Menjelajah</Link>
          </Button>
        </div>
      )}
      <Dialog open={!!selectedScholarship} onOpenChange={(open) => !open && setSelectedScholarship(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
          {selectedScholarship && (
            <>
              <div className="p-8 bg-indigo-600 text-white">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-100 opacity-80">
                  <MapPin size={14} /> {selectedScholarship.country || 'Indonesia'} • {selectedScholarship.field || 'Umum'}
                </div>
                <DialogTitle className="text-3xl font-black leading-tight mb-2 pr-8 italic">{selectedScholarship.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-none font-bold">
                    Deadline: {selectedScholarship.deadline}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="flex-grow">
                <div className="p-8 space-y-10">
                  <section>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                       Tentang Beasiswa
                    </h3>
                    <p className="text-slate-600 leading-relaxed font-bold">
                      {selectedScholarship.description}
                    </p>
                  </section>

                  <section className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                       Kriteria Kelayakan
                    </h3>
                    <div className="text-indigo-800 leading-relaxed font-bold text-sm prose prose-sm prose-indigo max-w-none prose-p:my-2 prose-li:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-indigo-400">
                      <Markdown>{selectedScholarship.eligibility}</Markdown>
                    </div>
                  </section>

                  {selectedScholarship.benefits && (
                    <section>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                         Benefit & Besaran
                      </h3>
                      <div className="text-slate-600 leading-relaxed font-bold text-sm prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-indigo-300">
                        <Markdown>{selectedScholarship.benefits}</Markdown>
                      </div>
                    </section>
                  )}

                  {selectedScholarship.selectionProcess && (
                    <section>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                         Proses Seleksi
                      </h3>
                      <div className="text-slate-600 leading-relaxed font-bold text-sm prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-indigo-300">
                        <Markdown>{selectedScholarship.selectionProcess}</Markdown>
                      </div>
                    </section>
                  )}
                </div>
              </ScrollArea>

              <div className="p-8 pt-4 border-t border-slate-100 flex items-center gap-4">
                <Button asChild className="flex-grow h-14 bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl font-black shadow-xl shadow-slate-100 transition-all tracking-tighter">
                  <a href={selectedScholarship.link || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 uppercase">
                    DAFTAR SEKARANG <ExternalLink size={18} />
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
