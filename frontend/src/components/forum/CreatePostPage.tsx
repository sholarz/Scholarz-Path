import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useForum } from '../../lib/forum-context';
import { useAuth } from '../../lib/auth-context';
import { getForumCategories, type ForumCategoryOption } from '../../lib/forum-api';
import { ApiError } from '../../lib/api-client';
import { X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../Header';

const SUGGESTED_TAGS = [
  'LPDP', 'Masters Scholarship', 'PhD Scholarship', 'IELTS', 'TOEFL',
  'Motivation Letter', 'CV', 'Interview', 'Tips', 'Experience',
];

export function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createPost } = useForum();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<ForumCategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const rows = await getForumCategories();
        setCategories(rows);
      } catch {
        toast.error('Gagal memuat kategori forum');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    void loadCategories();
  }, []);

  const addTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim()) && tags.length < 5) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        categoryId,
        tags,
      });

      toast.success('Post published successfully!');
      navigate('/forum');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422) {
          toast.error(error.message || 'Data post tidak valid');
        } else if (error.status === 403) {
          toast.error('Anda tidak memiliki akses untuk membuat post');
        } else if (error.status === 404) {
          toast.error('Kategori forum tidak ditemukan');
        } else {
          toast.error(error.message || 'Gagal mempublikasikan post');
        }
      } else {
        toast.error('Gagal mempublikasikan post');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="mb-8 ml-2">
            <h1 className="text-2xl font-bold mb-1">Create New Post</h1>
            <p className="text-muted-foreground text-sm">
              Share your experiences, tips, or questions with the community
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
              <CardDescription>
                Your post will be published immediately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Write an engaging and descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {title.length}/150 characters
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category" disabled={isLoadingCategories || categories.length === 0}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="empty" disabled>No categories available</SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!isLoadingCategories && categories.length === 0 && (
                  <p className="text-xs text-destructive">Kategori forum belum tersedia. Hubungi admin untuk menjalankan seeder kategori.</p>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content in detail..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {content.length}/5000 characters
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (Maximum 5)</Label>
                
                {/* Selected Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Suggested Tags */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => addTag(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Custom Tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    disabled={tags.length >= 5}
                  />
                  <Button
                    variant="outline"
                    onClick={addCustomTag}
                    disabled={tags.length >= 5 || !customTag.trim()}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tags help others find your post
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !content.trim() || !categoryId}
                  className="flex-1 sm:flex-none sm:px-8 gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/forum')}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
