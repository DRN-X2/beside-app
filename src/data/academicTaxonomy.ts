export interface TaxonomyCategory {
  id: string
  name: string
  icon?: string
  topics: string[]
}

export interface SkillTaxonomyCategory {
  id: string
  name: string
  skills: string[]
}

export const ACADEMIC_INTEREST_CATEGORIES: TaxonomyCategory[] = [
  {
    id: 'tech_cs',
    name: 'Tech & Computer Science',
    topics: [
      'Web Development (Frontend & Backend)',
      'Mobile App Development (React Native / Flutter)',
      'Machine Learning & Artificial Intelligence',
      'Data Structures & Algorithms (DSA)',
      'Database Systems & SQL',
      'Cloud Computing (AWS / Azure / GCP)',
      'Cybersecurity & Ethical Hacking',
      'DevOps & System Administration',
      'Game Development (Unity / Unreal)',
      'UI/UX Design & Prototyping',
      'Data Science & Analytics',
      'Computer Networks & Protocols',
      'Software Testing & QA',
      'Computer Architecture & Assembly',
    ],
  },
  {
    id: 'sciences_math',
    name: 'Sciences & Mathematics',
    topics: [
      'Calculus (Differential & Integral)',
      'Linear Algebra & Matrices',
      'Differential Equations',
      'Statistics & Probability',
      'Discrete Mathematics',
      'Physics: Mechanics & Thermodynamics',
      'Physics: Electromagnetism & Optics',
      'Organic Chemistry & Synthesis',
      'General & Analytical Chemistry',
      'Biochemistry & Molecular Biology',
      'Cell Biology & Genetics',
      'Neuroscience',
      'Astronomy & Astrophysics',
      'Environmental & Earth Science',
      'Microbiology',
    ],
  },
  {
    id: 'healthcare_medicine',
    name: 'Healthcare & Medicine',
    topics: [
      'Anatomy & Physiology',
      'Pharmacology & Drug Classes',
      'Nursing Care Plans & Clinicals',
      'Medical Surgical Nursing (Med-Surg)',
      'Maternal & Child Health Nursing',
      'Pathology & Pathophysiology',
      'Medical Terminology & Abbreviations',
      'Public Health & Epidemiology',
      'Medical Technology & Clinical Microscopy',
      'Hematology & Blood Banking',
      'Pharmacy & Dispensing',
      'Physical Therapy & Rehabilitation',
      'Dentistry & Oral Anatomy',
      'Veterinary Medicine & Animal Care',
      'Emergency Medicine & First Aid',
    ],
  },
  {
    id: 'business_finance',
    name: 'Business, Finance & Accountancy',
    topics: [
      'Financial Accounting & Reporting (FAR)',
      'Advanced Financial Accounting (AFAR)',
      'Auditing & Assurance Principles',
      'Management Accounting & Cost Accounting',
      'Taxation & Tax Law',
      'Microeconomics & Macroeconomics',
      'Corporate Finance & Valuation',
      'Marketing & Brand Strategy',
      'Digital Marketing & Social Media',
      'Human Resource Management',
      'Supply Chain & Operations Logistics',
      'Entrepreneurship & Startups',
      'Real Estate & Property Management',
      'Business Analytics & Excel Modeling',
    ],
  },
  {
    id: 'engineering_arch',
    name: 'Engineering & Architecture',
    topics: [
      'Civil & Structural Engineering',
      'Mechanical Engineering & Kinematics',
      'Electrical Engineering & Power Systems',
      'Electronics & Circuit Design',
      'Chemical Engineering Principles',
      'Industrial Engineering & Optimization',
      'Architecture & Spatial Design',
      'Building Codes & Construction Methods',
      'CAD Drafting & 3D Modeling (AutoCAD/Revit)',
      'Geodetic Engineering & Surveying',
      'Materials Science & Metallurgy',
      'Robotics, Mechatronics & PLC',
      'Environmental & Sanitary Engineering',
    ],
  },
  {
    id: 'education_teaching',
    name: 'Education & Teaching',
    topics: [
      'Foundations of Education & Pedagogy',
      'Curriculum Development & Instructional Design',
      'Educational Psychology & Learning Styles',
      'Assessment of Learning & Exam Design',
      'Special Education (SPED) & Inclusion',
      'Early Childhood Care & Development',
      'Elementary Education Methods',
      'Secondary Education Teaching Strategies',
      'Educational Technology & LMS',
      'Classroom Management Techniques',
      'Teaching English as a Second Language (TESOL/TEFL)',
      'Physical Education & Sports Coaching',
    ],
  },
  {
    id: 'law_criminology',
    name: 'Law, Justice & Criminology',
    topics: [
      'Constitutional Law & Governance',
      'Criminal Law (Crimes & Penalties)',
      'Civil Law & Persons and Family Relations',
      'Obligations & Contracts',
      'Criminal Procedure & Evidence',
      'Criminology & Theories of Crime',
      'Criminalistics & Forensic Science',
      'Crime Scene Investigation & Dactyloscopy',
      'Penology & Correctional Administration',
      'Police Operations & Law Enforcement',
      'Human Rights & Humanitarian Law',
      'Legal Ethics & Court Procedures',
    ],
  },
  {
    id: 'social_sciences',
    name: 'Social Sciences & Humanities',
    topics: [
      'General & Abnormal Psychology',
      'Developmental Psychology (Lifespan)',
      'Psychological Assessment & Testing',
      'Sociology & Social Dynamics',
      'Political Science & Comparative Politics',
      'International Relations & Diplomacy',
      'Philosophy, Logic & Ethics',
      'World History & Civilization',
      'National History & Cultural Heritage',
      'Anthropology & Archaeology',
      'Social Work & Community Development',
      'Gender Studies & Society',
    ],
  },
  {
    id: 'languages_linguistics',
    name: 'Languages & Linguistics',
    topics: [
      'Academic English & Composition',
      'Linguistics & Phonetics',
      'Filipino & Panitikan',
      'Japanese Language (JLPT N5-N1)',
      'Spanish Language & Grammar',
      'Mandarin Chinese (HSK Prep)',
      'French Language & Pronunciation',
      'German Language (Goethe Prep)',
      'Korean Language (TOPIK Prep)',
      'Translation & Interpretation',
      'Creative Writing: Fiction & Poetry',
      'Speech & Oral Communication',
    ],
  },
  {
    id: 'arts_media',
    name: 'Arts, Design & Media',
    topics: [
      'Graphic Design & Visual Branding',
      'Digital Illustration & Painting',
      '2D & 3D Animation (Blender / Maya)',
      'Film Production, Cinematography & Directing',
      'Video Editing & Motion Graphics (Premiere / After Effects)',
      'Broadcast Journalism & TV Production',
      'Print & Online Journalism',
      'Photography & Photojournalism',
      'Music Theory, Composition & Audio Engineering',
      'Interior Design & Space Planning',
      'Fashion Design & Textiles',
      'Art History & Visual Culture',
    ],
  },
  {
    id: 'hospitality_tourism',
    name: 'Hospitality, Tourism & Culinary',
    topics: [
      'Hotel & Resort Operations Management',
      'Culinary Arts & Cooking Techniques',
      'Baking, Pastry & Confectionery',
      'Food & Beverage Service (F&B)',
      'Food Safety, Sanitation & HACCP',
      'Tourism Planning & Destination Marketing',
      'Travel Agency & Tour Guide Operations',
      'Event & Convention Management (MICE)',
      'Mixology, Bartending & Bar Management',
      'Cruise Line Operations',
    ],
  },
  {
    id: 'agriculture_forestry',
    name: 'Agriculture, Forestry & Environment',
    topics: [
      'Crop Science & Agronomy',
      'Horticulture & Plant Propagation',
      'Soil Science & Fertility Management',
      'Animal Science & Livestock Production',
      'Poultry & Swine Production',
      'Agricultural Economics & Agribusiness',
      'Fisheries & Aquaculture',
      'Forestry Management & Dendrology',
      'Entomology & Pest Management',
      'Sustainable Farming & Permaculture',
    ],
  },
  {
    id: 'aviation_maritime',
    name: 'Aviation & Maritime Studies',
    topics: [
      'Aeronautical Engineering & Aerodynamics',
      'Commercial Flight Theory & Pilot Ground School',
      'Aviation Maintenance & Avionics',
      'Air Traffic Control & Airport Ops',
      'Marine Transportation & Navigation',
      'Marine Engineering & Engine Room Ops',
      'Seamanship & Shipboard Safety (STCW)',
      'Maritime Law & Shipping Logistics',
      'Meteorology & Oceanography',
    ],
  },
  {
    id: 'vocational_trades',
    name: 'Technical, Vocational & Trades',
    topics: [
      'Shielded Metal Arc Welding (SMAW / GTAW)',
      'Automotive Servicing & Engine Mechanics',
      'Electrical Installation & Maintenance (EIM)',
      'Refrigeration & Air Conditioning (HVAC)',
      'Electronic Products Assembly & Servicing (EPAS)',
      'Carpentry & Construction Technology',
      'Plumbing & Pipefitting',
      'Machining & CNC Operations',
    ],
  },
  {
    id: 'board_prep',
    name: 'Board Exams & Review Prep',
    topics: [
      'Licensure Exam for Teachers (LET)',
      'Nursing Licensure Examination (NLE / NCLEX)',
      'Certified Public Accountant (CPA) Board',
      'Civil Service Examination (CSE Review)',
      'Medical Technologist Board Review',
      'Criminology Licensure Examination (CLE)',
      'Civil / Mech / Elec Engineering Board',
      'Philippine Bar Examination Review',
      'College Entrance Test (UPCAT / USTET / DCAT)',
    ],
  },
  {
    id: 'productivity_methods',
    name: 'Study Methods & Habits',
    topics: [
      'Active Recall & Anki Flashcard Systems',
      'Pomodoro Technique & Deep Focus Blocks',
      'Spaced Repetition Scheduling',
      'Feynman Technique & Teaching to Learn',
      'Thesis & Dissertation Research Methods',
      'Notion & Obsidian Knowledge Systems',
      'Mind Mapping & Visual Notes',
      'Speed Reading & Comprehension',
    ],
  },
]

