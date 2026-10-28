export const CATEGORIES = [
  'General Works',
  'Philosophy, Psychology, Religion',
  'Auxiliary Sciences of History',
  'World History',
  'History of the Americas',
  'Local History of the Americas',
  'Geography, Anthropology, Recreation',
  'Social Sciences',
  'Political Science',
  'Law',
  'Education',
  'Music',
  'Fine Arts',
  'Language and Literature',
  'Science',
  'Medicine',
  'Agriculture',
  'Technology',
  'Military Science',
  'Naval Science',
  'Bibliography, Library Science',
  'Computer Science',
  'Engineering',
  'Business',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Arts & Humanities',
];

const rawBooks = [
  {
    id: 1,
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    isbn: '978-0262033848',
    publisher: 'MIT Press',
    year: 2022,
    category: 'Computer Science',
    description:
      'A comprehensive textbook covering a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers. Each chapter presents an algorithm, a design technique, an application area, or a related topic.',
    subjects: ['algorithms', 'data structures', 'sorting', 'programming', 'computer science'],
    location: { library: 'Main Library', floor: 'Floor 3', section: 'Section A', rack: 'Rack 2', shelf: 'Shelf 4' },
    copies: [
      { id: 'CS-001', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
      { id: 'CS-002', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
      { id: 'CS-003', status: 'borrowed', borrower: 'John Doe', dueDate: '2026-09-15', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
      { id: 'CS-004', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 5' },
      { id: 'CS-005', status: 'reserved', reservedBy: 'Sarah Johnson', location: 'Floor 3, Section A, Rack 2, Shelf 5' }
    ]
  },
  {
    id: 2,
    title: 'Engineering Mathematics',
    author: 'K.A. Stroud, Dexter J. Booth',
    isbn: '978-1352003215',
    publisher: 'Palgrave Macmillan',
    year: 2021,
    category: 'Engineering',
    description:
      'An extensive undergraduate textbook covering essential mathematical topics for engineering students, including algebra, calculus, differential equations, and complex numbers.',
    subjects: ['mathematics', 'calculus', 'engineering', 'algebra', 'differential equations'],
    location: { library: 'Main Library', floor: 'Floor 2', section: 'Section B', rack: 'Rack 1', shelf: 'Shelf 3' },
    copies: [
      { id: 'EN-001', status: 'available', location: 'Floor 2, Section B, Rack 1, Shelf 3' },
      { id: 'EN-002', status: 'borrowed', borrower: 'Amina Yusuf', dueDate: '2026-09-20', location: 'Floor 2, Section B, Rack 1, Shelf 3' },
      { id: 'EN-003', status: 'available', location: 'Floor 2, Section B, Rack 1, Shelf 4' },
      { id: 'EN-004', status: 'borrowed', borrower: 'Peter Obi', dueDate: '2026-09-10', location: 'Floor 2, Section B, Rack 1, Shelf 4' }
    ]
  },
  {
    id: 3,
    title: 'Principles of Anatomy and Physiology',
    author: 'G.J. Tortora, B.H. Derrickson',
    isbn: '978-1119634041',
    publisher: 'Wiley',
    year: 2023,
    category: 'Medicine',
    description:
      'A leading textbook presenting anatomy and physiology concepts with clear illustrations, clinical applications, and a strong focus on the human body systems.',
    subjects: ['anatomy', 'physiology', 'human body', 'medicine', 'biology'],
    location: { library: 'Main Library', floor: 'Floor 4', section: 'Section A', rack: 'Rack 3', shelf: 'Shelf 2' },
    copies: [
      { id: 'MD-001', status: 'borrowed', borrower: 'Grace Alozie', dueDate: '2026-09-25', location: 'Floor 4, Section A, Rack 3, Shelf 2' },
      { id: 'MD-002', status: 'borrowed', borrower: 'Chinedu Eze', dueDate: '2026-09-18', location: 'Floor 4, Section A, Rack 3, Shelf 2' },
      { id: 'MD-003', status: 'borrowed', borrower: 'Blessing Uche', dueDate: '2026-09-12', location: 'Floor 4, Section A, Rack 3, Shelf 2' }
    ]
  },
  {
    id: 4,
    title: 'Constitutional Law',
    author: 'Ernest L. Phillips',
    isbn: '978-0709989806',
    publisher: 'Routledge',
    year: 2020,
    category: 'Law',
    description:
      'An authoritative introduction to constitutional law, examining constitutional principles, institutions, and the protection of fundamental rights.',
    subjects: ['law', 'constitution', 'human rights', 'government', 'legal studies'],
    location: { library: 'Main Library', floor: 'Floor 2', section: 'Section C', rack: 'Rack 4', shelf: 'Shelf 1' },
    copies: [
      { id: 'LW-001', status: 'available', location: 'Floor 2, Section C, Rack 4, Shelf 1' },
      { id: 'LW-002', status: 'available', location: 'Floor 2, Section C, Rack 4, Shelf 1' },
      { id: 'LW-003', status: 'available', location: 'Floor 2, Section C, Rack 4, Shelf 2' },
      { id: 'LW-004', status: 'borrowed', borrower: 'Kelechi Nwosu', dueDate: '2026-09-05', location: 'Floor 2, Section C, Rack 4, Shelf 2' },
      { id: 'LW-005', status: 'available', location: 'Floor 2, Section C, Rack 4, Shelf 2' },
      { id: 'LW-006', status: 'available', location: 'Floor 2, Section C, Rack 4, Shelf 2' }
    ]
  },
  {
    id: 5,
    title: 'Organic Chemistry',
    author: 'Paula Yurkanis Bruice',
    isbn: '978-0134048147',
    publisher: 'Pearson',
    year: 2022,
    category: 'Chemistry',
    description:
      'A student-friendly introduction to organic chemistry with a focus on reaction mechanisms, functional groups, and molecular structure.',
    subjects: ['chemistry', 'organic chemistry', 'molecules', 'reactions'],
    location: { library: 'Main Library', floor: 'Floor 5', section: 'Section B', rack: 'Rack 1', shelf: 'Shelf 3' },
    copies: [
      { id: 'CM-001', status: 'available', location: 'Floor 5, Section B, Rack 1, Shelf 3' },
      { id: 'CM-002', status: 'borrowed', borrower: 'David Okoro', dueDate: '2026-09-08', location: 'Floor 5, Section B, Rack 1, Shelf 3' },
      { id: 'CM-003', status: 'available', location: 'Floor 5, Section B, Rack 1, Shelf 3' },
      { id: 'CM-004', status: 'available', location: 'Floor 5, Section B, Rack 1, Shelf 4' }
    ]
  },
  {
    id: 6,
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
    isbn: '978-0078022159',
    publisher: 'McGraw-Hill',
    year: 2023,
    category: 'Computer Science',
    description:
      'A classic database textbook covering the fundamentals of database systems, including relational models, SQL, transaction management, and data storage.',
    subjects: ['database', 'sql', 'relational', 'data', 'computer science'],
    location: { library: 'Main Library', floor: 'Floor 3', section: 'Section A', rack: 'Rack 1', shelf: 'Shelf 5' },
    copies: [
      { id: 'CS-101', status: 'available', location: 'Floor 3, Section A, Rack 1, Shelf 5' },
      { id: 'CS-102', status: 'available', location: 'Floor 3, Section A, Rack 1, Shelf 5' },
      { id: 'CS-103', status: 'reserved', reservedBy: 'Ngozi Ada', location: 'Floor 3, Section A, Rack 1, Shelf 5' }
    ]
  },
  {
    id: 7,
    title: 'Business Ethics',
    author: 'O.C. Ferrell, John Fraedrich, Linda Ferrell',
    isbn: '978-1305969469',
    publisher: 'Cengage',
    year: 2021,
    category: 'Business',
    description:
      'Explores the ethical issues businesses face in the modern world, covering corporate responsibility, stakeholder theory, and ethical decision making.',
    subjects: ['business', 'ethics', 'management', 'corporate responsibility'],
    location: { library: 'Main Library', floor: 'Floor 1', section: 'Section B', rack: 'Rack 2', shelf: 'Shelf 4' },
    copies: [
      { id: 'BS-001', status: 'borrowed', borrower: 'Fatima Bello', dueDate: '2026-09-30', location: 'Floor 1, Section B, Rack 2, Shelf 4' },
      { id: 'BS-002', status: 'available', location: 'Floor 1, Section B, Rack 2, Shelf 4' }
    ]
  },
  {
    id: 8,
    title: 'Physics for Scientists and Engineers',
    author: 'Raymond A. Serway, John W. Jewett',
    isbn: '978-1133947271',
    publisher: 'Cengage',
    year: 2022,
    category: 'Physics',
    description:
      'A comprehensive physics text covering mechanics, electromagnetism, thermodynamics, and modern physics with an emphasis on conceptual understanding and problem solving.',
    subjects: ['physics', 'mechanics', 'electromagnetism', 'thermodynamics'],
    location: { library: 'Main Library', floor: 'Floor 5', section: 'Section A', rack: 'Rack 2', shelf: 'Shelf 1' },
    copies: [
      { id: 'PH-001', status: 'available', location: 'Floor 5, Section A, Rack 2, Shelf 1' },
      { id: 'PH-002', status: 'available', location: 'Floor 5, Section A, Rack 2, Shelf 1' },
      { id: 'PH-003', status: 'available', location: 'Floor 5, Section A, Rack 2, Shelf 2' }
    ]
  },
  {
    id: 9,
    title: 'Fundamentals of Nursing',
    author: 'Barbara Kozier, Glenora Erb, Shirlee Snyder',
    isbn: '978-0134404615',
    publisher: 'Pearson',
    year: 2023,
    category: 'Medicine',
    description:
      'A foundational nursing textbook covering the core concepts, skills, and procedures required for professional nursing practice.',
    subjects: ['nursing', 'medicine', 'healthcare', 'patient care'],
    location: { library: 'Main Library', floor: 'Floor 4', section: 'Section A', rack: 'Rack 2', shelf: 'Shelf 3' },
    copies: [
      { id: 'MD-201', status: 'available', location: 'Floor 4, Section A, Rack 2, Shelf 3' },
      { id: 'MD-202', status: 'available', location: 'Floor 4, Section A, Rack 2, Shelf 3' },
      { id: 'MD-203', status: 'available', location: 'Floor 4, Section A, Rack 2, Shelf 3' }
    ]
  },
  {
    id: 10,
    title: 'Software Engineering',
    author: 'Ian Sommerville',
    isbn: '978-0133943030',
    publisher: 'Pearson',
    year: 2022,
    category: 'Computer Science',
    description:
      'An authoritative introduction to software engineering practice, covering agile methods, requirements engineering, software design, testing, and evolution.',
    subjects: ['software engineering', 'agile', 'programming', 'testing', 'computer science'],
    location: { library: 'Main Library', floor: 'Floor 3', section: 'Section A', rack: 'Rack 1', shelf: 'Shelf 3' },
    copies: [
      { id: 'CS-301', status: 'available', location: 'Floor 3, Section A, Rack 1, Shelf 3' },
      { id: 'CS-302', status: 'borrowed', borrower: 'Emeka Okonkwo', dueDate: '2026-09-22', location: 'Floor 3, Section A, Rack 1, Shelf 3' }
    ]
  },
  {
    id: 11,
    title: 'Civil Engineering Materials',
    author: 'S.P. Timoshenko, D.H. Young',
    isbn: '978-0672307201',
    publisher: 'Van Nostrand',
    year: 2020,
    category: 'Engineering',
    description:
      'Covers the properties and behaviour of construction materials such as concrete, steel, timber, and soils, and their application in civil engineering.',
    subjects: ['civil engineering', 'materials', 'construction', 'engineering'],
    location: { library: 'Main Library', floor: 'Floor 2', section: 'Section B', rack: 'Rack 3', shelf: 'Shelf 1' },
    copies: [
      { id: 'EN-501', status: 'available', location: 'Floor 2, Section B, Rack 3, Shelf 1' },
      { id: 'EN-502', status: 'available', location: 'Floor 2, Section B, Rack 3, Shelf 1' },
      { id: 'EN-503', status: 'available', location: 'Floor 2, Section B, Rack 3, Shelf 2' }
    ]
  },
  {
    id: 12,
    title: 'Educational Psychology',
    author: 'John W. Santrock',
    isbn: '978-1260405491',
    publisher: 'McGraw-Hill',
    year: 2023,
    category: 'Education',
    description:
      'Applies psychological research and principles to teaching and learning, covering cognitive development, motivation, and classroom management.',
    subjects: ['education', 'psychology', 'learning', 'teaching'],
    location: { library: 'Main Library', floor: 'Floor 1', section: 'Section A', rack: 'Rack 5', shelf: 'Shelf 2' },
    copies: [
      { id: 'ED-001', status: 'borrowed', borrower: 'Obiora Nnamdi', dueDate: '2026-09-14', location: 'Floor 1, Section A, Rack 5, Shelf 2' },
      { id: 'ED-002', status: 'available', location: 'Floor 1, Section A, Rack 5, Shelf 2' }
    ]
  },
  {
    id: 13,
    title: 'Principles of Economics',
    author: 'N. Gregory Mankiw',
    isbn: '978-1305585126',
    publisher: 'Cengage',
    year: 2021,
    category: 'Business',
    description:
      'A leading principles-of-economics text introducing supply and demand, markets, macroeconomics, and the role of government in the economy.',
    subjects: ['economics', 'business', 'markets', 'macroeconomics', 'finance'],
    location: { library: 'Main Library', floor: 'Floor 1', section: 'Section B', rack: 'Rack 1', shelf: 'Shelf 5' },
    copies: [
      { id: 'BS-501', status: 'available', location: 'Floor 1, Section B, Rack 1, Shelf 5' },
      { id: 'BS-502', status: 'available', location: 'Floor 1, Section B, Rack 1, Shelf 5' }
    ]
  },
  {
    id: 14,
    title: 'Linear Algebra',
    author: 'Gilbert Strang',
    isbn: '978-0980232714',
    publisher: 'Wellesley-Cambridge Press',
    year: 2020,
    category: 'Mathematics',
    description:
      'A clear and accessible treatment of linear algebra covering matrices, vector spaces, eigenvalues, and applications across science and engineering.',
    subjects: ['mathematics', 'linear algebra', 'matrices', 'vectors'],
    location: { library: 'Main Library', floor: 'Floor 5', section: 'Section C', rack: 'Rack 1', shelf: 'Shelf 4' },
    copies: [
      { id: 'MT-001', status: 'available', location: 'Floor 5, Section C, Rack 1, Shelf 4' },
      { id: 'MT-002', status: 'borrowed', borrower: 'Zainab Adamu', dueDate: '2026-09-19', location: 'Floor 5, Section C, Rack 1, Shelf 4' },
      { id: 'MT-003', status: 'available', location: 'Floor 5, Section C, Rack 1, Shelf 4' }
    ]
  },
  {
    id: 15,
    title: 'Introduction to Sociology',
    author: 'Anthony Giddens, Philip W. Sutton',
    isbn: '978-0393538009',
    publisher: 'W.W. Norton',
    year: 2021,
    category: 'Social Sciences',
    description:
      'An engaging overview of sociology covering social structure, culture, inequality, institutions, and social change in the modern world.',
    subjects: ['sociology', 'social sciences', 'society', 'culture'],
    location: { library: 'Main Library', floor: 'Floor 1', section: 'Section C', rack: 'Rack 2', shelf: 'Shelf 1' },
    copies: [
      { id: 'SS-001', status: 'available', location: 'Floor 1, Section C, Rack 2, Shelf 1' },
      { id: 'SS-002', status: 'available', location: 'Floor 1, Section C, Rack 2, Shelf 1' }
    ]
  },
  {
    id: 16,
    title: 'World History',
    author: 'Robert Strayer, Eric W. Nelson',
    isbn: '978-1319061315',
    publisher: 'Bedford/St. Martin\u2019s',
    year: 2022,
    category: 'Arts & Humanities',
    description:
      'A thematic survey of world history exploring patterns of civilization, trade, empire, and cultural exchange across regions and centuries.',
    subjects: ['history', 'humanities', 'civilization', 'world history'],
    location: { library: 'Main Library', floor: 'Floor 2', section: 'Section D', rack: 'Rack 5', shelf: 'Shelf 1' },
    copies: [
      { id: 'AH-001', status: 'available', location: 'Floor 2, Section D, Rack 5, Shelf 1' },
      { id: 'AH-002', status: 'available', location: 'Floor 2, Section D, Rack 5, Shelf 1' }
    ]
  },
  {
    id: 17,
    title: 'Soil Science and Crop Production',
    author: 'O. O. Adeboye',
    isbn: '978-9788451949',
    publisher: 'ABSU Press',
    year: 2023,
    category: 'Agriculture',
    description:
      'A practical textbook on soil properties, fertility management, and modern crop production techniques relevant to tropical agriculture.',
    subjects: ['agriculture', 'soil science', 'crop production', 'farming'],
    location: { library: 'Main Library', floor: 'Floor 5', section: 'Section D', rack: 'Rack 3', shelf: 'Shelf 2' },
    copies: [
      { id: 'AG-001', status: 'available', location: 'Floor 5, Section D, Rack 3, Shelf 2' },
      { id: 'AG-002', status: 'available', location: 'Floor 5, Section D, Rack 3, Shelf 2' },
      { id: 'AG-003', status: 'available', location: 'Floor 5, Section D, Rack 3, Shelf 2' }
    ]
  },
  {
    id: 18,
    title: 'Principles of Accounting',
    author: 'Frank Wood, Alan Sangster',
    isbn: '978-1292242309',
    publisher: 'Pearson',
    year: 2020,
    category: 'Business',
    description:
      'A complete introduction to financial and management accounting, from basic bookkeeping to preparing and interpreting financial statements.',
    subjects: ['accounting', 'business', 'finance', 'bookkeeping'],
    location: { library: 'Main Library', floor: 'Floor 1', section: 'Section B', rack: 'Rack 4', shelf: 'Shelf 3' },
    copies: [
      { id: 'BS-601', status: 'available', location: 'Floor 1, Section B, Rack 4, Shelf 3' },
      { id: 'BS-602', status: 'borrowed', borrower: 'Adaeze Ifeanyi', dueDate: '2026-09-17', location: 'Floor 1, Section B, Rack 4, Shelf 3' }
    ]
  }
];

const withCounts = rawBooks.map((book) => {
  const totalCopies = book.copies.length;
  const availableCopies = book.copies.filter((c) => c.status === 'available').length;
  return {
    ...book,
    totalCopies,
    availableCopies,
    available: availableCopies > 0
  };
});

export const books = withCounts;

export const getBookById = (id) => books.find((b) => b.id === Number(id)) || null;

export const getCategoriesWithCounts = (source = books) => {
  const map = {};
  source.forEach((b) => {
    map[b.category] = (map[b.category] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
};

export const makeLocationString = (book) => {
  const loc = book.location;
  if (!loc) return 'Location not assigned';
  return `${loc.floor}, ${loc.section}, ${loc.rack}, ${loc.shelf}`;
};

export const nextBookId = () => (books.length ? Math.max(...books.map((b) => b.id)) + 1 : 1);

export const createBookRecord = (data, newId) => {
  const id = newId || nextBookId();
  const safeCopies = Array.isArray(data.copies) && data.copies.length
    ? data.copies
    : [{ id: `CP-${id}-001`, status: 'available', location: data.locationString || makeLocationString(data) }];
  const totalCopies = safeCopies.length;
  const availableCopies = safeCopies.filter((c) => c.status === 'available').length;
  return {
    id,
    title: data.title || 'Untitled Book',
    author: data.author || 'Unknown Author',
    isbn: data.isbn || '978-0000000000',
    publisher: data.publisher || 'Unknown Publisher',
    year: Number(data.year) || new Date().getFullYear(),
    category: data.category || 'General',
    description: data.description || 'No description provided.',
    subjects: data.subjects || [],
    location: data.location || { library: 'Main Library', floor: 'Floor 1', section: 'Section A', rack: 'Rack 1', shelf: 'Shelf 1' },
    copies: safeCopies,
    totalCopies,
    availableCopies,
    available: availableCopies > 0
  };
};
