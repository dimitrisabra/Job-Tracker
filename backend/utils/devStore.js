const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIGURED_DATA_DIR = process.env.DATA_DIR;
const DATA_DIR = CONFIGURED_DATA_DIR
  ? (path.isAbsolute(CONFIGURED_DATA_DIR)
    ? CONFIGURED_DATA_DIR
    : path.join(__dirname, '..', CONFIGURED_DATA_DIR))
  : DEFAULT_DATA_DIR;
const DATA_FILE = path.join(DATA_DIR, 'dev-db.json');
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

const SAMPLE_JOBS = [
  { jobTitle: 'Senior Frontend Engineer', company: 'Stripe', status: 'Interview', location: 'Remote', salary: '$150k-$180k', notes: 'Great culture, strong eng team. Reached out via LinkedIn. Need to review their payment APIs.' },
  { jobTitle: 'Full Stack Developer', company: 'Linear', status: 'Applied', location: 'San Francisco, CA', salary: '$130k-$160k', notes: 'Product-led company. Love their UI. Applied through their careers page.' },
  { jobTitle: 'React Developer', company: 'Vercel', status: 'Offer', location: 'Remote', salary: '$140k-$170k', notes: 'Offer received! Need to compare with other opportunities. Great team culture.' },
  { jobTitle: 'Software Engineer', company: 'Notion', status: 'Rejected', location: 'New York, NY', salary: '$120k-$150k', notes: 'Rejected after technical round. Need to work on system design skills.' },
  { jobTitle: 'Frontend Lead', company: 'Figma', status: 'Interview', location: 'San Francisco, CA', salary: '$160k-$200k', notes: 'Second round scheduled for next week. Prep design system questions.' },
  { jobTitle: 'UI Engineer', company: 'Loom', status: 'Applied', location: 'Remote', salary: '$110k-$140k', notes: '' },
  { jobTitle: 'Software Engineer II', company: 'Airbnb', status: 'Applied', location: 'San Francisco, CA', salary: '$150k+', notes: 'Applied through referral from an old colleague.' },
  { jobTitle: 'Principal Engineer', company: 'Shopify', status: 'Rejected', location: 'Remote', salary: '$180k-$220k', notes: 'Overqualified according to their feedback.' },
  { jobTitle: 'React Native Developer', company: 'Discord', status: 'Interview', location: 'Remote', salary: '$130k-$160k', notes: 'Mobile-focused role. Prepare React Native performance questions.' },
  { jobTitle: 'Staff Engineer', company: 'Atlassian', status: 'Applied', location: 'New York, NY', salary: '$170k-$200k', notes: 'Submitted via the internal referral portal.' },
];

const SECOND_USER_JOBS = [
  { jobTitle: 'VP of Engineering', company: 'TechCorp', status: 'Interview', location: 'NYC', salary: '$250k+', notes: 'Executive role, checking for culture fit.' },
  { jobTitle: 'CTO', company: 'StartupXYZ', status: 'Applied', location: 'Remote', salary: 'Equity-based', notes: 'Interesting seed-stage company.' },
];

