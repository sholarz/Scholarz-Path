import React from 'react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Clock, 
  Globe, 
  Search, 
  Bookmark, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user, signIn } = useAuth();

  const features = [
    {
      title: "Curated Scholarships",
      desc: "Access scholarships to top universities in Indonesia, especially Java region",
      icon: Search,
    },
    {
      title: "Scholarship Calendar",
      desc: "Never miss a deadline with our comprehensive calendar view",
      icon: Calendar,
    },
    {
      title: "Preparation Timeline",
      desc: "Automated timeline breaks down all tasks needed before deadlines",
      icon: Clock,
    },
    {
      title: "Bookmark & Track",
      desc: "Save and organize scholarships you want to apply for",
      icon: Bookmark,
    },
    {
      title: "Verified Information",
      desc: "All scholarships are verified and regularly updated",
      icon: CheckCircle2,
    },
    {
      title: "Global Opportunities",
      desc: "Find international and domestic scholarships specifically for Indonesian students",
      icon: Globe,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6 flex w-fit items-center space-x-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
              <GraduationCap className="h-4 w-4 text-slate-900" />
              <span>Jalur Masa Depan Pendidikan Indonesia</span>
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-7xl">
              Beasiswa Sempurna untuk <br className="hidden sm:block" />
              <span className="text-slate-500 italic">Masa Depan Anda</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-slate-500 leading-relaxed">
              ScholarPath menggunakan AI untuk mencocokkan Anda dengan beasiswa terbaik di Indonesia. Mulai sekarang dan pantau setiap langkah pendaftaran Anda dengan mudah.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              {user ? (
                <Button asChild size="lg" className="h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-200 transition-all">
                  <Link to="/dashboard">Buka Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-200 transition-all">
                  <Link to="/auth">Mulai Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="h-12 px-8 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <Link to="/scholarships">Cari Beasiswa</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 -z-10 h-full w-full opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-slate-200 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-slate-200 blur-3xl"></div>
        </div>
      </section>

      {/* Screenshot Section: Everything You Need to Succeed */}
      <section className="bg-slate-50/50 py-24 border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">Everything You Need to Succeed</h2>
            <p className="mt-4 text-slate-500 font-medium">ScholarPath provides all the tools you need to find, track, and apply for scholarships efficiently.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:text-slate-900 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-slate-800 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Stats Section */}
    </div>
  );
}
