import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BookOpen, Headphones, PenTool, MessageSquare, FileText, Lock, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';
import { reviewEssay } from '../services/geminiService';
import { Textarea } from '../components/ui/textarea';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

interface TestData {
  id: string;
  title: string;
  questions: Question[];
}

const whiteBtn = "bg-white text-slate-900 hover:bg-slate-50 shadow-sm";
const ghostBtn = "text-slate-500 hover:bg-slate-200";

const MOCK_TESTS: Record<string, TestData> = {
  ielts: {
    id: 'ielts',
    title: 'IELTS Reading Simulation',
    questions: [
      {
        id: 1,
        text: "What is the primary purpose of an abstract in a research paper?",
        options: [
          "To provide a list of references",
          "To summarize the entire study",
          "To introduce the researchers",
          "To display all data charts"
        ],
        correct: 1
      },
      {
        id: 2,
        text: "In IELTS Reading, 'Skimming' refers to:",
        options: [
          "Reading every word carefully",
          "Looking for specific names or dates",
          "Reading quickly to get the general idea",
          "Translating the text into your native language"
        ],
        correct: 2
      },
      {
        id: 3,
        text: "Wait... does 'Not Given' in T/F/NG questions mean the information is false?",
        options: [
          "Yes, definitely",
          "No, it means the text doesn't mention it",
          "It's the same as 'False'",
          "It's only for academic tests"
        ],
        correct: 1
      }
    ]
  },
  toefl: {
    id: 'toefl',
    title: 'TOEFL Listening Practice',
    questions: [
      {
        id: 1,
        text: "Listen to the lecture. Why does the professor mention the Renaissance?",
        options: [
          "To complain about student grades",
          "To provide a historical context for the movement",
          "To show that he is smart",
          "To suggest a field trip"
        ],
        correct: 1
      },
      {
        id: 2,
        text: "Main idea of the conversation:",
        options: [
          "Student wants to drop a class",
          "Student needs help with a lab report",
          "Professor is retiring",
          "Cafeteria food is bad"
        ],
        correct: 1
      }
    ]
  }
};

