export interface Book {
  id: string; // Open Library seed key or custom UUID
  title: string;
  author: string;
  coverUrl: string;
  publishYear?: string;
  pages?: number;
  description?: string;
  subjects?: string[];
  isbn?: string;
  // User customized reading state (direct mapping)
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  didNotFinish?: boolean;
  genre?: string;     // Primary/selected genre
  type?: 'book';
  currentProgress?: string | number;
  totalLength?: string | number;
}

export interface ReadingLog {
  id: string;
  bookId: string;
  startDate?: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (Main target for the calendar day)
  status: 'backlog' | 'active' | 'completed' | 'dnf';
}

export interface BookReview {
  bookId: string;
  rating: number; // 1-5 stars
  notes: string; // Thoughts / custom memory notes
  updatedAt: string;
  quotes?: string[]; // Memorable quotes highlighted by the reader
}

export interface MediaItem {
  id: string;
  type: 'podcast' | 'movie' | 'tv';
  title: string;
  creator: string; // Director, Podcaster, etc.
  coverUrl: string;
  releaseYear?: string;
  description?: string;
  genre?: string;
  startDate?: string;
  endDate?: string;
  didNotFinish?: boolean;
  rating?: number;
  overview?: string;
  cast?: { id: string; name: string; character: string; image?: string }[];
  episodes?: { id: string; season: number; number: number; title: string; aired?: string }[];
  currentProgress?: string | number;
  totalLength?: string | number;
}

export interface MediaLog {
  id: string;
  mediaId: string;
  startDate?: string;
  endDate: string;
  status: 'backlog' | 'active' | 'completed' | 'dnf';
}

export interface MediaReview {
  mediaId: string;
  rating: number;
  notes: string;
  updatedAt: string;
  quotes?: string[];
}

export interface AppPreferences {
  fontFamily: 'sans' | 'serif' | 'mono' | 'display' | 'handwriting' | 'merriweather' | 'playfair' | 'cinzel' | 'lora' | 'firacode' | 'plusjakarta';
  theme: 'jx' | 'neon' | 'pastel' | 'rainbow' | 'dark' | 'coffee' | 'midnight' | 'apothecary' | 'cozy' | 'cyber' | 'forest' | 'savestate';
  calendarStartDay: 'sunday' | 'monday';
  showDailyGoal: boolean;
  shelfSkin?: string;
  unlockedBadges?: string[];
  pinnedBadges?: { id: string, x: number, y: number, badgeId: string, shelfIdx: number }[];
  accentColor: string;
}

export interface AppState {
  books: Book[];
  readingLogs: ReadingLog[];
  reviews: BookReview[];
  mediaItems?: MediaItem[];
  mediaLogs?: MediaLog[];
  mediaReviews?: MediaReview[];
  savePoints?: SavePoint[];
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  handle?: string;
  bio: string;
  avatar_url: string;
  active_skin: string;
  yearly_goal: number;
  followers_count?: number;
  following_count?: number;
}

export interface SocialUser {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  booksRead: number;
  streakDays: number;
  badges: string[];
  isFollowing: boolean;
}

export interface SocialActivity {
  id: string;
  userId: string;
  type: 'review' | 'completed' | 'active' | 'save_point';
  vibeEmoji?: string;
  savePointNotes?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string;
  rating?: number;
  reviewText?: string;
  timestamp: string; // ISO
}

export interface SavePoint {
  id: string;
  mediaId: string;
  mediaTitle?: string;
  milestone: string;
  raw_brain_drop: string;
  created_at: string;
}
