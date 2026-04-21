import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useForum } from '../../lib/forum-context';
import { useAuth } from '../../lib/auth-context';
import { Plus, Search, MessageSquare, Heart, Flag, Loader2, AlertCircle } from 'lucide-react';
import { RoleBadge } from '../RoleBadge';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '../Header';

const CATEGORIES = [
  'All',
  'Tips & Experience',
  'Announcements',
  'Q&A',
  'General Discussion',
  'Test Preparation',
  'Documents',
];

export function ForumPage() {
  const { user } = useAuth();
  const { posts, isLoadingPosts, postsError, refreshPosts } = useForum();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // Filter posts based on user role
  const visiblePosts = posts.filter(post => {
    // Admins see all posts including pending
    if (user?.role === 'admin') return true;
    // Users only see published posts
    return post.status === 'published';
  });

  // Apply filters
  const filteredPosts = visiblePosts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.likes - a.likes;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 ml-2">
            <div>
              <h1 className="text-2xl font-bold mb-1">Forum Komunitas</h1>
              <p className="text-muted-foreground text-sm">
                Berbagi pengalaman dan diskusi seputar beasiswa di Indonesia
              </p>
            </div>
            <Link to="/forum/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Buat Postingan
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search and Filter */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari postingan, topik, atau tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="sm:w-[200px]">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: 'recent' | 'popular') => setSortBy(value)}>
                      <SelectTrigger className="sm:w-[180px]">
                        <SelectValue placeholder="Urutkan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Terbaru</SelectItem>
                        <SelectItem value="popular">Paling Populer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Posts List */}
              <div className="space-y-4">
                {isLoadingPosts ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                      Memuat post forum...
                    </CardContent>
                  </Card>
                ) : postsError ? (
                  <Card className="border-destructive/40">
                    <CardContent className="py-10 text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-3 text-destructive" />
                      <p className="font-medium text-destructive mb-1">Gagal memuat data forum</p>
                      <p className="text-sm text-muted-foreground mb-4">{postsError}</p>
                      <Button variant="outline" onClick={() => void refreshPosts()}>
                        Coba Lagi
                      </Button>
                    </CardContent>
                  </Card>
                ) : sortedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Tidak ada postingan ditemukan
                    </CardContent>
                  </Card>
                ) : (
                  sortedPosts.map(post => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{post.authorName}</span>
                              <RoleBadge role={post.authorRole} size="sm" />
                              {post.status === 'pending' && user?.role === 'admin' && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  Menunggu
                                </Badge>
                              )}
                              {post.isReported && user?.role === 'admin' && (
                                <Badge variant="destructive" className="gap-1">
                                  <Flag className="h-3 w-3" />
                                  {post.reportCount} Laporan
                                </Badge>
                              )}
                            </div>
                            
                            <Link to={`/forum/${post.id}`}>
                              <h3 className="text-xl font-semibold hover:text-primary transition-colors mb-2">
                                {post.title}
                              </h3>
                            </Link>
                            
                            <p className="text-muted-foreground line-clamp-2 mb-3">
                              {post.content}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="secondary">{post.category}</Badge>
                              {post.tags.map(tag => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.commentCount}</span>
                              </div>
                              <span>
                                {formatDistanceToNow(post.createdAt, { 
                                  addSuffix: true
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Kategori</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Quick Actions */}
              {user?.role === 'admin' && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <h3 className="font-semibold">Panel Admin</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link to="/forum/reports">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Flag className="h-4 w-4 mr-2" />
                        Laporan ({posts.filter(p => p.isReported).length})
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
