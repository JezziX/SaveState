import { Book } from '../types';

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
  isbn?: string[];
}

// Convert Open Library doc format to our internal Book format
export function mapDocToBook(doc: OpenLibraryDoc): Book {
  const cleanId = doc.key.replace('/works/', '').replace('/books/', '');
  const coverUrl = doc.cover_i 
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop'; // Elegant minimalist fallback representation

  // Fetch the primary subject as default genre category
  const primaryGenre = doc.subject && doc.subject.length > 0 ? doc.subject[0] : undefined;

  return {
    id: cleanId,
    title: doc.title,
    author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
    coverUrl,
    publishYear: doc.first_publish_year?.toString() || 'Unknown',
    pages: doc.number_of_pages_median,
    subjects: doc.subject ? doc.subject.slice(0, 5) : [],
    isbn: doc.isbn ? doc.isbn[0] : undefined,
    genre: primaryGenre,
  };
}

export async function searchOpenLibrary(query: string): Promise<Book[]> {
  if (!query || query.trim().length < 2) return [];
  
  try {
    const formattedQuery = encodeURIComponent(query.trim());
    const response = await fetch(`https://openlibrary.org/search.json?q=${formattedQuery}&limit=12`);
    if (!response.ok) {
      throw new Error('Network error searching Open Library');
    }
    const data = await response.json();
    const docs: OpenLibraryDoc[] = data.docs || [];
    return docs.map(mapDocToBook);
  } catch (error) {
    console.error('Error querying Open Library:', error);
    return [];
  }
}

// Starter books lists
export const POPULAR_STARTER_BOOKS: Book[] = [
  {
    id: "OL1168083W",
    title: "1984",
    author: "George Orwell",
    coverUrl: "https://covers.openlibrary.org/b/id/14466952-M.jpg",
    publishYear: "1949",
    pages: 328,
    subjects: ["Dystopia", "Political fiction", "Totalitarianism"],
    genre: "Dystopia"
  },
  {
    id: "OL454378W",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    coverUrl: "https://covers.openlibrary.org/b/id/14352726-M.jpg",
    publishYear: "1925",
    pages: 180,
    subjects: ["Classic Literature", "Society", "Wealth", "Modern Fiction"],
    genre: "Classic Literature"
  },
  {
    id: "OL82586W",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    coverUrl: "https://covers.openlibrary.org/b/id/14541708-M.jpg",
    publishYear: "1937",
    pages: 310,
    subjects: ["Fantasy", "Middle-earth", "Adventure"],
    genre: "Fantasy"
  },
  {
    id: "OL21356W",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    coverUrl: "https://covers.openlibrary.org/b/id/14574972-M.jpg",
    publishYear: "1960",
    pages: 281,
    subjects: ["Coming of Age", "Classic", "Justice", "Southern United States"],
    genre: "Classic"
  }
];
