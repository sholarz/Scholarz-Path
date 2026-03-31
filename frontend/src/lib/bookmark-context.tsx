// Bookmark Context for managing bookmarked scholarships
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';
import { addBookmark, removeBookmark, getBookmarks } from '../api/scholarship';

const FREE_USER_BOOKMARK_LIMIT = 3;

interface BookmarkContextType {
  bookmarks: string[];
  isBookmarked: (scholarshipId: string) => boolean;
  addBookmark: (scholarshipId: string) => Promise<void>;
  removeBookmark: (scholarshipId: string) => Promise<void>;
  toggleBookmark: (scholarshipId: string) => Promise<void>;
  canAddMore: boolean;
  bookmarkLimit: number | null;
  isLoading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch bookmarks from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated]);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const response = await getBookmarks();
      const scholarshipIds = response.data.data.scholarships.map((s: any) => String(s.id));
      setBookmarks(scholarshipIds);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      // Fallback to empty bookmarks if fetch fails
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isBookmarked = (scholarshipId: string) => {
    return bookmarks.includes(scholarshipId);
  };

  const handleAddBookmark = async (scholarshipId: string) => {
    if (!isBookmarked(scholarshipId)) {
      try {
        await addBookmark(scholarshipId);
        setBookmarks([...bookmarks, scholarshipId]);
      } catch (error) {
        console.error('Failed to bookmark:', error);
        throw error;
      }
    }
  };

  const handleRemoveBookmark = async (scholarshipId: string) => {
    try {
      await removeBookmark(scholarshipId);
      setBookmarks(bookmarks.filter(id => id !== scholarshipId));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  };

  const handleToggleBookmark = async (scholarshipId: string) => {
    if (isBookmarked(scholarshipId)) {
      await handleRemoveBookmark(scholarshipId);
    } else {
      await handleAddBookmark(scholarshipId);
    }
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        isBookmarked,
        addBookmark: handleAddBookmark,
        removeBookmark: handleRemoveBookmark,
        toggleBookmark: handleToggleBookmark,
        canAddMore: true,
        bookmarkLimit: null,
        isLoading,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

// Wrapper hook that checks user permissions
export function useBookmarks() {
  const context = useContext(BookmarkContext);
  const { user } = useAuth();
  
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }

  const isFreeUser = user?.role === 'free';
  const bookmarkLimit = isFreeUser ? FREE_USER_BOOKMARK_LIMIT : null;
  const canAddMore = !isFreeUser || context.bookmarks.length < FREE_USER_BOOKMARK_LIMIT;

  const enhancedToggleBookmark = async (scholarshipId: string) => {
    try {
      if (context.isBookmarked(scholarshipId)) {
        await context.removeBookmark(scholarshipId);
        toast.success('Bookmark removed');
      } else {
        if (isFreeUser && context.bookmarks.length >= FREE_USER_BOOKMARK_LIMIT) {
          toast.error(`Free users can only bookmark up to ${FREE_USER_BOOKMARK_LIMIT} scholarships. Upgrade to Premium for unlimited bookmarks!`);
          return;
        }
        await context.addBookmark(scholarshipId);
        toast.success('Scholarship bookmarked');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  return {
    ...context,
    toggleBookmark: enhancedToggleBookmark,
    canAddMore,
    bookmarkLimit,
  };
}