const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const originalFetch = `
  const fetchCloudData = async (userId: string) => {
    try {
      const [mediaRes, spRes] = await Promise.all([
        supabase.from('media_items').select('*').eq('user_id', userId),
        supabase.from('save_points').select('*').eq('user_id', userId)
      ]);
      
      if (mediaRes.data) {
        const cloudBooks = mediaRes.data.filter((m: any) => m.type === 'book');
        const cloudMedia = mediaRes.data.filter((m: any) => m.type !== 'book');
        if (cloudBooks.length > 0) setBooks(cloudBooks as any);
        if (cloudMedia.length > 0) setMediaItems(cloudMedia as any);
      }
      if (spRes.data && spRes.data.length > 0) {
        setSavePoints(spRes.data as any);
      }
      
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
`;

const newFetch = `
  const fetchCloudData = async (userId: string) => {
    try {
      const [mediaRes, spRes, revRes] = await Promise.all([
        supabase.from('media_items').select('*').eq('user_id', userId),
        supabase.from('save_points').select('*').eq('user_id', userId),
        supabase.from('public_reviews').select('*').eq('user_id', userId)
      ]);
      
      if (mediaRes.data) {
        const cloudBooks = mediaRes.data.filter((m: any) => m.type === 'book');
        const cloudMedia = mediaRes.data.filter((m: any) => m.type !== 'book');
        if (cloudBooks.length > 0) {
          setBooks(cloudBooks as any);
          const newLogs: ReadingLog[] = [];
          cloudBooks.forEach((b: any) => {
            const status = b.didNotFinish ? 'dnf' : (b.endDate ? 'completed' : (b.startDate ? 'active' : 'backlog'));
            if (status === 'active' || status === 'completed' || status === 'dnf') {
              newLogs.push({
                id: \`log_\${b.id}\`,
                bookId: b.id,
                startDate: b.startDate,
                endDate: b.endDate || '',
                status
              });
            }
          });
          setReadingLogs(newLogs);
        }
        if (cloudMedia.length > 0) {
          setMediaItems(cloudMedia as any);
          // could do similar for mediaLogs here
        }
      }
      if (spRes.data && spRes.data.length > 0) {
        setSavePoints(spRes.data as any);
      }
      if (revRes.data && revRes.data.length > 0) {
        const newReviews = revRes.data.map((r: any) => ({
          bookId: r.media_id,
          rating: r.rating,
          notes: r.review_text,
          updatedAt: r.updated_at
        }));
        setReviews(newReviews);
      }
      
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
`;

app = app.replace(originalFetch.trim(), newFetch.trim());
fs.writeFileSync('src/App.tsx', app);
