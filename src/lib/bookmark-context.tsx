// Bookmark Context for managing bookmarked scholarships
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';

const FREE_USER_BOOKMARK_LIMIT = 3;

interface BookmarkContextType {
  bookmarks: string[];
  isBookmarked: (scholarshipId: string) => boolean;
  addBookmark: (scholarshipId: string) => void;
  removeBookmark: (scholarshipId: string) => void;
  toggleBookmark: (scholarshipId: string) => void;
  canAddMore: boolean;
  bookmarkLimit: number | null;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    // Load bookmarks from localStorage
    const savedBookmarks = localStorage.getItem('bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  const saveBookmarks = (newBookmarks: string[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const isBookmarked = (scholarshipId: string) => {
    return bookmarks.includes(scholarshipId);
  };

  const addBookmark = (scholarshipId: string) => {
    if (!bookmarks.includes(scholarshipId)) {
      saveBookmarks([...bookmarks, scholarshipId]);
    }
  };

  const removeBookmark = (scholarshipId: string) => {
    saveBookmarks(bookmarks.filter(id => id !== scholarshipId));
  };

  const toggleBookmark = (scholarshipId: string) => {
    if (isBookmarked(scholarshipId)) {
      removeBookmark(scholarshipId);
    } else {
      addBookmark(scholarshipId);
    }
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        isBookmarked,
        addBookmark,
        removeBookmark,
        toggleBookmark,
        canAddMore: true,
        bookmarkLimit: null,
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

  const enhancedToggleBookmark = (scholarshipId: string) => {
    if (context.isBookmarked(scholarshipId)) {
      context.removeBookmark(scholarshipId);
      toast.success('Bookmark removed');
    } else {
      if (isFreeUser && context.bookmarks.length >= FREE_USER_BOOKMARK_LIMIT) {
        toast.error(`Free users can only bookmark up to ${FREE_USER_BOOKMARK_LIMIT} scholarships. Upgrade to Premium for unlimited bookmarks!`);
        return;
      }
      context.addBookmark(scholarshipId);
      toast.success('Scholarship bookmarked');
    }
  };

  return {
    ...context,
    toggleBookmark: enhancedToggleBookmark,
    canAddMore,
    bookmarkLimit,
  };
}