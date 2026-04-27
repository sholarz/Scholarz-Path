import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { collection, addDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Check, CreditCard, Clock, ShieldCheck, Zap, ArrowLeft, Upload, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export default function Premium() {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    async function checkStatus() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'payments'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.status === 'pending') {
            setPendingRequest(data);
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, [user]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!proofUrl.trim()) return toast.error("Masukkan URL bukti transfer");

    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        proofUrl,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success("Bukti pembayaran berhasil dikirim! Mohon tunggu verifikasi admin.");
      setPendingRequest({ status: 'pending' });
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Gagal mengirim bukti pembayaran");
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="sp-page-container max-w-2xl text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap size={40} fill="currentColor" />
        </div>
        <h1 className="sp-page-title mb-4">Anda adalah Member Premium!</h1>
        <p className="text-slate-500 mb-8 font-medium">Terima kasih telah mendukung ScholarPath. Nikmati akses tak terbatas ke semua fitur AI kami.</p>
        <Button asChild className="rounded-xl px-8 bg-slate-900 h-12">
          <Link to="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="sp-page-container max-w-4xl">
      <div className="sp-page-header flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="sp-page-title">Upgrade ke Premium</h1>
            <p className="sp-page-subtitle">Buka potensi penuh Anda dengan dukungan AI ScholarPath (IDR 49.000 / bln).</p>
          </div>
        </div>
        {pendingRequest && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
            <Clock size={12} />
            Verifikasi Pending
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap size={18} fill="currentColor" />
                Fitur Premium
              </CardTitle>
              <CardDescription className="text-slate-300">Dapatkan keuntungan eksklusif untuk persiapan beasiswa Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                "Unlimited Rekomendasi AI yang Akurat",
                "Automated Roadmap & Calendar Sync",
                "Akses Simulasi Test IELTS/TOEFL Tak Terbatas",
                "Prioritas Review Esai oleh AI",
                "Simulasi Interview Beasiswa dengan AI",
                "Badge Premium di Profil Forum"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm border-amber-100">
            <CardContent className="p-6 bg-amber-50/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">Informasi Pembayaran</h4>
                  <p className="text-xs text-amber-800/70 leading-relaxed">
                    Kirimkan pembayaran senilai <strong>IDR 49.000</strong> ke rekening berikut:<br/>
                    <strong>Bank Central Asia (BCA): 1234567890</strong><br/>
                    A/N: ScholarPath Indonesia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {pendingRequest ? (
            <Card className="border-slate-100 shadow-sm overflow-hidden h-full">
              <CardHeader className="bg-slate-50 border-b border-white">
                <CardTitle className="text-lg">Status Permintaan</CardTitle>
                <CardDescription>Kami sedang meninjau pembayaran Anda.</CardDescription>
              </CardHeader>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Clock size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Mohon Tunggu Sebentar</h3>
                <p className="text-sm text-slate-500 max-w-xs font-medium">
                  Bukti pembayaran Anda telah kami terima. Admin akan melakukan verifikasi dalam waktu maksimal 1x24 jam.
                </p>
                <Button asChild variant="outline" className="mt-8 rounded-xl px-8 border-slate-200">
                  <Link to="/dashboard">Kembali ke Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-100 shadow-sm overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                    <CreditCard size={18} />
                  </div>
                  <CardTitle className="text-lg">Konfirmasi Pembayaran</CardTitle>
                </div>
                <CardDescription>Lampirkan bukti transfer Anda di sini.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmitPayment} className="space-y-6">
                  <div className="space-y-4 p-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Upload Bukti Transfer</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Untuk sementara, masukkan URL gambar bukti transfer Anda (Hosting di GDrive/Imgur).</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof">URL Bukti Transfer</Label>
                    <Input 
                      id="proof" 
                      placeholder="https://..." 
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="rounded-xl border-slate-200 focus:ring-slate-900" 
                      required
                    />
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      Transaksi aman & dienkripsi. Pembayaran manual untuk transparansi 100%.
                    </div>
                    <Button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 h-12 font-bold shadow-lg shadow-slate-200">
                      {loading ? "Mengirim..." : "Konfirmasi & Kirim Bukti"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
