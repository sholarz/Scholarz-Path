import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc, collection, query, getDocs, where, limit, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { User as UserIcon, GraduationCap, BookOpen, Globe, Target, Clock, CheckCircle2, AlertCircle, Loader2, FileText, ArrowRight, Zap, Lock, Bell, Bookmark, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, profile, isPremium } = useAuth();
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [stats, setStats] = useState({
    bookmarks: 0,
    deadlines: 0,
    notifications: 0,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Fetch test history
        const testQ = query(collection(db, "users", user.uid, "testResults"), orderBy("createdAt", "desc"), limit(5));
        const testSnapshot = await getDocs(testQ);
        setTestHistory(testSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        // Fetch counts
        const bookmarkSnapshot = await getDocs(collection(db, "users", user.uid, "bookmarks"));
        const notificationQ = query(collection(db, "notifications"), where("userId", "==", user.uid), where("read", "==", false));
        const notificationSnapshot = await getDocs(notificationQ);

        // Calculate upcoming deadlines (next 30 days)
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        const scholarshipsQ = query(collection(db, "scholarships"), limit(50));
        const scholarshipsSnapshot = await getDocs(scholarshipsQ);
        const upcomingCount = scholarshipsSnapshot.docs.filter((doc) => {
          const deadline = new Date(doc.data().deadline);
          return deadline > now && deadline < thirtyDaysLater;
        }).length;

        setStats({
          bookmarks: bookmarkSnapshot.size,
          notifications: notificationSnapshot.size,
          deadlines: upcomingCount,
        });

        // Fetch recent forum posts
        const forumQ = query(collection(db, "forumPosts"), orderBy("createdAt", "desc"), limit(3));
        const forumSnapshot = await getDocs(forumQ);
        setRecentPosts(forumSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchData();
  }, [user]);

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = ["displayName", "gpa", "field", "institution", "targetDegree", "experience"];
    const completed = fields.filter((f) => !!profile[f] && profile[f] !== "0.0" && profile[f] !== 0).length;
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <div className="sp-page-container space-y-8">
      {/* Welcome Header */}
      <div className="sp-page-header">
        <h1 className="sp-page-title">Welcome back, {user?.displayName || "User"}!</h1>
        <p className="sp-page-subtitle text-sm">Here's an overview of your scholarship journey</p>
      </div>

      {/* Premium Upgrade Banner */}
      {!isPremium && (
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
              <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-1">Unlock Premium Features</h3>
              <p className="text-xs text-amber-800/70 leading-relaxed mb-3">Get unlimited bookmarks, automated preparation timeline, and more!</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[11px] text-amber-800/60 font-medium">
                  <Lock size={12} />
                  Bookmark limit: {isPremium ? "Unlimited" : "0/3"}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-800/60 font-medium">
                  <Lock size={12} />
                  Preparation Timeline locked
                </div>
              </div>
            </div>
          </div>
          <Button asChild className="bg-amber-500 text-white hover:bg-amber-600 font-bold px-8 rounded-xl shadow-md shadow-amber-100 self-start md:self-center">
            <Link to="/premium">
              <Zap className="mr-2 h-4 w-4 fill-white" /> Upgrade
            </Link>
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Top Matches",
            value: profile?.matchCount || "0",
            icon: Target,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Bookmarked",
            value: stats.bookmarks.toString(),
            subLabel: isPremium ? "Premium • tanpa batas" : `Gratis • ${stats.bookmarks}/3`,
            icon: Bookmark,
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
          {
            label: "Upcoming Deadlines",
            value: stats.deadlines.toString(),
            icon: CalendarIcon,
            color: "text-green-500",
            bg: "bg-green-50",
          },
          {
            label: "Active Notifications",
            value: stats.notifications.toString(),
            icon: Bell,
            color: "text-yellow-500",
            bg: "bg-yellow-50",
          },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              {stat.subLabel && <p className="mt-1 text-[10px] font-semibold text-slate-400">{stat.subLabel}</p>}
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 pt-4">
        {/* Profile Completion Form Section */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-50">
              <CardTitle className="text-sm font-bold">Test Performance</CardTitle>
              <CardDescription className="text-xs">Ringkasan hasil test terbaru</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : testHistory.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {testHistory.map((result) => (
                    <Link key={result.id} to={`/test-prep?test=${result.testId || ""}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{result.testTitle}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{result.createdAt?.toDate ? result.createdAt.toDate().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Baru saja"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-xs">
                          {result.percentage}%
                        </Badge>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          {result.score}/{result.totalQuestions} Benar
                        </p>
                      </div>
                    </Link>
                  ))}
                  <div className="p-4 text-center">
                    <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold text-slate-400 hover:text-slate-900">
                      <Link to="/test-prep">Lihat Semua Tes &rarr;</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 opacity-20" />
                  <p className="text-xs font-medium">Belum ada riwayat test.</p>
                  <Button variant="outline" size="sm" asChild className="rounded-lg text-[10px] h-8 px-4 mt-2">
                    <Link to="/test-prep">Mulai Tes Pertama</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Profile Completion Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-bold mb-4">Kelengkapan Profil</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500">{calculateCompletion()}% Selesai</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-900" />
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">AI Ready</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${calculateCompletion()}%` }} className="bg-slate-900 h-full rounded-full" />
            </div>

            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 border border-slate-100 rounded-xl transition-all ${profile?.institution ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50/50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${profile?.institution ? "bg-emerald-100" : "bg-slate-200"}`}>
                    <GraduationCap className={`w-3 h-3 ${profile?.institution ? "text-emerald-700" : "text-slate-500"}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{profile?.institution || "Institusi belum diisi"}</span>
                </div>
                {profile?.institution && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <div className={`flex items-center justify-between p-3 border border-slate-100 rounded-xl transition-all ${profile?.englishScore ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50/50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${profile?.englishScore ? "bg-emerald-100" : "bg-slate-200"}`}>
                    <Globe className={`w-3 h-3 ${profile?.englishScore ? "text-emerald-700" : "text-slate-500"}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{profile?.englishScore || "Skor Bahasa (IELTS/TOEFL)"}</span>
                </div>
                {profile?.englishScore && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </div>

            <Button asChild variant="outline" className="w-full py-2.5 mt-6 text-xs font-bold border-slate-200 text-slate-800 bg-white rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Link to="/profile">
                <ArrowRight className="w-3.5 h-3.5" />
                Optimalkan Detail Profil
              </Link>
            </Button>
          </div>

          {/* Quick News / Forum Preview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold mb-4">Diskusi Hangat</h3>
            <div className="space-y-4">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <Link key={post.id} to="/forum" className="flex gap-3 pb-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors rounded-lg p-1 group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-700 uppercase group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {post.userName?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold group-hover:text-slate-900 line-clamp-1">{post.content}</p>
                      <p className="text-[10px] text-slate-400">
                        {post.userName} • {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : "Baru saja"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-[10px] text-slate-500 italic">Belum ada diskusi terbaru.</p>
              )}
              <Button asChild variant="ghost" className="w-full text-[10px] text-slate-500 hover:text-slate-900">
                <Link to="/forum">Buka Forum Komunitas &rarr;</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
