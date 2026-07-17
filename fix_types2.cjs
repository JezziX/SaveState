const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(`didNotFinish?: boolean;
  genre?: string;     // Primary/selected genre
}`, `didNotFinish?: boolean;
  genre?: string;     // Primary/selected genre
  type?: 'book';
  currentProgress?: string | number;
  totalLength?: string | number;
}`);

content = content.replace(`episodes?: { id: string; season: number; number: number; title: string; aired?: string }[];
}`, `episodes?: { id: string; season: number; number: number; title: string; aired?: string }[];
  currentProgress?: string | number;
  totalLength?: string | number;
}`);

fs.writeFileSync('src/types.ts', content);
