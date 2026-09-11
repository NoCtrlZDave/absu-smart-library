export const FACULTIES = [
  {
    name: 'College of Engineering',
    departments: [
      'Electrical/Electronic Engineering',
      'Civil Engineering',
      'Mechanical Engineering',
      'Computer Engineering',
      'Agricultural Engineering',
    ],
  },
  {
    name: 'College of Physical Sciences',
    departments: [
      'Computer Science',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Statistics',
      'Geology',
    ],
  },
  {
    name: 'College of Biological Sciences',
    departments: [
      'Microbiology',
      'Biochemistry',
      'Zoology',
      'Plant Science & Biotechnology',
      'Genetics & Biotechnology',
    ],
  },
  {
    name: 'College of Health Sciences',
    departments: [
      'Medicine & Surgery',
      'Nursing Science',
      'Public Health',
      'Physiology',
      'Anatomy',
      'Medical Laboratory Science',
    ],
  },
  {
    name: 'College of Law',
    departments: ['Law'],
  },
  {
    name: 'College of Management Sciences',
    departments: [
      'Business Administration',
      'Accountancy',
      'Economics',
      'Banking & Finance',
      'Marketing',
      'Public Administration',
    ],
  },
  {
    name: 'College of Humanities & Social Sciences',
    departments: [
      'English Language & Literature',
      'History & International Studies',
      'Sociology',
      'Psychology',
      'Mass Communication',
      'Philosophy',
      'Fine & Applied Arts',
    ],
  },
  {
    name: 'College of Agriculture & Veterinary Medicine',
    departments: [
      'Animal Science',
      'Crop Science',
      'Soil Science',
      'Agricultural Economics',
      'Veterinary Medicine',
    ],
  },
  {
    name: 'College of Education',
    departments: [
      'Educational Foundations',
      'Arts & Social Sciences Education',
      'Science Education',
      'Primary Education',
      'Physical & Health Education',
    ],
  },
];

export const getDepartmentsForFaculty = (facultyName) => {
  const faculty = FACULTIES.find((f) => f.name === facultyName);
  return faculty ? faculty.departments : [];
};

export const initialStudents = [
  {
    id: 'stu-1001',
    name: 'Adaeze Uche',
    matric: '2024/131001/regular',
    faculty: 'College of Physical Sciences',
    department: 'Computer Science',
    createdAt: '2025-10-03',
  },
  {
    id: 'stu-1002',
    name: 'Emeka Nwankwo',
    matric: '2023/131002/regular',
    faculty: 'College of Engineering',
    department: 'Computer Engineering',
    createdAt: '2025-10-03',
  },
  {
    id: 'stu-1003',
    name: 'Blessing Okafor',
    matric: '2022/131003/regular',
    faculty: 'College of Health Sciences',
    department: 'Nursing Science',
    createdAt: '2025-10-04',
  },
  {
    id: 'stu-1004',
    name: 'Chinedu Eze',
    matric: '2025/131004/regular',
    faculty: 'College of Management Sciences',
    department: 'Accountancy',
    createdAt: '2025-10-05',
  },
  {
    id: 'stu-1005',
    name: 'Ngozi Ebere',
    matric: '2026/131005/regular',
    faculty: 'College of Law',
    department: 'Law',
    createdAt: '2025-10-06',
  },
  {
    id: 'stu-1006',
    name: 'Ifeanyi Ogbonna',
    matric: '2021/131006/regular',
    faculty: 'College of Biological Sciences',
    department: 'Microbiology',
    createdAt: '2025-10-06',
  },
  {
    id: 'stu-1007',
    name: 'Kelechi Anyanwu',
    matric: '2024/131007/regular',
    faculty: 'College of Humanities & Social Sciences',
    department: 'Mass Communication',
    createdAt: '2025-10-08',
  },
  {
    id: 'stu-1008',
    name: 'Somto Okpara',
    matric: '2023/131008/regular',
    faculty: 'College of Agriculture & Veterinary Medicine',
    department: 'Animal Science',
    createdAt: '2025-10-09',
  },
];