export const ALL_PRESET_TOPICS: string[] = Array.from(
  new Set(ACADEMIC_INTEREST_CATEGORIES.flatMap((c) => c.topics))
)

export const SKILL_TAXONOMY_CATEGORIES: SkillTaxonomyCategory[] = [
  {
    id: 'programming_dev',
    name: 'Programming & Tech',
    skills: [
      'Frontend (React / HTML / Tailwind)',
      'Backend APIs (Node.js / Python / Go)',
      'Database Queries & SQL Optimization',
      'Debugging & Bug Fixing Assistance',
      'Git Commands, Branching & GitHub PRs',
      'Data Structures & Algorithm Walkthroughs',
      'Python Scripting & Data Wrangling',
      'UI/UX Wireframing in Figma',
      'Linux Terminal & Bash Scripting',
      'Docker & Container Basics',
    ],
  },
  {
    id: 'math_logic_stats',
    name: 'Math, Logic & Statistics',
    skills: [
      'Calculus Step-by-Step Solving',
      'Algebra & Matrix Operations',
      'Statistics, Probability & Hypothesis Tests',
      'SPSS / R / Stata Data Analysis',
      'Fast Mental Math & Shortcut Tricks',
      'Physics Problem Solving (Free-body diagrams)',
      'Geometry, Trigonometry & Coordinate Proofs',
      'Logic Proofs & Truth Tables',
      'Excel Formulas & Pivot Tables',
    ],
  },
  {
    id: 'writing_research',
    name: 'Writing, Language & Research',
    skills: [
      'Essay Proofreading & Grammar Editing',
      'APA, MLA & Chicago Citation Formatting',
      'Thesis Statement & Outline Structuring',
      'Literature Review Synthesis',
      'Creative Writing & Story Critique',
      'Public Speaking, Debate & Presentation Tips',
      'Conversational English Practice',
      'Foreign Language Vocabulary Flashcards',
      'Technical Report Writing & Summaries',
    ],
  },
  {
    id: 'healthcare_clinical',
    name: 'Healthcare & Clinical Skills',
    skills: [
      'Drug Dosage & IV Flow Calculations',
      'Nursing Care Plans (NANDA/NIC/NOC)',
      'Medical Terminology & Mnemonics',
      'Anatomy & Organ Systems Identification',
      'Clinical Lab Values Interpretation',
      'First Aid & Basic Life Support Principles',
      'Pharmacology Drug Class Review',
      'Sterile Technique & Patient Vitals',
    ],
  },
  {
    id: 'business_accounting',
    name: 'Business & Accountancy',
    skills: [
      'Balance Sheets & Income Statements',
      'Debit & Credit Journal Entries',
      'Tax Computation & Deductions',
      'Cost Accounting & Break-even Analysis',
      'Financial Modeling in Excel',
      'Business Pitch Deck & Marketing Strategy',
      'Microeconomics Supply & Demand Curves',
      'Case Study Analysis & SWOT Framework',
    ],
  },
  {
    id: 'engineering_cad',
    name: 'Engineering & CAD Design',
    skills: [
      'AutoCAD 2D Drafting & Detailing',
      '3D Solid Modeling (SolidWorks / Fusion 360)',
      'Statics & Structural Load Calculations',
      'Circuit Analysis (Ohm’s / Kirchhoff’s Laws)',
      'Thermodynamics Cycle Analysis',
      'Electrical Schematics & Breadboarding',
      'Revit / BIM Architectural Modeling',
    ],
  },
  {
    id: 'arts_media_design',
    name: 'Arts, Media & Visuals',
    skills: [
      'Photoshop Photo Manipulation & Posters',
      'Illustrator Vector Art & Logos',
      'Premiere Pro & DaVinci Video Cutting',
      'After Effects Motion Graphics',
      'Canva Deck & Social Media Design',
      'Camera Settings, Exposure & Framing',
      'Audio Clean-up & Podcast Editing',
    ],
  },
  {
    id: 'teaching_mentoring',
    name: 'Teaching & Study Coaching',
    skills: [
      'Feynman Concept Simplification',
      'Study Guide & Flashcard Creation',
      'Mock Quiz Preparation & Question Authoring',
      'Pomodoro Focus Partner & Timekeeping',
      'Exam Cram Schedule Optimization',
      'Anki Deck Setup & Spaced Repetition Advice',
      'Goal Setting & Milestone Tracking',
    ],
  },
  {
    id: 'law_case_briefing',
    name: 'Law, Criminology & Policy',
    skills: [
      'IRAC Case Briefing Technique',
      'Legal Research & Statutory Interpretation',
      'Criminal Law Element Breakdown',
      'Forensic Science & Evidence Handling Basics',
      'Constitutional Rights & Landmark Doctrine',
    ],
  },
]

export const ALL_PRESET_SKILLS: string[] = Array.from(
  new Set(SKILL_TAXONOMY_CATEGORIES.flatMap((c) => c.skills))
)

/**
 * Live external search fallback using Wikipedia OpenSearch API.
 * Free, zero API key, CORS enabled via origin=* parameter.
 * Used when local catalog returns few or zero matches.
 */
export async function fetchLiveTopicSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<string[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  try {
    const endpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      trimmed
    )}&limit=8&namespace=0&format=json&origin=*`

    const res = await fetch(endpoint, { signal })
    if (!res.ok) return []

    const data = await res.json()
    // OpenSearch format: [searchTerm, [titles...], [descriptions...], [urls...]]
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return (data[1] as string[])
        .filter((item) => typeof item === 'string' && item.length > 0 && !item.toLowerCase().includes('disambiguation'))
        .slice(0, 6)
    }
    return []
  } catch (err: any) {
    if (err?.name === 'AbortError') return []
    // Silent failover to empty array if offline
    return []
  }
}
