require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const JobPosting = require('../models/JobPosting');
const ActivityLog = require('../models/ActivityLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-tracker';

const jobPostings = [
  {
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    description: 'We are looking for a Senior Frontend Engineer to join our payments team. You will build beautiful, scalable interfaces used by millions of businesses worldwide.\n\nYou will work closely with designers, product managers, and backend engineers to craft user experiences that are intuitive and performant.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'Performance optimization experience', 'Experience with design systems', 'Strong CSS skills'],
    responsibilities: ['Build and maintain React components', 'Drive frontend architecture decisions', 'Mentor junior engineers', 'Collaborate with design team', 'Write comprehensive tests'],
    location: 'San Francisco, CA / Remote',
    type: 'Full-time',
    salary: '$150,000 – $200,000',
    salaryMin: 150000, salaryMax: 200000,
    tags: ['react', 'typescript', 'javascript', 'css', 'frontend'],
    experience: 'Senior Level',
    isFeatured: true,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Full Stack Developer',
    company: 'Linear',
    description: 'Linear is building the future of project management. We\'re looking for a Full Stack Developer who can work across our entire stack — from snappy React UIs to rock-solid Node.js APIs.\n\nYou\'ll be working on a product used by tens of thousands of engineering teams globally.',
    requirements: ['3+ years Node.js', '3+ years React', 'PostgreSQL or MongoDB experience', 'REST/GraphQL API design', 'Good product sense'],
    responsibilities: ['Build features end-to-end', 'Design and implement APIs', 'Optimize database queries', 'Participate in code review', 'Ship fast with quality'],
    location: 'Remote',
    type: 'Remote',
    salary: '$130,000 – $170,000',
    salaryMin: 130000, salaryMax: 170000,
    tags: ['nodejs', 'react', 'fullstack', 'postgresql', 'graphql'],
    experience: 'Mid Level',
    isFeatured: true,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Product Designer',
    company: 'Figma',
    description: 'Figma is hiring a Product Designer to help shape the future of design tools. You will work on core product experiences that designers use every day.\n\nWe believe design is a team sport. You will collaborate deeply with engineers and PMs.',
    requirements: ['5+ years product design', 'Proficiency in Figma', 'Portfolio of shipped products', 'Systems thinking', 'User research experience'],
    responsibilities: ['Own end-to-end design for key features', 'Conduct user research', 'Build and maintain design systems', 'Partner with engineering', 'Facilitate design critiques'],
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$140,000 – $185,000',
    salaryMin: 140000, salaryMax: 185000,
    tags: ['design', 'ux', 'ui', 'figma', 'product'],
    experience: 'Senior Level',
    isFeatured: false,
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Backend Engineer',
    company: 'Vercel',
    description: 'Join Vercel\'s infrastructure team and help build the platform that powers the modern web. You will work on high-scale distributed systems that serve billions of requests per day.',
    requirements: ['Experience with Go or Rust', 'Distributed systems knowledge', 'Cloud infrastructure (AWS/GCP)', 'Database optimization', 'Strong CS fundamentals'],
    responsibilities: ['Build scalable backend services', 'Optimize deployment pipelines', 'Improve system reliability', 'Write internal tooling', 'On-call rotation'],
    location: 'Remote',
    type: 'Remote',
    salary: '$160,000 – $210,000',
    salaryMin: 160000, salaryMax: 210000,
    tags: ['golang', 'rust', 'distributed-systems', 'aws', 'backend'],
    experience: 'Senior Level',
    isFeatured: true,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Data Scientist',
    company: 'Airbnb',
    description: 'Airbnb\'s data science team powers decisions across the company — from pricing algorithms to trust and safety models. We\'re looking for a Data Scientist to join our Growth team.',
    requirements: ['Strong statistics background', 'Python / R proficiency', 'SQL expertise', 'A/B testing experience', 'ML model development'],
    responsibilities: ['Design and analyze experiments', 'Build predictive models', 'Partner with product on metrics', 'Communicate findings to leadership', 'Develop data pipelines'],
    location: 'San Francisco, CA',
    type: 'Hybrid',
    salary: '$140,000 – $180,000',
    salaryMin: 140000, salaryMax: 180000,
    tags: ['python', 'sql', 'machine-learning', 'statistics', 'data-science'],
    experience: 'Mid Level',
    isFeatured: false,
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'DevOps Engineer',
    company: 'Shopify',
    description: 'Shopify\'s platform team is looking for a DevOps Engineer to help us scale infrastructure for millions of merchants. You will own reliability, deployment automation, and observability.',
    requirements: ['Kubernetes experience', 'Terraform / IaC', 'CI/CD pipeline design', 'Monitoring (Datadog/Grafana)', 'Linux systems expertise'],
    responsibilities: ['Manage Kubernetes clusters', 'Improve deployment reliability', 'Build internal dev tools', 'Define SLOs and SLIs', 'Incident response'],
    location: 'Remote',
    type: 'Remote',
    salary: '$130,000 – $165,000',
    salaryMin: 130000, salaryMax: 165000,
    tags: ['kubernetes', 'devops', 'terraform', 'cicd', 'aws'],
    experience: 'Mid Level',
    isFeatured: false,
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'iOS Engineer',
    company: 'Duolingo',
    description: 'Duolingo is on a mission to make language learning accessible to everyone. We\'re looking for an iOS Engineer to help build delightful learning experiences for our 50M+ daily active users.',
    requirements: ['Swift expertise', 'UIKit and SwiftUI', 'Performance optimization', 'App Store publishing', 'Accessibility best practices'],
    responsibilities: ['Build iOS app features', 'Improve app performance', 'Write unit and UI tests', 'Collaborate with designers', 'Ship frequent updates'],
    location: 'Pittsburgh, PA / Remote',
    type: 'Hybrid',
    salary: '$120,000 – $155,000',
    salaryMin: 120000, salaryMax: 155000,
    tags: ['swift', 'ios', 'mobile', 'swiftui', 'apple'],
    experience: 'Mid Level',
    isFeatured: false,
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Engineering Manager',
    company: 'Notion',
    description: 'Notion is looking for an Engineering Manager to lead one of our core product teams. You will manage a team of 6-8 engineers, drive technical direction, and partner with product leadership.',
    requirements: ['3+ years engineering management', 'Track record of shipping products', 'Strong technical background', 'Experience with agile methodologies', 'Excellent communication skills'],
    responsibilities: ['Lead and grow engineering team', 'Drive technical roadmap', 'Partner with PM and design', 'Recruit top engineering talent', 'Foster engineering culture'],
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$200,000 – $260,000',
    salaryMin: 200000, salaryMax: 260000,
    tags: ['management', 'leadership', 'engineering', 'agile', 'react'],
    experience: 'Manager',
    isFeatured: false,
    deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
  },
];

const sampleJobs = [
  { jobTitle: 'Senior Frontend Engineer', company: 'Stripe', status: 'Interview', location: 'Remote', salary: '$150k–$180k', priority: 'High', tags: ['react', 'typescript'], notes: 'Great culture, strong eng team. Reached out via LinkedIn.', coverLetter: 'I am excited about this opportunity...' },
  { jobTitle: 'Full Stack Developer', company: 'Linear', status: 'Applied', location: 'San Francisco, CA', salary: '$130k–$160k', priority: 'High', tags: ['nodejs', 'react'], notes: 'Product-led company. Love their UI.' },
  { jobTitle: 'React Developer', company: 'Vercel', status: 'Offer', location: 'Remote', salary: '$140k–$170k', priority: 'High', tags: ['react', 'nextjs'], notes: 'Offer received! Need to compare with other opportunities.' },
  { jobTitle: 'Software Engineer', company: 'Notion', status: 'Rejected', location: 'New York, NY', salary: '$120k–$150k', priority: 'Medium', tags: ['javascript', 'python'], notes: 'Rejected after technical round.' },
  { jobTitle: 'Frontend Lead', company: 'Figma', status: 'Interview', location: 'San Francisco, CA', salary: '$160k–$200k', priority: 'High', tags: ['react', 'design-systems'], notes: 'Second round scheduled for next week.', interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { jobTitle: 'UI Engineer', company: 'Loom', status: 'Applied', location: 'Remote', salary: '$110k–$140k', priority: 'Low', tags: ['vue', 'css'], notes: '' },
  { jobTitle: 'Software Engineer II', company: 'Airbnb', status: 'Applied', location: 'San Francisco, CA', salary: '$150k+', priority: 'Medium', tags: ['react', 'python'], notes: 'Applied through referral from old colleague.' },
  { jobTitle: 'Principal Engineer', company: 'Shopify', status: 'Rejected', location: 'Remote', salary: '$180k–$220k', priority: 'Medium', tags: ['ruby', 'architecture'], notes: 'Overqualified according to their feedback.' },
  { jobTitle: 'React Native Developer', company: 'Discord', status: 'Interview', location: 'Remote', salary: '$130k–$160k', priority: 'Medium', tags: ['react-native', 'mobile'], notes: 'Mobile-focused role.', interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
  { jobTitle: 'Staff Engineer', company: 'Atlassian', status: 'Withdrawn', location: 'New York, NY', salary: '$170k–$200k', priority: 'Low', tags: ['java', 'microservices'], notes: 'Withdrew — accepted different offer.' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Promise.all([User.deleteMany({}), Job.deleteMany({}), JobPosting.deleteMany({}), ActivityLog.deleteMany({})]);
    console.log('🗑️  Cleared existing data');

    const admin = await User.create({ name: 'Admin User', email: 'admin@jobtracker.com', password: 'Admin123!', role: 'admin', status: 'active' });
    console.log('👑 Admin: admin@jobtracker.com / Admin123!');

    const user1 = await User.create({ name: 'Alex Johnson', email: 'alex@example.com', password: 'password123', role: 'user', status: 'active' });
    console.log('👤 User: alex@example.com / password123');

    const user2 = await User.create({ name: 'Sarah Chen', email: 'sarah@example.com', password: 'password123', role: 'user', status: 'active' });
    console.log('👤 User: sarah@example.com / password123');

    // Create job postings (posted by admin)
    const createdPostings = await JobPosting.insertMany(
      jobPostings.map((p) => ({ ...p, postedBy: admin._id }))
    );
    console.log(`📌 Created ${createdPostings.length} job postings`);

    // Create job applications for user1
    const jobsToCreate = sampleJobs.map((job, i) => {
      const daysAgo = Math.floor(Math.random() * 150);
      const dateApplied = new Date();
      dateApplied.setDate(dateApplied.getDate() - daysAgo);
      return { ...job, user: user1._id, dateApplied, statusHistory: [{ status: job.status }] };
    });
    await Job.insertMany(jobsToCreate);
    console.log(`📋 Created ${jobsToCreate.length} job applications for Alex`);

    // Create a couple for user2
    await Job.insertMany([
      { jobTitle: 'VP of Engineering', company: 'TechCorp', status: 'Interview', user: user2._id, dateApplied: new Date(), location: 'NYC', salary: '$250k+', priority: 'High', tags: ['leadership'], statusHistory: [{ status: 'Interview' }] },
      { jobTitle: 'Product Manager', company: 'StartupXYZ', status: 'Applied', user: user2._id, dateApplied: new Date(), location: 'Remote', salary: 'Equity-based', priority: 'Medium', tags: ['product'], statusHistory: [{ status: 'Applied' }] },
    ]);

    await ActivityLog.insertMany([
      { user: user1._id, action: 'SIGNUP', description: 'Account created' },
      { user: user1._id, action: 'LOGIN', description: 'User logged in' },
      { user: user1._id, action: 'JOB_CREATED', description: 'Applied to Senior Frontend Engineer at Stripe' },
      { user: user1._id, action: 'STATUS_CHANGED', description: 'Frontend Lead at Figma: Applied → Interview' },
      { user: user2._id, action: 'SIGNUP', description: 'Account created' },
    ]);

    console.log('\n✅ Seed completed!');
    console.log('   Admin:  admin@jobtracker.com / Admin123!');
    console.log('   User 1: alex@example.com / password123');
    console.log('   User 2: sarah@example.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
