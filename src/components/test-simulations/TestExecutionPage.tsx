import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Header } from '../Header';
import { getTestById, calculateScore } from '../../lib/test-simulation-data';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TestState = 'instructions' | 'inprogress' | 'completed';

export function TestExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const test = id ? getTestById(id) : undefined;

  const [testState, setTestState] = useState<TestState>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (test && testState === 'in-progress') {
      setTimeRemaining(test.duration * 60); // Convert minutes to seconds
    }
  }, [test, testState]);

  useEffect(() => {
    let timer: any;
    if (testState === 'in-progress' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleFinishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testState, timeRemaining]);

  if (!test) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Test not found</p>
              <Button onClick={() => navigate('/test-simulations')}>
                Back to Tests
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isPremium = user?.role === 'premium' || user?.role === 'admin';
  
  if (test.isPremium && !isPremium) {
    navigate('/test-simulations');
    return null;
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestState('in-progress');
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishTest = () => {
    const testResult = calculateScore(answers, test);
    setResult(testResult);
    setTestState('completed');
  };

  if (testState === 'instructions') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>{test.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{test.description}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="text-2xl font-bold">{test.duration} minutes</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Questions</p>
                  <p className="text-2xl font-bold">{test.totalQuestions}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Passing Score</p>
                  <p className="text-2xl font-bold">{test.passingScore}%</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                  <p className="text-2xl font-bold capitalize">{test.difficulty}</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Answer all questions to the best of your ability</li>
                  <li>You can navigate between questions using Next/Previous buttons</li>
                  <li>The test will automatically submit when time runs out</li>
                  <li>Review your answers before submitting</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/test-simulations')} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleStartTest} className="flex-1 gap-2">
                  <Clock className="w-4 h-4" />
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (testState === 'completed' && result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="text-center pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="flex justify-center mb-4"
                >
                  {result.passed ? (
                    <div className="bg-green-100 p-6 rounded-full">
                      <Trophy className="w-16 h-16 text-green-600" />
                    </div>
                  ) : (
                    <div className="bg-orange-100 p-6 rounded-full">
                      <AlertTriangle className="w-16 h-16 text-orange-600" />
                    </div>
                  )}
                </motion.div>
                <CardTitle className="text-3xl mb-2">
                  {result.passed ? 'Congratulations! 🎉' : 'Keep Practicing!'}
                </CardTitle>
                <p className="text-muted-foreground">
                  {result.passed 
                    ? 'You passed the test! Great job!' 
                    : 'You didn\'t pass this time, but don\'t give up!'}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your Score</p>
                  <p className="text-6xl font-bold mb-4">{result.score}%</p>
                  <Progress value={result.score} className="h-3" />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Correct Answers</p>
                    <p className="text-3xl font-bold text-green-600">{result.correctAnswers}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
                    <p className="text-3xl font-bold">{result.totalQuestions}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Passing Score</p>
                    <p className="text-3xl font-bold">{test.passingScore}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Review Answers</h4>
                  {test.questions.map((question, index) => {
                    const userAnswer = answers[question.id];
                    const isCorrect = userAnswer === question.correctAnswer || 
                      (typeof userAnswer === 'string' && userAnswer === String(question.correctAnswer));

                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <Badge variant={isCorrect ? 'default' : 'destructive'} className="shrink-0">
                            Question {index + 1}
                          </Badge>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                          )}
                        </div>
                        <p className="font-medium mb-2">{question.question}</p>
                        {question.options && (
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                {question.options[Number(userAnswer)] || 'Not answered'}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-muted-foreground">
                                Correct answer: <span className="text-green-600">
                                  {question.options[Number(question.correctAnswer)]}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                            💡 {question.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => navigate('/test-simulations')} className="flex-1">
                    Back to Tests
                  </Button>
                  <Button onClick={() => window.location.reload()} className="flex-1">
                    Retake Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  // In-progress state
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Timer Bar */}
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge>Question {currentQuestionIndex + 1}</Badge>
                  <Badge variant="outline">{currentQuestion.points} points</Badge>
                </div>
                <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString()}
                    onValueChange={(value) => handleAnswer(parseInt(value))}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {currentQuestionIndex === test.questions.length - 1 ? (
                    <Button onClick={handleFinishTest} className="flex-1">
                      Finish Test
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="flex-1 gap-2">
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Question Navigation */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Quick Navigation</p>
                  <div className="flex flex-wrap gap-2">
                    {test.questions.map((_, index) => (
                      <Button
                        key={index}
                        variant={index === currentQuestionIndex ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={
                          answers[test.questions[index].id] !== undefined
                            ? 'bg-green-100 hover:bg-green-200 text-green-900 border-green-300'
                            : ''
                        }
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
