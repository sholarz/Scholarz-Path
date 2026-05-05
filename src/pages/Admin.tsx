import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { extractScholarshipFromText, searchScholarshipOnWeb, extractFromUrl } from '../services/geminiService';
import { toast } from 'sonner';
import { Loader2, Plus, Sparkles, Trash2, ExternalLink, Search, Globe, PencilLine, X } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { Scholarship } from '../types';

export default function Admin() {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [rawText, setRawText] = useState('');
  
  // Form State
  const [manualData, setManualData] = useState({
    title: '',
    description: '',
    deadline: '',
    eligibility: '',
    country: 'Indonesia',
    field: '',
    link: '',
    benefits: '',
    selectionProcess: ''
  });
  const [manualErrors, setManualErrors] = useState<Partial<Record<'title' | 'deadline' | 'link', string>>>({});

  const [editingScholarshipId, setEditingScholarshipId] = useState<string | null>(null);

  const isValidDateInput = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;

    const [year, month, day] = value.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
  };

  const validateManualData = (data = manualData) => {
    const nextErrors: Partial<Record<'title' | 'deadline' | 'link', string>> = {};

    if (!data.title.trim()) {
      nextErrors.title = 'Judul beasiswa tidak boleh kosong';
    }

    if (!data.deadline) {
      nextErrors.deadline = 'Deadline tidak boleh kosong';
    } else if (!isValidDateInput(data.deadline)) {
      nextErrors.deadline = 'Deadline harus berupa tanggal yang valid';
    }

    if (!data.link.trim()) {
      nextErrors.link = 'Link tidak boleh kosong';
    }

    return nextErrors;
  };

  const updateManualField = (field: keyof typeof manualData, value: string) => {
    setManualData(prev => ({ ...prev, [field]: value }));
    if (field === 'title' || field === 'deadline' || field === 'link') {
      setManualErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetManualForm = () => {
    setManualData({
      title: '',
      description: '',
      deadline: '',
      eligibility: '',
      country: 'Indonesia',
      field: '',
      link: '',
      benefits: '',
      selectionProcess: ''
    });
    setManualErrors({});
    setEditingScholarshipId(null);
  };

  const beginEditScholarship = (scholarship: Scholarship) => {
    setManualData({
      title: scholarship.title || '',
      description: scholarship.description || '',
      deadline: scholarship.deadline || '',
      eligibility: scholarship.eligibility || '',
      country: scholarship.country || 'Indonesia',
      field: scholarship.field || '',
      link: scholarship.link || '',
      benefits: scholarship.benefits || '',
      selectionProcess: scholarship.selectionProcess || ''
    });
    setManualErrors({});
    setEditingScholarshipId(scholarship.id);
    setFormTab('manual');
    setActiveTab('scholarships');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'scholarships'), orderBy('deadline', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Scholarship[];
      setScholarships(data);
    } catch (error) {
      toast.error('Gagal memuat beasiswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
    fetchPayments();
  }, []);

  const createPaymentNotification = async (
    payment: any,
    payload: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'match';
    }
  ) => {
    await addDoc(collection(db, 'notifications'), {
      userId: payment.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      read: false,
      createdAt: serverTimestamp(),
      link: '/profile'
    });
  };

  const handleApprovePayment = async (payment: any) => {
    try {
      // 1. Update payment status
      await updateDoc(doc(db, 'payments', payment.id), { status: 'approved' });
      
      // 2. Update user role
      await updateDoc(doc(db, 'users', payment.userId), { role: 'premium' });

      // 3. Create notification for user
      await createPaymentNotification(payment, {
        title: 'Pembayaran Diterima',
        message: 'Selamat! Pembayaran Anda sudah diverifikasi. Akun Anda sekarang aktif sebagai Premium.',
        type: 'success'
      });
      
      toast.success(`User ${payment.userName} berhasil diupgrade ke Premium!`);
      fetchPayments();
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Gagal melakukan upgrade user");
    }
  };

  const handleRejectPayment = async (payment: any) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), { status: 'rejected' });
      await createPaymentNotification(payment, {
        title: 'Pembayaran Ditolak',
        message: 'Maaf, pembayaran Anda ditolak. Silakan cek ulang bukti transfer atau hubungi admin untuk konfirmasi.',
        type: 'warning'
      });
      toast.info("Pembayaran ditolak");
      fetchPayments();
    } catch (error) {
      toast.error("Gagal menolak pembayaran");
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateManualData();
    setManualErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0] || 'Lengkapi data wajib sebelum menyimpan');
      return;
    }

    const payload = {
      ...manualData,
      title: manualData.title.trim(),
      deadline: manualData.deadline.trim(),
      link: manualData.link.trim()
    };

    try {
      if (editingScholarshipId) {
        await updateDoc(doc(db, 'scholarships', editingScholarshipId), payload);
        toast.success('Beasiswa berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'scholarships'), payload);
        toast.success('Beasiswa berhasil ditambahkan');
      }
      resetManualForm();
      fetchScholarships();
    } catch (error) {
      toast.error(editingScholarshipId ? 'Gagal memperbarui beasiswa' : 'Gagal menambahkan beasiswa');
    }
  };

  const [activeTab, setActiveTab] = useState('scholarships');
  const [formTab, setFormTab] = useState('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return toast.error('Masukkan kueri pencarian');
    setSearching(true);
    try {
      const results = await searchScholarshipOnWeb(searchQuery);
      setSearchResults(results);
      if (results.length === 0) toast.info('Tidak ditemukan beasiswa yang relevan');
    } catch (error) {
      toast.error('Gagal mencari beasiswa');
    } finally {
      setSearching(false);
    }
  };

  const handleWebExtract = async (url: string) => {
    setExtracting(true);
    try {
      const extracted = await extractFromUrl(url);
      setManualData(prev => ({ ...prev, ...extracted }));
      setFormTab('manual');
      toast.success('Data berhasil diekstrak dari web!');
    } catch (error) {
      toast.error('Gagal mengekstrak data dari URL');
    } finally {
      setExtracting(false);
    }
  };

  const handleAIExtract = async () => {
    if (!rawText.trim()) return toast.error('Masukkan teks terlebih dahulu');
    setExtracting(true);
    try {
      const extracted = await extractScholarshipFromText(rawText);
      setManualData(prev => ({ ...prev, ...extracted }));
      setFormTab('manual');
      toast.success('Data berhasil diekstrak! Silakan cek di tab Manual');
    } catch (error) {
      toast.error('AI gagal mengekstrak data');
    } finally {
      setExtracting(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'scholarships', id));
      if (editingScholarshipId === id) {
        resetManualForm();
      }
      setConfirmDeleteId(null);
      toast.success('Berhasil dihapus');
      fetchScholarships();
    } catch (error) {
      toast.error('Gagal menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  const handleManualBlur = (field: 'title' | 'deadline' | 'link') => {
    const nextManualData =
      field === 'title'
        ? { ...manualData, title: manualData.title.trim() }
        : manualData;

    if (field === 'title' && nextManualData.title !== manualData.title) {
      setManualData(prev => ({ ...prev, title: nextManualData.title }));
    }

    const fieldErrors = validateManualData(nextManualData);
    setManualErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field]
    }));
  };

  return (
    <div className="sp-page-container">
      <div className="sp-page-header flex items-center justify-between">
        <div>
          <h1 className="sp-page-title">Admin Control Tower</h1>
          <p className="sp-page-subtitle">Kelola database beasiswa dan verifikasi pembayaran.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Menu Admin</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TabsList className="flex flex-col w-full h-auto bg-transparent p-2 gap-1">
                <TabsTrigger value="scholarships" className="w-full justify-start px-4 py-3 data-[state=active]:bg-slate-100 data-[state=active]:shadow-none">
                  Kelola Beasiswa
                </TabsTrigger>
                <TabsTrigger value="payments" className="w-full justify-start px-4 py-3 data-[state=active]:bg-slate-100 data-[state=active]:shadow-none">
                  Verifikasi Pembayaran
                  {payments.filter(p => p.status === 'pending').length > 0 && (
                    <Badge className="ml-auto bg-amber-500">{payments.filter(p => p.status === 'pending').length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <TabsContent value="scholarships" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{editingScholarshipId ? 'Edit Data' : 'Tambah Data'}</CardTitle>
                    <CardDescription>
                      {editingScholarshipId
                        ? 'Ubah data beasiswa yang dipilih, lalu simpan perubahan.'
                        : 'Tambahkan beasiswa baru atau isi form dari hasil ekstraksi.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingScholarshipId && (
                      <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                        <span>Sedang mengedit beasiswa yang dipilih.</span>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-amber-800 hover:bg-amber-100" onClick={resetManualForm}>
                          <X className="mr-1 h-3 w-3" /> Batal
                        </Button>
                      </div>
                    )}
                    <Tabs value={formTab} onValueChange={setFormTab}>
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                        <TabsTrigger value="ai">AI Text</TabsTrigger>
                        <TabsTrigger value="search">Web Search</TabsTrigger>
                      </TabsList>

                      <TabsContent value="search" className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Cari beasiswa di web..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                            className="h-9 text-xs"
                          />
                          <Button onClick={handleWebSearch} disabled={searching} size="icon" className="h-9 w-9 shrink-0">
                            {searching ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>
                        
                        <ScrollArea className="h-[400px] rounded-md border border-slate-100 p-2 bg-slate-50/30">
                          <div className="space-y-3">
                            {searchResults.map((res, i) => (
                              <Card key={i} className="border-slate-100 shadow-none hover:border-indigo-200 transition-colors bg-white">
                                <CardHeader className="p-3 pb-1">
                                  <CardTitle className="text-[11px] font-bold flex justify-between items-start gap-2">
                                    <span className="line-clamp-1">{res.title}</span>
                                    {res.deadline && <Badge variant="outline" className="text-[8px] h-4 shrink-0 font-normal">{res.deadline}</Badge>}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                  <p className="text-[10px] text-slate-500 line-clamp-2 mb-2 leading-relaxed opacity-80">{res.snippet}</p>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="secondary"
                                      className="h-6 text-[9px] px-2 flex-grow bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none" 
                                      onClick={() => handleWebExtract(res.sourceUrl)}
                                      disabled={extracting}
                                    >
                                      {extracting ? <Loader2 className="animate-spin mr-1 w-3 h-3" /> : <Globe className="mr-1 w-3 h-3" />}
                                      Ekstrak & Edit
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-slate-400 hover:text-slate-600" asChild>
                                      <a href={res.sourceUrl} target="_blank" rel="noopener noreferrer">Buka Link</a>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {searchResults.length === 0 && !searching && (
                              <div className="text-center py-20 text-slate-300">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-10" />
                                <p className="text-[10px]">Gunakan pencarian untuk mencari beasiswa di web</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="manual">
                      <form onSubmit={handleAddManual} className="space-y-4">
                          <div className="space-y-1">
                            <Label htmlFor="title" className="text-xs">Judul Beasiswa</Label>
                            <Input
                              id="title"
                              className="h-9"
                              value={manualData.title}
                              onChange={e => updateManualField('title', e.target.value)}
                              onBlur={() => handleManualBlur('title')}
                              placeholder="Contoh: Beasiswa LPDP 2024"
                              required
                              aria-invalid={Boolean(manualErrors.title)}
                            />
                            {manualErrors.title && <p className="text-xs text-red-600">{manualErrors.title}</p>}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="deadline" className="text-xs">Deadline</Label>
                              <Input
                                id="deadline"
                                type="date"
                                className="h-9"
                                value={manualData.deadline}
                                onChange={e => updateManualField('deadline', e.target.value)}
                                onBlur={() => handleManualBlur('deadline')}
                                required
                                aria-invalid={Boolean(manualErrors.deadline)}
                              />
                              {manualErrors.deadline && <p className="text-xs text-red-600">{manualErrors.deadline}</p>}
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="country" className="text-xs">Negara Tujuan</Label>
                              <Input id="country" className="h-9" value={manualData.country} onChange={e => updateManualField('country', e.target.value)} placeholder="Contoh: Australia" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="field" className="text-xs">Bidang Studi</Label>
                            <Input id="field" className="h-9" value={manualData.field} onChange={e => updateManualField('field', e.target.value)} placeholder="Contoh: Teknik, IT, Ekonomi" />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="description" className="text-xs">Deskripsi Ringkas</Label>
                            <Textarea id="description" className="text-xs min-h-[100px]" value={manualData.description} onChange={e => updateManualField('description', e.target.value)} placeholder="Ringkasan tentang beasiswa ini..." />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="eligibility" className="text-xs">Kriteria Kelayakan (Mendukung Markdown)</Label>
                            <Textarea id="eligibility" className="text-xs min-h-[150px]" value={manualData.eligibility} onChange={e => updateManualField('eligibility', e.target.value)} placeholder="Syarat IPK, usia, dll..." />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="benefits" className="text-xs">Besaran & Benefit</Label>
                            <Textarea id="benefits" className="text-xs min-h-[100px]" value={manualData.benefits} onChange={e => updateManualField('benefits', e.target.value)} placeholder="Cth: Biaya Semester, Uang Saku..." />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="selectionProcess" className="text-xs">Proses Seleksi</Label>
                            <Textarea id="selectionProcess" className="text-xs min-h-[100px]" value={manualData.selectionProcess} onChange={e => updateManualField('selectionProcess', e.target.value)} placeholder="Langkah-langkah pendaftaran..." />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="link" className="text-xs">Link Pendaftaran (Asli)</Label>
                            <Input
                              id="link"
                              type="url"
                              className="h-9"
                              value={manualData.link}
                              onChange={e => updateManualField('link', e.target.value)}
                              onBlur={() => handleManualBlur('link')}
                              placeholder="https://..."
                              required
                              aria-invalid={Boolean(manualErrors.link)}
                            />
                            {manualErrors.link && <p className="text-xs text-red-600">{manualErrors.link}</p>}
                          </div>

                          <Button type="submit" className="w-full bg-slate-900 font-bold shadow-lg">
                            {editingScholarshipId ? 'Simpan Perubahan' : 'Simpan ke Database'}
                          </Button>
                        </form>
                      </TabsContent>
                      <TabsContent value="ai" className="space-y-4">
                        <textarea 
                          className="min-h-[300px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                          placeholder="Tempel teks beasiswa..."
                          value={rawText}
                          onChange={e => setRawText(e.target.value)}
                        />
                        <Button onClick={handleAIExtract} disabled={extracting} className="w-full h-9 bg-emerald-600">
                          {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                          Ekstrak AI
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Database Beasiswa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto my-8 opacity-20" /> : (
                      <div className="space-y-3">
                        {scholarships.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">Belum ada beasiswa di database.</div>
                        ) : (
                          scholarships.map(s => (
                            <div key={s.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all">
                              <div className="flex-grow">
                                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DL: {s.deadline}</span>
                                  <span className="text-[10px] text-slate-300">•</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.country}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => beginEditScholarship(s)}
                                  className="text-slate-300 hover:text-indigo-600 h-8 w-8 rounded-lg hover:bg-indigo-50"
                                >
                                  <PencilLine size={14} />
                                </Button>
                                {confirmDeleteId === s.id ? (
                                  <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-[10px] h-7 font-bold"
                                    >
                                      Batal
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleDelete(s.id!)}
                                      disabled={deletingId === s.id}
                                      className="bg-red-500 hover:bg-red-600 text-white text-[10px] h-7 font-bold rounded-lg px-3"
                                    >
                                      {deletingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Hapus'}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setConfirmDeleteId(s.id!)} 
                                    className="text-slate-300 hover:text-red-500 h-8 w-8 rounded-lg hover:bg-red-50"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verifikasi Pembayaran Premium</CardTitle>
                <CardDescription>Review bukti transfer dan aktifkan status premium user.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPayments ? <Loader2 className="h-8 w-8 animate-spin mx-auto my-8 opacity-20" /> : (
                  <div className="space-y-4">
                    {payments.length === 0 ? <p className="text-center py-12 text-slate-400 text-sm italic">Belum ada permintaan pembayaran.</p> : (
                      payments.map((p) => (
                        <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white gap-4">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase text-xs">
                              {p.userName?.[0] || 'U'}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{p.userName || 'Anonymous'}</h4>
                              <p className="text-[10px] text-slate-500">{p.userEmail}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={p.status === 'pending' ? 'bg-amber-100 text-amber-700' : p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                  {p.status.toUpperCase()}
                                </Badge>
                                <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" asChild className="h-8 text-[10px] font-bold border-slate-200">
                              <a href={p.proofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                                <ExternalLink size={12} /> Bukti TF
                              </a>
                            </Button>
                            
                            {p.status === 'pending' && (
                              <>
                                <Button 
                                  onClick={() => handleRejectPayment(p)} 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  Tolak
                                </Button>
                                <Button 
                                  onClick={() => handleApprovePayment(p)} 
                                  size="sm" 
                                  className="h-8 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Approve & Upgrade
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