export default function TestPrep() {
  const { user, isPremium } = useAuth();
  const [activeTest, setActiveTest] = useState<TestData | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: intro, 1: questions, 2: result
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [essayContent, setEssayContent] = useState('');
  const [essayFeedback, setEssayFeedback] = useState<any | null>(null);
  const [checkingEssay, setCheckingEssay] = useState(false);
  const [essayHistory, setEssayHistory] = useState<any[]>([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<any | null>(null);
  const [activeEssayTab, setActiveEssayTab] = useState<'write' | 'history'>('write');

  // Fetch Essay History
  React.useEffect(() => {
    if (!user || currentStep !== 3) return;

    const essayResultsPath = `users/${user.uid}/essayResults`;
    const q = query(
      collection(db, essayResultsPath),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEssayHistory(history);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, essayResultsPath);
    });

    return () => unsubscribe();
  }, [user, currentStep]);

  const tests = [
    {
      id: 'ielts',
      title: "IELTS Full Simulation",
      duration: "2h 45m",
      questions: "4 Sections",
      type: "Academic",
      icon: FileText,
      premium: false
    },
    {
      id: 'toefl',
      title: "TOEFL iBT Practice",
      duration: "3h",
      questions: "Reading & Listening",
      type: "Internet Based",
      icon: Headphones,
      premium: false
    },
    {
      id: 'essay',
      title: "Essay Review AI",
      duration: "Instant",
      questions: "Unlimited",
      type: "Writing",
      icon: PenTool,
      premium: true
    }
  ];

  const handleStartTest = (testId: string) => {
    if (testId === 'essay') {
      setCurrentStep(3); // 3: essay mode
      return;
    }
    if (MOCK_TESTS[testId]) {
      setActiveTest(MOCK_TESTS[testId]);
      setCurrentStep(1);
      setCurrentQuestionIdx(0);
      setAnswers([]);
    }
  };

  const handleAnswerSelect = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleNext = async () => {
    if (currentQuestionIdx < activeTest!.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Calculate score
      let finalScore = 0;
      activeTest!.questions.forEach((q, i) => {
        if (answers[i] === q.correct) finalScore++;
      });
      
      const percentage = Math.round((finalScore / activeTest!.questions.length) * 100);
      setScore(finalScore);
      
      // Save to Firebase
      if (user) {
        const resultsPath = `users/${user.uid}/testResults`;
        try {
          await addDoc(collection(db, resultsPath), {
            testId: activeTest!.id,
            testTitle: activeTest!.title,
            score: finalScore,
            totalQuestions: activeTest!.questions.length,
            percentage: percentage,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, resultsPath);
        }
      }
      
      setCurrentStep(2);
    }
  };

  const handleCheckEssay = async () => {
    if (!essayContent.trim()) {
      toast.error("Silakan masukkan esai Anda terlebih dahulu.");
      return;
    }
    
    setCheckingEssay(true);
    try {
      const feedback = await reviewEssay(essayContent);
      setEssayFeedback(feedback);

      // Save essay analysis to Firebase
      if (user) {
        const essayResultsPath = `users/${user.uid}/essayResults`;
        try {
          await addDoc(collection(db, essayResultsPath), {
            essayContent: essayContent,
            overallScore: feedback.overallScore,
            feedback: feedback.feedback,
            strengths: feedback.strengths,
            weaknesses: feedback.weaknesses,
            suggestions: feedback.suggestions,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, essayResultsPath);
        }
      }
    } catch (error) {
      console.error("Essay review error:", error);
      toast.error("Gagal meninjau esai. Silakan coba lagi.");
    } finally {
      setCheckingEssay(false);
    }
  };

  if (currentStep === 3) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => {
            setCurrentStep(0);
            setViewingHistoryItem(null);
            setEssayFeedback(null);
          }} className="gap-2 text-slate-500">
            <ArrowLeft size={16} /> Kembali ke Menu
          </Button>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <Button 
              variant={activeEssayTab === 'write' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => {
                setActiveEssayTab('write');
                setViewingHistoryItem(null);
              }}
              className={`rounded-lg px-6 font-bold ${activeEssayTab === 'write' ? 'bg-white shadow-sm' : ''}`}
            >
              Cek Esai
            </Button>
            <Button 
              variant={activeEssayTab === 'history' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setActiveEssayTab('history')}
              className={`rounded-lg px-6 font-bold ${activeEssayTab === 'history' ? 'bg-white shadow-sm' : ''}`}
            >
              Riwayat ({essayHistory.length})
            </Button>
          </div>
        </div>

        {activeEssayTab === 'write' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <PenTool className="text-slate-900" size={20} />
                      Input Esai Beasiswa
                    </CardTitle>
                    <CardDescription>
                      Tempelkan draf esai Anda di sini untuk mendapatkan feedback dari Gemini AI.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Textarea 
                      placeholder="Tulis atau tempelkan esai Anda di sini..."
                      className="min-h-[400px] rounded-2xl bg-white border-slate-200 focus:ring-slate-900/10 resize-none font-medium leading-relaxed"
                      value={essayContent}
                      onChange={(e) => setEssayContent(e.target.value)}
                    />
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
                    <Button 
                      onClick={handleCheckEssay} 
                      disabled={checkingEssay || !essayContent.trim()}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-12 font-bold transition-all shadow-lg shadow-slate-200"
                    >
                      {checkingEssay ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sedang Menganalisis...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Dapatkan Feedback AI
                        </>
                      )}
                    </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-6">
              {essayFeedback ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-6">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-emerald-900">
                          <CheckCircle2 size={20} />
                          Hasil Analisis AI
                        </CardTitle>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          Skor: {essayFeedback.overallScore}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      <div>
                        <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-3">Ringkasan</h4>
                        <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {essayFeedback.feedback}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Kelebihan</h4>
                          <ul className="space-y-2">
                            {(essayFeedback.strengths || []).map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Kekurangan</h4>
                          <ul className="space-y-2">
                            {(essayFeedback.weaknesses || []).map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-3">Saran Pengembangan</h4>
                        <ul className="space-y-2">
                          {(essayFeedback.suggestions || []).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-bold text-indigo-900">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black shadow-sm shrink-0">
                                {i + 1}
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Sparkles size={32} className="text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Belum Ada Analisis</h3>
                  <p className="text-slate-400 max-w-xs mx-auto mt-2 font-medium">Input esai Anda dan tekan tombol analisis untuk mendapatkan feedback instan.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-900 px-2 flex items-center gap-2">
                <RotateCcw size={18} className="text-slate-400" />
                Semua Analisis
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2">
                {essayHistory.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400 italic">Belum ada riwayat</p>
                  </div>
                ) : (
                  essayHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setViewingHistoryItem(item)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        viewingHistoryItem?.id === item.id 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg' 
                        : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={`${viewingHistoryItem?.id === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          Skor: {item.overallScore || 0}
                        </Badge>
                        <span className={`text-[10px] font-bold ${viewingHistoryItem?.id === item.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          {item.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className={`text-xs font-bold line-clamp-2 leading-relaxed ${viewingHistoryItem?.id === item.id ? 'text-white' : 'text-slate-900'}`}>
                        {item.essayContent}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {viewingHistoryItem ? (
                <motion.div 
                  key={viewingHistoryItem.id}
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Detail Riwayat Analisis
                          </CardTitle>
                          <CardDescription>
                            Dianalisis pada {viewingHistoryItem.createdAt?.toDate().toLocaleString('id-ID')}
                          </CardDescription>
                        </div>
                        <Badge className="bg-slate-900 text-white h-8 px-4 text-base rounded-full">
                          Skor: {viewingHistoryItem.overallScore}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                       <div>
                        <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-3">Teks Esai</h4>
                        <div className="text-slate-600 text-sm font-medium leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-[300px] overflow-y-auto italic">
                          "{viewingHistoryItem.essayContent}"
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-3">Feedback AI</h4>
                        <p className="text-slate-700 font-bold leading-relaxed">
                          {viewingHistoryItem.feedback}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Kelebihan</h4>
                          <ul className="space-y-2">
                            {(viewingHistoryItem.strengths || []).map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Kekurangan</h4>
                          <ul className="space-y-2">
                            {(viewingHistoryItem.weaknesses || []).map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-3">Saran Pengembangan</h4>
                        <ul className="space-y-2">
                          {(viewingHistoryItem.suggestions || []).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-bold text-indigo-900">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black shadow-sm shrink-0">
                                {i + 1}
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <FileText size={32} className="text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Pilih dari Daftar</h3>
                  <p className="text-slate-400 max-w-xs mx-auto mt-2 font-medium">Klik salah satu esai di samping untuk melihat detail feedback AI.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTest && currentStep === 1) {
    const question = activeTest.questions[currentQuestionIdx];
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setActiveTest(null)} className="gap-2 text-slate-500">
            <ArrowLeft size={16} /> Keluar
          </Button>
          <div className="text-xs font-bold text-slate-400">
            SOAL {currentQuestionIdx + 1} DARI {activeTest.questions.length}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8 leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswerSelect(i)}
                className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium ${
                  answers[currentQuestionIdx] === i 
                    ? 'border-slate-900 bg-slate-900 text-white' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                   <span>{opt}</span>
                   {answers[currentQuestionIdx] === i && <CheckCircle2 size={16} />}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 flex justify-between">
            <Button 
               variant="outline" 
               disabled={currentQuestionIdx === 0}
               onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
               className="rounded-xl px-6"
            >
              <ChevronLeft className="mr-2" size={16} /> Kembali
            </Button>
            <Button 
               disabled={answers[currentQuestionIdx] === undefined}
               onClick={handleNext}
               className="bg-slate-900 text-white rounded-xl px-8"
            >
              {currentQuestionIdx === activeTest.questions.length - 1 ? "Selesai" : "Lanjut"} 
              <ChevronRight className="ml-2" size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTest && currentStep === 2) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Simulasi Selesai!</h2>
          <p className="text-slate-500 mb-8">Hasil performa simulasi beasiswa Anda.</p>

          <Card className="border-slate-100 shadow-sm rounded-3xl mb-8 overflow-hidden">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skor Akhir</span>
                <Badge className="bg-emerald-100 text-emerald-700">{score}/{activeTest.questions.length}</Badge>
             </div>
             <CardContent className="p-8">
                <div className="text-5xl font-black text-slate-900 mb-2">
                   {Math.round((score / activeTest.questions.length) * 100)}%
                </div>
                <p className="text-xs text-slate-400 font-medium italic">"Terus berlatih untuk mencapai target IELTS 7.5+"</p>
             </CardContent>
          </Card>

          <div className="flex gap-4">
             <Button onClick={() => handleStartTest(activeTest.id)} variant="outline" className="flex-1 rounded-xl gap-2 font-bold py-6">
                <RotateCcw size={16} /> Ulangi
             </Button>
             <Button onClick={() => setActiveTest(null)} className="flex-1 bg-slate-900 text-white rounded-xl font-bold py-6">
                Dashboard Tes
             </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Test Preparation Hub</h1>
          <p className="text-slate-500 mt-1">Siapkan diri Anda untuk seleksi beasiswa dengan simulasi dan AI Coaching.</p>
        </div>
        {!isPremium && (
          <Button className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 gap-2 font-bold px-6">
            <Sparkles size={16} />
            Unlock All AI Features
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tests.map((test, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="h-full border-slate-200 hover:border-slate-300 transition-all group rounded-[24px] overflow-hidden bg-white">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2.5 rounded-xl ${test.premium ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>
                    <test.icon size={20} />
                  </div>
                  {test.premium && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] font-bold border-amber-200">PREMIUM</Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-bold group-hover:text-slate-900 transition-colors tracking-tight">{test.title}</CardTitle>
                <CardDescription className="text-xs font-medium">{test.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                  <BookOpen size={14} />
                  {test.questions}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                  <FileText size={14} />
                  {test.duration}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleStartTest(test.id)}
                  disabled={test.premium && !isPremium} 
                  className={`w-full font-bold text-xs h-10 rounded-xl transition-all ${test.premium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {test.premium && !isPremium ? (
                    <span className="flex items-center gap-2"><Lock size={12} /> Ambil Premium</span>
                  ) : (
                    "Mulai simulasi"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
