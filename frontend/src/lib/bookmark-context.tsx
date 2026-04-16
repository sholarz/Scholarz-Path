// Bookmark Context — API-backed with optimistic UI updates
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { addBookmark as apiAddBookmark, removeBookmark as apiRemoveBookmark, getBookmarks } from './scholarship-api';
import { toast } from 'sonner';

const FREE_USER_BOOKMARK_LIMIT = 3;
const LS_KEY = 'bookmarks_cache';

interface BookmarkContextType {
  bookmarks: string[];
  isBookmarked: (scholarshipId: string) => boolean;
  toggleBookmark: (scholarshipId: string) => void;
  canAddMore: boolean;
  bookmarkLimit: number | null;
  isLoading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    // Restore from localStorage cache immediately for instant UI
    try {
      const cached = localStorage.getItem(LS_KEY);
      return cached ? (JSON.parse(cached) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync localStorage cache whenever bookmarks change
  const persistCache = useCallback((ids: string[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(ids));
    } catch {
      /* ignore storage quota errors */
    }
  }, []);

  // Load bookmarks from API on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      setBookmarks([]);
      persistCache([]);
      return;
    }

    setIsLoading(true);
    getBookmarks()
      .then(response => {
        const ids = (response.scholarships ?? []).map(b => b.scholarship.id);
        setBookmarks(ids);
        persistCache(ids);
      })
      .catch(() => {
        // API down or not seeded — keep localStorage cache as fallback
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, persistCache]);

  const isBookmarked = useCallback(
    (scholarshipId: string) => bookmarks.includes(scholarshipId),
    [bookmarks]
  );

  const isFreeUser = user?.role === 'free';
  const bookmarkLimit = isFreeUser ? FREE_USER_BOOKMARK_LIMIT : null;
  const canAddMore = !isFreeUser || bookmarks.length < FREE_USER_BOOKMARK_LIMIT;

  const toggleBookmark = useCallback(
    (scholarshipId: string) => {
      if (!isAuthenticated) {
        toast.error('Please log in to bookmark scholarships.');
        return;
      }

      const alreadyBookmarked = bookmarks.includes(scholarshipId);

      if (alreadyBookmarked) {
        // Optimistic remove
        const updated = bookmarks.filter(id => id !== scholarshipId);
        setBookmarks(updated);
        persistCache(updated);

        apiRemoveBookmark(scholarshipId).catch(() => {
          // Rollback on failure
          setBookmarks(bookmarks);
          persistCache(bookmarks);
          toast.error('Failed to remove bookmark. Please try again.');
        });

        toast.success('Bookmark removed.');
      } else {
        if (isFreeUser && bookmarks.length >= FREE_USER_BOOKMARK_LIMIT) {
          toast.error(
            `Free users can bookmark up to ${FREE_USER_BOOKMARK_LIMIT} scholarships. Upgrade to Premium for unlimited bookmarks!`
          );
          return;
        }

        // Optimistic add
        const updated = [...bookmarks, scholarshipId];
        setBookmarks(updated);
        persistCache(updated);

        apiAddBookmark(scholarshipId).catch(() => {
          // Rollback on failure
          setBookmarks(bookmarks);
          persistCache(bookmarks);
          toast.error('Failed to save bookmark. Please try again.');
        });

        toast.success('Scholarship bookmarked!');
      }
    },
    [bookmarks, isAuthenticated, isFreeUser, persistCache]
  );

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        isBookmarked,
        toggleBookmark,
        canAddMore,
        bookmarkLimit,
        isLoading,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}