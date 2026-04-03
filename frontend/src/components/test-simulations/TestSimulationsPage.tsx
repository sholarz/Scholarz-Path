import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../Header';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Clock, BookOpen, Target, Crown, Lock, Search, Filter } from 'lucide-react';
import { PremiumFeatureLock } from '../PremiumFeatureLock';
import { getTests, type TestListItem } from '../../lib/test-prep-api';
import { toast } from 'sonner';

export function TestSimulationsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const isPremium = user?.role === 'premium' || user?.role === 'admin';

  useEffect(() => {
    const loadTests = async () => {
      setIsLoading(true);
      try {
        const payload = await getTests();
        setTests(payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load test simulations';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadTests();
  }, []);

  const filteredTests = useMemo(() => tests.filter(test => {
    const matchesSearch = !searchQuery || 
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || test.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  }), [tests, searchQuery, categoryFilter, difficultyFilter]);

  const freeTests = useMemo(() => tests.filter(test => !test.isPremium), [tests]);
  const premiumTests = useMemo(() => tests.filter(test => test.isPremium), [tests]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      english: '🇬🇧',
      math: '🔢',
      'logical-reasoning': '🧠',
      'general-knowledge': '📚',
      indonesian: '🇮🇩',
    };
    return icons[category] || '📝';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Test Simulations</h1>
          <p className="text-muted-foreground">
            Practice with realistic scholarship exam simulations and improve your test-taking skills
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Tests</p>
                  <p className="text-3xl font-bold">{tests.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Free Access</p>
                  <p className="text-3xl font-bold">{freeTests.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Premium Tests</p>
                  <p className="text-3xl font-bold">{premiumTests.length}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Crown className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tests by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="logical-reasoning">Logical Reasoning</SelectItem>
                    <SelectItem value="general-knowledge">General Knowledge</SelectItem>
                    <SelectItem value="indonesian">Bahasa Indonesia</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading test simulations...
            </CardContent>
          </Card>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const TestCard = (
              <Card key={test.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-2xl">{getCategoryIcon(test.category)}</div>
                    {test.isPremium && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{test.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {test.totalQuestions} Questions
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      <span>Passing Score: {test.passingScore}%</span>
                    </div>
                  </div>

                  <Link to={`/tests/${test.id}`} className="block">
                    <Button className="w-full gap-2">
                      {(test.isLocked || (test.isPremium && !isPremium)) && <Lock className="w-4 h-4" />}
                      Start Test
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );

            if (test.isLocked || (test.isPremium && !isPremium)) {
              return (
                <PremiumFeatureLock
                  key={test.id}
                  feature="all test simulations"
                  description="Get unlimited access to all premium test simulations to prepare for your scholarship exams."
                >
                  {TestCard}
                </PremiumFeatureLock>
              );
            }

            return TestCard;
          })}
        </div>
        )}

        {!isLoading && filteredTests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No tests found matching your criteria. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