const SAMPLE_POSTINGS = [
  {
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    description: 'Build polished product surfaces for millions of businesses using Stripe.',
    requirements: ['5+ years of frontend experience', 'Strong React and TypeScript skills', 'Experience working with design systems'],
    responsibilities: ['Ship customer-facing features', 'Collaborate with design and backend teams', 'Improve performance and accessibility'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$160k-$210k',
    salaryMin: 160000,
    salaryMax: 210000,
    tags: ['react', 'typescript', 'payments'],
    experience: 'Senior Level',
    deadlineDays: 21,
    isFeatured: true,
  },
  {
    title: 'Product Engineer',
    company: 'Linear',
    description: 'Create fast, thoughtful workflows for modern product teams.',
    requirements: ['Strong product sense', 'React and GraphQL experience'],
    responsibilities: ['Build delightful interfaces', 'Work closely with founders', 'Own features from concept to launch'],
    location: 'San Francisco, CA',
    type: 'Hybrid',
    salary: '$145k-$185k',
    salaryMin: 145000,
    salaryMax: 185000,
    tags: ['react', 'graphql', 'ux'],
    experience: 'Mid Level',
    deadlineDays: 28,
    isFeatured: true,
  },
  {
    title: 'React Native Engineer',
    company: 'Discord',
    description: 'Help shape mobile experiences for online communities around the world.',
    requirements: ['Production React Native experience', 'Strong performance mindset'],
    responsibilities: ['Build and maintain mobile features', 'Partner with product and design', 'Improve release quality'],
    location: 'Remote',
    type: 'Remote',
    salary: '$135k-$175k',
    salaryMin: 135000,
    salaryMax: 175000,
    tags: ['react-native', 'mobile', 'performance'],
    experience: 'Mid Level',
    deadlineDays: 14,
    isFeatured: false,
  },
  {
    title: 'Design Systems Lead',
    company: 'Figma',
    description: 'Lead the evolution of a multi-platform design system used across the product.',
    requirements: ['Deep design systems experience', 'People leadership experience'],
    responsibilities: ['Guide component architecture', 'Mentor engineers', 'Partner closely with design leadership'],
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$180k-$230k',
    salaryMin: 180000,
    salaryMax: 230000,
    tags: ['design-systems', 'leadership', 'frontend'],
    experience: 'Lead',
    deadlineDays: 25,
    isFeatured: true,
  },
  {
    title: 'Frontend Contractor',
    company: 'Loom',
    description: 'Help the team deliver a polished campaign microsite and analytics dashboards.',
    requirements: ['Strong React skills', 'Ability to ship quickly'],
    responsibilities: ['Implement new pages', 'Work with design assets', 'Polish responsive behavior'],
    location: 'Remote',
    type: 'Contract',
    salary: '$85-$110/hr',
    tags: ['react', 'css', 'contract'],
    experience: 'Mid Level',
    deadlineDays: 10,
    isFeatured: false,
  },
  {
    title: 'Frontend Internship',
    company: 'Notion',
    description: 'Join the product engineering team and ship meaningful UI improvements.',
    requirements: ['Strong fundamentals', 'Portfolio or side projects'],
    responsibilities: ['Build small product features', 'Write tests', 'Learn from senior teammates'],
    location: 'New York, NY',
    type: 'Internship',
    salary: '$35-$45/hr',
    tags: ['internship', 'react', 'product'],
    experience: 'Entry Level',
    deadlineDays: 30,
    isFeatured: false,
  },
  {
    title: 'Staff Frontend Engineer',
    company: 'Airbnb',
    description: 'Shape booking, host, and traveler experiences across a high-traffic frontend platform.',
    requirements: ['Strong React architecture skills', 'Experience at scale', 'Excellent product intuition'],
    responsibilities: ['Lead frontend initiatives', 'Drive technical direction', 'Partner across design, product, and backend'],
    location: 'San Francisco, CA',
    type: 'Hybrid',
    salary: '$185k-$240k',
    salaryMin: 185000,
    salaryMax: 240000,
    tags: ['react', 'platform', 'travel'],
    experience: 'Lead',
    deadlineDays: 18,
    isFeatured: true,
  },
  {
    title: 'Growth Frontend Engineer',
    company: 'Canva',
    description: 'Build fast experiments and polished acquisition flows that help more users discover Canva.',
    requirements: ['React expertise', 'Experimentation experience', 'Strong UI craftsmanship'],
    responsibilities: ['Ship growth experiments', 'Optimize conversion funnels', 'Collaborate with marketing and data teams'],
    location: 'Remote',
    type: 'Remote',
    salary: '$140k-$185k',
    salaryMin: 140000,
    salaryMax: 185000,
    tags: ['growth', 'react', 'experimentation'],
    experience: 'Mid Level',
    deadlineDays: 26,
    isFeatured: false,
  },
  {
    title: 'Frontend Platform Engineer',
    company: 'Atlassian',
    description: 'Improve frontend tooling, shared libraries, and developer workflows used across product teams.',
    requirements: ['TypeScript and tooling experience', 'Interest in DX', 'Strong communication skills'],
    responsibilities: ['Own shared platform pieces', 'Improve build performance', 'Guide best practices'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$165k-$210k',
    salaryMin: 165000,
    salaryMax: 210000,
    tags: ['platform', 'typescript', 'tooling'],
    experience: 'Senior Level',
    deadlineDays: 20,
    isFeatured: false,
  },
  {
    title: 'Senior UI Engineer',
    company: 'Framer',
    description: 'Design and ship elegant interfaces for a fast-moving visual site builder.',
    requirements: ['Excellent visual polish', 'Strong React skills', 'Motion and animation experience'],
    responsibilities: ['Build premium UI patterns', 'Work closely with design', 'Maintain component quality'],
    location: 'Amsterdam / Remote',
    type: 'Remote',
    salary: '$135k-$175k',
    salaryMin: 135000,
    salaryMax: 175000,
    tags: ['ui', 'motion', 'react'],
    experience: 'Senior Level',
    deadlineDays: 16,
    isFeatured: false,
  },
  {
    title: 'Design Systems Engineer',
    company: 'GitHub',
    description: 'Help evolve a robust component system that powers developer experiences across GitHub.',
    requirements: ['Component library experience', 'Accessibility focus', 'Strong cross-team collaboration'],
    responsibilities: ['Build primitives', 'Document patterns', 'Improve consistency across surfaces'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$155k-$205k',
    salaryMin: 155000,
    salaryMax: 205000,
    tags: ['design-systems', 'accessibility', 'react'],
    experience: 'Senior Level',
    deadlineDays: 24,
    isFeatured: true,
  },
  {
    title: 'Frontend Engineer, Commerce',
    company: 'Shopify',
    description: 'Create merchant-facing tools and workflows that make commerce simpler and faster.',
    requirements: ['Product engineering experience', 'React and GraphQL', 'Strong collaboration skills'],
    responsibilities: ['Ship merchant workflows', 'Improve UI performance', 'Build maintainable product surfaces'],
    location: 'Remote',
    type: 'Remote',
    salary: '$145k-$190k',
    salaryMin: 145000,
    salaryMax: 190000,
    tags: ['commerce', 'graphql', 'react'],
    experience: 'Mid Level',
    deadlineDays: 17,
    isFeatured: false,
  },
  {
    title: 'Senior Frontend Developer',
    company: 'Webflow',
    description: 'Build high-quality editing and publishing experiences for one of the web’s most popular site builders.',
    requirements: ['Advanced React and TypeScript', 'Strong UX sense', 'Experience with rich editors'],
    responsibilities: ['Build editor flows', 'Ship performant UI', 'Collaborate on product strategy'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$150k-$195k',
    salaryMin: 150000,
    salaryMax: 195000,
    tags: ['react', 'editor', 'typescript'],
    experience: 'Senior Level',
    deadlineDays: 22,
    isFeatured: false,
  },
  {
    title: 'Frontend Engineer, Video',
    company: 'Miro',
    description: 'Create collaborative visual experiences for distributed teams working in real time.',
    requirements: ['Strong frontend foundations', 'Real-time collaboration interest', 'Performance optimization skills'],
    responsibilities: ['Ship collaboration features', 'Improve canvas UX', 'Support large-scale frontend architecture'],
    location: 'Berlin / Remote',
    type: 'Hybrid',
    salary: '$130k-$170k',
    salaryMin: 130000,
    salaryMax: 170000,
    tags: ['collaboration', 'performance', 'react'],
    experience: 'Mid Level',
    deadlineDays: 19,
    isFeatured: false,
  },
  {
    title: 'Senior Product Engineer',
    company: 'Dropbox',
    description: 'Build polished product experiences across collaboration and file workflows.',
    requirements: ['Product engineering experience', 'React and experimentation skills', 'Good systems thinking'],
    responsibilities: ['Own product features', 'Improve conversion and engagement', 'Partner with PM and design'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$150k-$200k',
    salaryMin: 150000,
    salaryMax: 200000,
    tags: ['product', 'react', 'collaboration'],
    experience: 'Senior Level',
    deadlineDays: 29,
    isFeatured: false,
  },
  {
    title: 'Frontend Engineer, AI Products',
    company: 'OpenAI',
    description: 'Help craft intuitive interfaces for AI-powered workflows used by businesses and developers.',
    requirements: ['Excellent UI engineering fundamentals', 'Strong product taste', 'Interest in AI products'],
    responsibilities: ['Build AI interaction patterns', 'Collaborate across product and research', 'Ship fast without losing quality'],
    location: 'San Francisco, CA',
    type: 'Hybrid',
    salary: '$180k-$245k',
    salaryMin: 180000,
    salaryMax: 245000,
    tags: ['ai', 'frontend', 'product'],
    experience: 'Senior Level',
    deadlineDays: 15,
    isFeatured: true,
  },
  {
    title: 'Senior Full Stack Engineer',
    company: 'Mercury',
    description: 'Build customer-facing banking and finance experiences with a strong frontend emphasis.',
    requirements: ['Frontend-heavy full-stack experience', 'React and APIs', 'High product ownership'],
    responsibilities: ['Ship end-to-end features', 'Improve onboarding flows', 'Raise quality across the stack'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$165k-$215k',
    salaryMin: 165000,
    salaryMax: 215000,
    tags: ['fintech', 'react', 'full-stack'],
    experience: 'Senior Level',
    deadlineDays: 23,
    isFeatured: false,
  },
  {
    title: 'Frontend Engineer, Developer Tools',
    company: 'Postman',
    description: 'Improve the developer experience around testing, documentation, and API collaboration.',
    requirements: ['Modern frontend app experience', 'Strong TypeScript', 'Developer empathy'],
    responsibilities: ['Build developer tooling UIs', 'Improve workflows', 'Design clear product interactions'],
    location: 'Remote',
    type: 'Remote',
    salary: '$140k-$185k',
    salaryMin: 140000,
    salaryMax: 185000,
    tags: ['developer-tools', 'typescript', 'api'],
    experience: 'Mid Level',
    deadlineDays: 27,
    isFeatured: false,
  },
  {
    title: 'Lead Frontend Engineer',
    company: 'Calendly',
    description: 'Lead the frontend roadmap for scheduling products used by millions of professionals.',
    requirements: ['Leadership experience', 'Excellent React architecture skills', 'Strong delivery track record'],
    responsibilities: ['Lead frontend strategy', 'Mentor teammates', 'Ship critical customer workflows'],
    location: 'Remote',
    type: 'Remote',
    salary: '$175k-$225k',
    salaryMin: 175000,
    salaryMax: 225000,
    tags: ['leadership', 'react', 'saas'],
    experience: 'Lead',
    deadlineDays: 13,
    isFeatured: false,
  },
  {
    title: 'Frontend Engineer, Mobile Web',
    company: 'Pinterest',
    description: 'Craft fast, beautiful mobile web experiences focused on discovery and inspiration.',
    requirements: ['Web performance expertise', 'Responsive UI experience', 'Solid React skills'],
    responsibilities: ['Improve mobile browsing flows', 'Optimize rendering performance', 'Experiment with new interactions'],
    location: 'San Francisco, CA',
    type: 'Hybrid',
    salary: '$150k-$195k',
    salaryMin: 150000,
    salaryMax: 195000,
    tags: ['mobile-web', 'performance', 'react'],
    experience: 'Mid Level',
    deadlineDays: 18,
    isFeatured: false,
  },
  {
    title: 'Frontend Engineer, Data Visualization',
    company: 'Datadog',
    description: 'Build rich dashboards and investigative workflows for engineering teams.',
    requirements: ['Strong JavaScript fundamentals', 'Charting or data visualization experience', 'Performance mindset'],
    responsibilities: ['Create dashboard interfaces', 'Improve observability workflows', 'Handle complex UI state'],
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$155k-$205k',
    salaryMin: 155000,
    salaryMax: 205000,
    tags: ['data-viz', 'react', 'observability'],
    experience: 'Senior Level',
    deadlineDays: 25,
    isFeatured: false,
  },
  {
    title: 'Senior Frontend Engineer, Security',
    company: 'Cloudflare',
    description: 'Design intuitive interfaces for security and performance products used across the web.',
    requirements: ['Strong frontend product experience', 'Comfort with complex domain concepts', 'Excellent UI communication'],
    responsibilities: ['Build security product interfaces', 'Clarify complex workflows', 'Work across platform teams'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$160k-$210k',
    salaryMin: 160000,
    salaryMax: 210000,
    tags: ['security', 'frontend', 'platform'],
    experience: 'Senior Level',
    deadlineDays: 21,
    isFeatured: false,
  },
  {
    title: 'Product UI Engineer',
    company: 'Pitch',
    description: 'Build collaborative presentation workflows with a strong eye for interaction design.',
    requirements: ['Strong UI craft', 'React experience', 'Interest in collaborative products'],
    responsibilities: ['Implement polished interactions', 'Work with designers closely', 'Raise product quality bar'],
    location: 'Remote',
    type: 'Remote',
    salary: '$125k-$165k',
    salaryMin: 125000,
    salaryMax: 165000,
    tags: ['ui', 'collaboration', 'react'],
    experience: 'Mid Level',
    deadlineDays: 14,
    isFeatured: false,
  },
  {
    title: 'Senior Software Engineer, Frontend',
    company: 'Asana',
    description: 'Build sophisticated workflows for planning and execution across distributed organizations.',
    requirements: ['React at scale', 'Strong product ownership', 'Good collaboration habits'],
    responsibilities: ['Own product areas', 'Improve performance and UX', 'Partner across functions'],
    location: 'San Francisco, CA',
    type: 'Hybrid',
    salary: '$165k-$215k',
    salaryMin: 165000,
    salaryMax: 215000,
    tags: ['product', 'frontend', 'saas'],
    experience: 'Senior Level',
    deadlineDays: 20,
    isFeatured: false,
  },
  {
    title: 'Frontend Engineer, Onboarding',
    company: 'Ramp',
    description: 'Make onboarding and activation smoother for finance teams adopting modern tooling.',
    requirements: ['Strong product focus', 'Experimentation experience', 'React and API integration skills'],
    responsibilities: ['Improve signup journeys', 'Run onboarding experiments', 'Build resilient UI flows'],
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$155k-$200k',
    salaryMin: 155000,
    salaryMax: 200000,
    tags: ['fintech', 'onboarding', 'react'],
    experience: 'Mid Level',
    deadlineDays: 12,
    isFeatured: false,
  },
  {
    title: 'Principal Frontend Engineer',
    company: 'Slack',
    description: 'Drive the future of real-time collaboration experiences across a massive product surface.',
    requirements: ['Principal-level frontend leadership', 'Architecture at scale', 'Mentorship and influence'],
    responsibilities: ['Set frontend direction', 'Guide architecture decisions', 'Influence cross-org product quality'],
    location: 'Remote',
    type: 'Remote',
    salary: '$210k-$280k',
    salaryMin: 210000,
    salaryMax: 280000,
    tags: ['principal', 'collaboration', 'frontend'],
    experience: 'Executive',
    deadlineDays: 31,
    isFeatured: true,
  },
  {
    title: 'Senior Frontend Engineer, Creator Tools',
    company: 'Patreon',
    description: 'Help creators manage communities, memberships, and monetization with powerful product tools.',
    requirements: ['Strong React product experience', 'Empathy for creators', 'Good design collaboration'],
    responsibilities: ['Build creator dashboards', 'Improve monetization workflows', 'Ship polished UI systems'],
    location: 'Remote',
    type: 'Full-time',
    salary: '$145k-$190k',
    salaryMin: 145000,
    salaryMax: 190000,
    tags: ['creator-tools', 'react', 'dashboard'],
    experience: 'Senior Level',
    deadlineDays: 22,
    isFeatured: false,
  },
];

function createId() {
  return crypto.randomUUID();
}

function stableId(value) {
  const hash = crypto
    .createHash('sha256')
    .update(`job-tracker:${value}`)
    .digest('hex');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function dateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function dateDaysFromNow(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

function monthKey(dateValue) {
  const date = new Date(dateValue);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function normalizeIsoDate(value, options = {}) {
  if (value === null && options.allowNull) return null;
  if (value === undefined || value === '') return options.allowNull ? null : nowIso();
  return new Date(value).toISOString();
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function pruneLogs(logs) {
  const cutoff = Date.now() - NINETY_DAYS_MS;
  return (logs || []).filter((log) => new Date(log.createdAt).getTime() >= cutoff);
}

function sanitizeUser(user, options = {}) {
  if (!user) return null;
  const copy = clone(user);
  if (!options.includePassword) {
    delete copy.password;
  }
  return copy;
}

function sortItems(items, sortBy = 'createdAt', sortOrder = 'desc') {
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...items].sort((left, right) => {
    const leftValue = left?.[sortBy];
    const rightValue = right?.[sortBy];

    const leftDate = Date.parse(leftValue);
    const rightDate = Date.parse(rightValue);
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
      return (leftDate - rightDate) * direction;
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }

    return String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
      sensitivity: 'base',
    }) * direction;
  });
}

function paginate(items, page = 1, limit = 10) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
  const start = (safePage - 1) * safeLimit;

  return {
    items: items.slice(start, start + safeLimit),
    total: items.length,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(items.length / safeLimit) || 1,
  };
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error('Dev store not initialized.');
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  data.users = data.users || [];
  data.jobs = data.jobs || [];
  data.activityLogs = pruneLogs(data.activityLogs);
  data.jobPostings = data.jobPostings || [];
  return data;
}

function writeData(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function buildSamplePostings(adminId) {
  return SAMPLE_POSTINGS.map((posting, index) => {
    const createdAt = dateDaysAgo(index * 2 + 2);
    return {
      _id: stableId(`posting:${posting.company}:${posting.title}`),
      title: posting.title,
      company: posting.company,
      companyLogo: '',
      description: posting.description,
      requirements: normalizeStringArray(posting.requirements),
      responsibilities: normalizeStringArray(posting.responsibilities),
      location: posting.location || 'Remote',
      type: posting.type || 'Full-time',
      salary: posting.salary || '',
      salaryMin: posting.salaryMin ?? null,
      salaryMax: posting.salaryMax ?? null,
      tags: normalizeStringArray(posting.tags),
      experience: posting.experience || 'Mid Level',
      deadline: posting.deadlineDays ? dateDaysFromNow(posting.deadlineDays) : null,
      isActive: true,
      isFeatured: Boolean(posting.isFeatured),
      postedBy: adminId,
      applicantCount: 0,
      viewCount: 0,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

function getJobStatusCounts(jobs) {
  const stats = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Withdrawn: 0 };
  jobs.forEach((job) => {
    stats[job.status] = (stats[job.status] || 0) + 1;
  });
  return stats;
}

async function buildSeedData() {
  const adminId = stableId('user:admin@jobtracker.com');
  const alexId = stableId('user:alex@example.com');
  const sarahId = stableId('user:sarah@example.com');

  const users = [
    {
      _id: adminId,
      name: 'Admin User',
      email: 'admin@jobtracker.com',
      password: await bcrypt.hash('Admin123!', 12),
      role: 'admin',
      status: 'active',
      avatar: '',
      lastLogin: null,
      createdAt: dateDaysAgo(120),
      updatedAt: dateDaysAgo(120),
    },
    {
      _id: alexId,
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      status: 'active',
      avatar: '',
      lastLogin: null,
      createdAt: dateDaysAgo(75),
      updatedAt: dateDaysAgo(75),
    },
    {
      _id: sarahId,
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      status: 'active',
      avatar: '',
      lastLogin: null,
      createdAt: dateDaysAgo(42),
      updatedAt: dateDaysAgo(42),
    },
  ];

  const dayOffsets = [170, 155, 140, 120, 95, 82, 64, 48, 27, 12];
  const jobs = SAMPLE_JOBS.map((job, index) => {
    const appliedAt = dateDaysAgo(dayOffsets[index]);
    return {
      _id: stableId(`job:${alexId}:${job.company}:${job.jobTitle}`),
      user: alexId,
      jobPosting: null,
      ...job,
      priority: index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low',
      coverLetter: '',
      dateApplied: appliedAt,
      interviewDate: job.status === 'Interview' ? dateDaysFromNow(index + 3) : null,
      contactName: '',
      contactEmail: '',
      tags: normalizeStringArray(job.tags),
      statusHistory: [{ status: job.status, changedAt: appliedAt, note: '' }],
      createdAt: appliedAt,
      updatedAt: appliedAt,
    };
  }).concat(
    SECOND_USER_JOBS.map((job, index) => {
      const appliedAt = dateDaysAgo(index * 9 + 6);
      return {
        _id: stableId(`job:${sarahId}:${job.company}:${job.jobTitle}`),
        user: sarahId,
        jobPosting: null,
        ...job,
        priority: 'Medium',
        coverLetter: '',
        dateApplied: appliedAt,
        interviewDate: job.status === 'Interview' ? dateDaysFromNow(index + 6) : null,
        contactName: '',
        contactEmail: '',
        tags: normalizeStringArray(job.tags),
        statusHistory: [{ status: job.status, changedAt: appliedAt, note: '' }],
        createdAt: appliedAt,
        updatedAt: appliedAt,
      };
    })
  );

  const jobPostings = buildSamplePostings(adminId);

  const activityLogs = [
    { _id: stableId('activity:alex:signup'), user: alexId, action: 'SIGNUP', description: 'Account created', meta: {}, ipAddress: '', createdAt: dateDaysAgo(75), updatedAt: dateDaysAgo(75) },
    { _id: stableId('activity:alex:login'), user: alexId, action: 'LOGIN', description: 'User logged in', meta: {}, ipAddress: '', createdAt: dateDaysAgo(74), updatedAt: dateDaysAgo(74) },
    { _id: stableId('activity:alex:first-job'), user: alexId, action: 'JOB_CREATED', description: 'Applied to Senior Frontend Engineer at Stripe', meta: {}, ipAddress: '', createdAt: dateDaysAgo(70), updatedAt: dateDaysAgo(70) },
    { _id: stableId('activity:alex:status-change'), user: alexId, action: 'STATUS_CHANGED', description: 'Frontend Lead at Figma: Applied -> Interview', meta: {}, ipAddress: '', createdAt: dateDaysAgo(10), updatedAt: dateDaysAgo(10) },
    { _id: stableId('activity:sarah:signup'), user: sarahId, action: 'SIGNUP', description: 'Account created', meta: {}, ipAddress: '', createdAt: dateDaysAgo(42), updatedAt: dateDaysAgo(42) },
    { _id: stableId('activity:admin:first-posting'), user: adminId, action: 'POSTING_CREATED', description: 'Admin posted job: Senior Frontend Engineer at Stripe', meta: {}, ipAddress: '', createdAt: dateDaysAgo(2), updatedAt: dateDaysAgo(2) },
  ];

  return { users, jobs, activityLogs, jobPostings };
}

async function initStore() {
  if (!fs.existsSync(DATA_FILE)) {
    const seeded = await buildSeedData();
    writeData(seeded);
    return seeded;
  }

  const existing = readData();
  const admin = existing.users.find((user) => user.role === 'admin');
  if (admin) {
    const missingPostings = buildSamplePostings(admin._id).filter((sample) =>
      !existing.jobPostings.some((posting) =>
        posting.title === sample.title && posting.company === sample.company
      )
    );

    if (missingPostings.length) {
      existing.jobPostings.push(...missingPostings);
    }
  } else if (!existing.jobPostings.length) {
    const seeded = await buildSeedData();
    existing.jobPostings = seeded.jobPostings;
  }
  writeData(existing);
  return existing;
}

function getUserById(userId, options = {}) {
  const data = readData();
  const user = data.users.find((item) => item._id === userId);
  return sanitizeUser(user, options);
}

function getUserByEmail(email, options = {}) {
  const normalizedEmail = String(email || '').toLowerCase();
  const data = readData();
  const user = data.users.find((item) => item.email === normalizedEmail);
  return sanitizeUser(user, options);
}

async function createUser({ name, email, password, role = 'user', status = 'active' }) {
  const normalizedEmail = String(email || '').toLowerCase();
  const data = readData();

  if (data.users.some((user) => user.email === normalizedEmail)) {
    return null;
  }

  const timestamp = nowIso();
  const user = {
    _id: stableId(`user:${normalizedEmail}`),
    name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    role,
    status,
    avatar: '',
    lastLogin: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.users.push(user);
  writeData(data);
  return sanitizeUser(user);
}

function restoreSessionUser({ id, email, name, role = 'user', status = 'active' }) {
  const normalizedEmail = String(email || '').toLowerCase();
  if (!normalizedEmail) return null;

  const data = readData();
  const existing = data.users.find((user) => user._id === id || user.email === normalizedEmail);
  if (existing) return sanitizeUser(existing);

  const timestamp = nowIso();
  const user = {
    _id: id || stableId(`user:${normalizedEmail}`),
    name: name || normalizedEmail.split('@')[0],
    email: normalizedEmail,
    password: '',
    role,
    status,
    avatar: '',
    lastLogin: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.users.push(user);
  writeData(data);
  return sanitizeUser(user);
}

function updateUserProfile(userId, updates) {
  const data = readData();
  const user = data.users.find((item) => item._id === userId);
  if (!user) return null;

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.email !== undefined) user.email = String(updates.email).toLowerCase();
  user.updatedAt = nowIso();

  writeData(data);
  return sanitizeUser(user);
}

async function updateUserPassword(userId, password) {
  const data = readData();
  const user = data.users.find((item) => item._id === userId);
  if (!user) return null;

  user.password = await bcrypt.hash(password, 12);
  user.updatedAt = nowIso();
  writeData(data);

  return sanitizeUser(user);
}

function setUserLastLogin(userId) {
  const data = readData();
  const user = data.users.find((item) => item._id === userId);
  if (!user) return null;

  user.lastLogin = nowIso();
  user.updatedAt = nowIso();
  writeData(data);
  return sanitizeUser(user);
}

function listUsers({ page = 1, limit = 10, search, status } = {}) {
  const data = readData();
  let users = data.users.filter((user) => user.role === 'user');

  if (status && status !== 'All') {
    users = users.filter((user) => user.status === status);
  }

  if (search) {
    const term = String(search).toLowerCase();
    users = users.filter((user) =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }

  const jobsByUser = data.jobs.reduce((acc, job) => {
    acc[job.user] = (acc[job.user] || 0) + 1;
    return acc;
  }, {});

  const withCounts = sortItems(users, 'createdAt', 'desc').map((user) => ({
    ...sanitizeUser(user),
    jobCount: jobsByUser[user._id] || 0,
  }));

  return paginate(withCounts, page, limit);
}

function addActivity({ user, action, description, meta = {}, ipAddress = '' }) {
  const data = readData();
  const timestamp = nowIso();
  const log = {
    _id: createId(),
    user,
    action,
    description,
    meta,
    ipAddress,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.activityLogs = pruneLogs([...(data.activityLogs || []), log]);
  writeData(data);
  return clone(log);
}

function listUserActivity(userId, limit = 50) {
  const data = readData();
  return sortItems(
    data.activityLogs.filter((log) => log.user === userId),
    'createdAt',
    'desc'
  ).slice(0, limit).map(clone);
}

function listSystemActivity(limit = 100) {
  const data = readData();
  const usersById = Object.fromEntries(data.users.map((user) => [user._id, user]));

  return sortItems(data.activityLogs, 'createdAt', 'desc')
    .slice(0, limit)
    .map((log) => ({
      ...clone(log),
      user: usersById[log.user] ? {
        _id: usersById[log.user]._id,
        name: usersById[log.user].name,
        email: usersById[log.user].email,
      } : null,
    }));
}

function matchesJobSearch(job, searchTerm) {
  if (!searchTerm) return true;
  const term = String(searchTerm).toLowerCase();
  return [job.jobTitle, job.company, job.notes, job.priority, ...(job.tags || [])].some((value) =>
    String(value || '').toLowerCase().includes(term)
  );
}

function matchesStatus(item, status) {
  if (!status || status === 'All') return true;
  return item.status === status;
}

function listJobsForUser(userId, { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
  const data = readData();
  const jobs = data.jobs.filter((job) =>
    job.user === userId &&
    matchesStatus(job, status) &&
    matchesJobSearch(job, search)
  );

  const sorted = sortItems(jobs, sortBy, sortOrder).map(clone);
  return paginate(sorted, page, limit);
}

function getJobById(jobId, userId) {
  const data = readData();
  const job = data.jobs.find((item) => item._id === jobId && (!userId || item.user === userId));
  return job ? clone(job) : null;
}

function createJob(jobInput) {
  const data = readData();
  const timestamp = nowIso();
  const appliedAt = jobInput.dateApplied ? new Date(jobInput.dateApplied).toISOString() : timestamp;

  const job = {
    _id: createId(),
    user: jobInput.user,
    jobPosting: jobInput.jobPosting || null,
    jobTitle: jobInput.jobTitle,
    company: jobInput.company,
    status: jobInput.status || 'Applied',
    priority: jobInput.priority || 'Medium',
    notes: jobInput.notes || '',
    coverLetter: jobInput.coverLetter || '',
    dateApplied: appliedAt,
    interviewDate: normalizeIsoDate(jobInput.interviewDate, { allowNull: true }),
    location: jobInput.location || '',
    salary: jobInput.salary || '',
    jobUrl: jobInput.jobUrl || '',
    contactName: jobInput.contactName || '',
    contactEmail: jobInput.contactEmail || '',
    tags: normalizeStringArray(jobInput.tags),
    statusHistory: jobInput.statusHistory || [{ status: jobInput.status || 'Applied', changedAt: appliedAt, note: jobInput.statusNote || '' }],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.jobs.push(job);
  writeData(data);
  return clone(job);
}

function updateJob(jobId, userId, updates) {
  const data = readData();
  const job = data.jobs.find((item) => item._id === jobId && item.user === userId);
  if (!job) return null;

  const fields = ['jobTitle', 'company', 'status', 'priority', 'notes', 'coverLetter', 'dateApplied', 'interviewDate', 'location', 'salary', 'jobUrl', 'contactName', 'contactEmail', 'tags', 'statusHistory', 'jobPosting'];
  fields.forEach((field) => {
    if (updates[field] !== undefined) {
      if (field === 'dateApplied') {
        job[field] = normalizeIsoDate(updates[field]);
      } else if (field === 'interviewDate') {
        job[field] = normalizeIsoDate(updates[field], { allowNull: true });
      } else if (field === 'tags') {
        job[field] = normalizeStringArray(updates[field]);
      } else {
        job[field] = updates[field];
      }
    }
  });

  job.updatedAt = nowIso();
  writeData(data);
  return clone(job);
}

function deleteJob(jobId, userId) {
  const data = readData();
  const index = data.jobs.findIndex((item) => item._id === jobId && item.user === userId);
  if (index === -1) return null;

  const [deletedJob] = data.jobs.splice(index, 1);
  writeData(data);
  return clone(deletedJob);
}

function getUserStats(userId) {
  const data = readData();
  const userJobs = data.jobs.filter((job) => job.user === userId);
  const byStatus = getJobStatusCounts(userJobs);

  const total = userJobs.length;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyGroups = userJobs
    .filter((job) => new Date(job.dateApplied) >= sixMonthsAgo)
    .reduce((acc, job) => {
      const key = monthKey(job.dateApplied);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = Object.entries(monthlyGroups)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      return {
        month: `${monthNames[parseInt(month, 10) - 1]} ${year}`,
        count,
      };
    });

  return { total, byStatus, monthly };
}

function getUserDetail(userId) {
  const user = getUserById(userId);
  if (!user) return null;

  return {
    user,
    jobStats: getJobStatusCounts(readData().jobs.filter((job) => job.user === userId)),
    activityLogs: listUserActivity(userId, 20),
  };
}

function updateUserStatus(userId, status) {
  const data = readData();
  const user = data.users.find((item) => item._id === userId);
  if (!user) return null;

  user.status = status;
  user.updatedAt = nowIso();
  writeData(data);
  return sanitizeUser(user);
}

function deleteUserCascade(userId) {
  const data = readData();
  const userIndex = data.users.findIndex((item) => item._id === userId);
  if (userIndex === -1) return null;

  const [user] = data.users.splice(userIndex, 1);
  data.jobs = data.jobs.filter((job) => job.user !== userId);
  data.activityLogs = data.activityLogs.filter((log) => log.user !== userId);
  writeData(data);

  return sanitizeUser(user);
}

function listAllJobs({ page = 1, limit = 10, status, search } = {}) {
  const data = readData();
  const usersById = Object.fromEntries(data.users.map((user) => [user._id, user]));

  const jobs = data.jobs
    .filter((job) => matchesStatus(job, status))
    .filter((job) => matchesJobSearch(job, search))
    .map((job) => ({
      ...clone(job),
      user: usersById[job.user] ? {
        _id: usersById[job.user]._id,
        name: usersById[job.user].name,
        email: usersById[job.user].email,
      } : null,
    }));

  return paginate(sortItems(jobs, 'createdAt', 'desc'), page, limit);
}

function getAdminStats() {
  const data = readData();
  const regularUsers = data.users.filter((user) => user.role === 'user');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const jobsByStatus = getJobStatusCounts(data.jobs);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const growthGroups = regularUsers
    .filter((user) => new Date(user.createdAt) >= sixMonthsAgo)
    .reduce((acc, user) => {
      const key = monthKey(user.createdAt);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const userGrowth = Object.entries(growthGroups)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => {
      const [, month] = key.split('-');
      return {
        month: monthNames[parseInt(month, 10) - 1],
        users: count,
      };
    });

  return {
    users: {
      total: regularUsers.length,
      active: regularUsers.filter((user) => user.status === 'active').length,
      suspended: regularUsers.filter((user) => user.status === 'suspended').length,
      newThisMonth: regularUsers.filter((user) => new Date(user.createdAt) >= startOfMonth).length,
    },
    jobs: {
      total: data.jobs.length,
      byStatus: jobsByStatus,
      newThisMonth: data.jobs.filter((job) => new Date(job.createdAt) >= startOfMonth).length,
    },
    userGrowth,
  };
}

function populatePosting(posting, usersById) {
  const user = usersById[posting.postedBy];
  return {
    ...clone(posting),
    postedBy: user ? {
      _id: user._id,
      name: user.name,
      email: user.email,
    } : null,
  };
}

function matchesPostingSearch(posting, searchTerm) {
  if (!searchTerm) return true;
  const term = String(searchTerm).toLowerCase();
  return [posting.title, posting.company, posting.description, ...(posting.tags || [])].some((value) =>
    String(value || '').toLowerCase().includes(term)
  );
}

function listPublicPostings({ page = 1, limit = 12, search, type, location, experience, sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
  const data = readData();
  const usersById = Object.fromEntries(data.users.map((user) => [user._id, user]));
  let postings = data.jobPostings.filter((posting) => posting.isActive);

  if (type && type !== 'All') postings = postings.filter((posting) => posting.type === type);
  if (experience && experience !== 'All') postings = postings.filter((posting) => posting.experience === experience);
  if (location && location !== 'All') {
    const term = String(location).toLowerCase();
    postings = postings.filter((posting) => posting.location.toLowerCase().includes(term));
  }

  postings = postings
    .filter((posting) => matchesPostingSearch(posting, search))
    .sort((left, right) => Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured)))
    .map((posting) => populatePosting(posting, usersById));

  postings = sortItems(postings, sortBy, sortOrder).sort((left, right) => Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured)));
  return paginate(postings, page, limit);
}

function listAdminPostings({ page = 1, limit = 10, search, isActive } = {}) {
  const data = readData();
  const usersById = Object.fromEntries(data.users.map((user) => [user._id, user]));
  let postings = [...data.jobPostings];

  if (isActive !== undefined && isActive !== 'All') {
    const desired = isActive === true || isActive === 'true';
    postings = postings.filter((posting) => posting.isActive === desired);
  }

  postings = postings
    .filter((posting) => matchesPostingSearch(posting, search))
    .map((posting) => populatePosting(posting, usersById));

  return paginate(sortItems(postings, 'createdAt', 'desc'), page, limit);
}

function getPostingById(postingId, options = {}) {
  const data = readData();
  const posting = data.jobPostings.find((item) => item._id === postingId);
  if (!posting) return null;

  if (options.incrementView) {
    posting.viewCount = (posting.viewCount || 0) + 1;
    posting.updatedAt = nowIso();
    writeData(data);
  }

  const usersById = Object.fromEntries(data.users.map((user) => [user._id, user]));
  return populatePosting(posting, usersById);
}

function createPosting(postingInput, postedBy) {
  const data = readData();
  const timestamp = nowIso();
  const posting = {
    _id: createId(),
    title: postingInput.title,
    company: postingInput.company,
    companyLogo: postingInput.companyLogo || '',
    description: postingInput.description,
    requirements: normalizeStringArray(postingInput.requirements),
    responsibilities: normalizeStringArray(postingInput.responsibilities),
    location: postingInput.location || 'Remote',
    type: postingInput.type || 'Full-time',
    salary: postingInput.salary || '',
    salaryMin: postingInput.salaryMin ?? null,
    salaryMax: postingInput.salaryMax ?? null,
    tags: normalizeStringArray(postingInput.tags),
    experience: postingInput.experience || 'Mid Level',
    deadline: normalizeIsoDate(postingInput.deadline, { allowNull: true }),
    isActive: postingInput.isActive !== undefined ? Boolean(postingInput.isActive) : true,
    isFeatured: Boolean(postingInput.isFeatured),
    postedBy,
    applicantCount: 0,
    viewCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.jobPostings.push(posting);
  writeData(data);
  return clone(posting);
}

function updatePosting(postingId, updates) {
  const data = readData();
  const posting = data.jobPostings.find((item) => item._id === postingId);
  if (!posting) return null;

  const fields = ['title', 'company', 'companyLogo', 'description', 'location', 'type', 'salary', 'salaryMin', 'salaryMax', 'experience', 'isActive', 'isFeatured'];
  fields.forEach((field) => {
    if (updates[field] !== undefined) posting[field] = updates[field];
  });

  if (updates.requirements !== undefined) posting.requirements = normalizeStringArray(updates.requirements);
  if (updates.responsibilities !== undefined) posting.responsibilities = normalizeStringArray(updates.responsibilities);
  if (updates.tags !== undefined) posting.tags = normalizeStringArray(updates.tags);
  if (updates.deadline !== undefined) posting.deadline = normalizeIsoDate(updates.deadline, { allowNull: true });

  posting.updatedAt = nowIso();
  writeData(data);
  return clone(posting);
}

function deletePosting(postingId) {
  const data = readData();
  const index = data.jobPostings.findIndex((item) => item._id === postingId);
  if (index === -1) return null;

  const [posting] = data.jobPostings.splice(index, 1);
  writeData(data);
  return clone(posting);
}

function togglePosting(postingId) {
  const data = readData();
  const posting = data.jobPostings.find((item) => item._id === postingId);
  if (!posting) return null;

  posting.isActive = !posting.isActive;
  posting.updatedAt = nowIso();
  writeData(data);
  return clone(posting);
}

function hasUserAppliedToPosting(userId, postingId) {
  const data = readData();
  return data.jobs.some((job) => job.user === userId && job.jobPosting === postingId);
}

function incrementPostingApplicantCount(postingId, delta = 1) {
  const data = readData();
  const posting = data.jobPostings.find((item) => item._id === postingId);
  if (!posting) return null;

  posting.applicantCount = Math.max((posting.applicantCount || 0) + delta, 0);
  posting.updatedAt = nowIso();
  writeData(data);
  return clone(posting);
}

module.exports = {
  DATA_FILE,
  initStore,
  getUserById,
  getUserByEmail,
  createUser,
  restoreSessionUser,
  updateUserProfile,
  updateUserPassword,
  setUserLastLogin,
  listUsers,
  addActivity,
  listUserActivity,
  listSystemActivity,
  listJobsForUser,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getUserStats,
  getUserDetail,
  updateUserStatus,
  deleteUserCascade,
  listAllJobs,
  getAdminStats,
  listPublicPostings,
  listAdminPostings,
  getPostingById,
  createPosting,
  updatePosting,
  deletePosting,
  togglePosting,
  hasUserAppliedToPosting,
  incrementPostingApplicantCount,
};
