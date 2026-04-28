import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { GraduationCap, Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const PASSWORD_REQUIREMENTS = [
  { label: "Minimal 8 karakter", test: (value: string) => value.length >= 8 },
  { label: "Memiliki huruf besar (A-Z)", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Memiliki huruf kecil (a-z)", test: (value: string) => /[a-z]/.test(value) },
  { label: "Memiliki angka (0-9)", test: (value: string) => /\d/.test(value) },
];

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Format email tidak valid.",
  "auth/user-not-found": "Akun tidak ditemukan. Coba daftar dulu.",
  "auth/wrong-password": "Password salah. Coba lagi.",
  "auth/invalid-credential": "Email atau password salah.",
  "auth/email-already-in-use": "Email sudah terdaftar. Gunakan email lain.",
  "auth/weak-password": "Password terlalu lemah. Ikuti syarat password.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat.",
};

function getAuthErrorMessage(error: any, fallbackMessage: string) {
  const errorCode = error?.code || "";
  return AUTH_ERROR_MESSAGES[errorCode] || fallbackMessage;
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithEmail, signUp, resetPassword, user, logout, checkVerification, resendVerification } = useAuth();

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const redirectTarget = (location.state as any)?.from?.pathname || "/dashboard";

  // If user is logged in but email not verified, show verification message
  const needsVerification = user && !user.emailVerified;

  const handleRefreshStatus = async () => {
    setVerifying(true);
    try {
      const isVerified = await checkVerification();
      if (isVerified) {
        toast.success("Email berhasil diverifikasi!");
        navigate("/dashboard");
      } else {
        toast.info("Email belum diverifikasi. Silakan cek inbox Anda.");
      }
    } catch (error) {
      toast.error("Gagal memperbarui status");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success("Email verifikasi telah dikirim ulang!");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim ulang email");
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
      navigate(redirectTarget);
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error, "Gagal masuk dengan Google"));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate(redirectTarget);
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error, "Email atau password salah"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const unmet = PASSWORD_REQUIREMENTS.filter((rule) => !rule.test(password));
    if (unmet.length > 0) {
      toast.error(`Password belum memenuhi syarat: ${unmet[0].label}`);
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      toast.success("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error, "Gagal mendaftar"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setIsEmailSent(true);
      toast.success("Email pemulihan kata sandi telah dikirim");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim email pemulihan");
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
          <CardHeader className="text-center pt-10 pb-6">
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6">
              <Mail size={32} />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Verifikasi Email Anda</CardTitle>
            <CardDescription className="text-slate-500 mt-2">
              Kami telah mengirimkan tautan verifikasi ke <strong>{user.email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-4">
            <p className="text-sm text-center text-slate-600 leading-relaxed">Tolong cek folder inbox atau spam Anda. Anda perlu memverifikasi email sebelum dapat mengakses fitur lengkap ScholarzPath.</p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-500">Belum menerima email? Tunggu beberapa menit atau klik tombol di bawah untuk kirim ulang.</div>
          </CardContent>
          <CardFooter className="px-8 pb-10 flex flex-col gap-3">
            <Button variant="outline" className="w-full rounded-xl border-slate-200 h-11 font-bold bg-slate-900 text-white hover:bg-slate-800" onClick={handleRefreshStatus} disabled={verifying}>
              {verifying ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              Saya Sudah Memverifikasi
            </Button>
            <Button variant="ghost" className="w-full rounded-xl text-slate-900 font-bold hover:bg-slate-50" onClick={handleResendEmail} disabled={resending}>
              {resending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Kirim Ulang Email Verifikasi
            </Button>
            <Button variant="ghost" className="w-full rounded-xl text-slate-400 font-bold hover:text-slate-600" onClick={logout}>
              Keluar / Gunakan Akun Lain
            </Button>
            <Button variant="ghost" className="w-full rounded-xl text-slate-400 font-bold hover:text-slate-900" onClick={() => navigate("/")}>
              Kembali ke Beranda
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {/* Decorative elements */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-slate-100 rounded-full blur-2xl opacity-60"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-slate-100 rounded-full blur-3xl opacity-60"></div>

        <Card className="relative rounded-[32px] border-slate-100 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pt-8 pb-2">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-900 font-bold text-2xl mb-6 mx-auto group">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110">
                <GraduationCap size={22} />
              </div>
              <span>ScholarzPath</span>
            </Link>

            <AnimatePresence mode="wait">
              {isForgotPassword ? (
                <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Lupa Kata Sandi?</CardTitle>
                  <CardDescription className="text-slate-500 mt-1">Masukkan email Anda untuk pemulihan</CardDescription>
                </motion.div>
              ) : (
                <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Selamat Datang</CardTitle>
                  <CardDescription className="text-slate-500 mt-1">Masuk untuk melanjutkan perjalanan beasiswa Anda</CardDescription>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="p-8">
            {isForgotPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="Email Anda"
                      className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {isEmailSent ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs font-medium text-emerald-800">Tautan pemulihan telah dikirim! Silakan periksa kotak masuk email Anda.</p>
                  </div>
                ) : (
                  <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Kirim Tautan"}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm font-bold text-slate-400 hover:text-slate-900"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsEmailSent(false);
                  }}
                >
                  Kembali ke Login
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 mb-8">
                  <TabsTrigger value="login" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    LOGIN
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    REGISTER
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="Email"
                          className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="Password"
                          className="pl-10 pr-11 h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setShowPasswordHint(true)}
                          onBlur={() => setShowPasswordHint(false)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                          aria-label={showLoginPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {showPasswordHint && (
                          <div className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Syarat Password</p>
                            <div className="space-y-1.5">
                              {PASSWORD_REQUIREMENTS.map((rule) => {
                                const passed = rule.test(password);
                                return (
                                  <div key={rule.label} className={`text-[11px] font-semibold flex items-center gap-2 ${passed ? "text-emerald-600" : "text-slate-500"}`}>
                                    {passed ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                    <span>{rule.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs font-bold text-slate-900 hover:underline inline-block">
                      Lupa kata sandi?
                    </button>

                    <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Nama Lengkap"
                          className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="Email"
                          className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Password"
                          className="pl-10 pr-11 h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                          aria-label={showRegisterPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Buat Akun"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            {!isForgotPassword && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-white px-3 text-slate-300">Atau masuk dengan</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3" onClick={handleGoogleSignIn} disabled={loading}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-xs font-medium text-slate-400">
          Dengan melanjutkan, Anda menyetujui Ketentuan Layanan <br /> dan Kebijakan Privasi ScholarzPath Indonesia.
        </p>
      </div>
    </div>
  );
}
