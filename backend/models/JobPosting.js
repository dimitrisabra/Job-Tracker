const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [120, 'Title too long'],
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: [100, 'Company name too long'],
    },
    companyLogo: { type: String, default: '' },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [8000, 'Description too long'],
    },
    requirements: [{ type: String, trim: true }],
    responsibilities: [{ type: String, trim: true }],
    location: { type: String, trim: true, default: 'Remote' },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Internship'],
      default: 'Full-time',
    },
    salary: { type: String, default: '' },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    tags: [{ type: String, trim: true, lowercase: true }],
    experience: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Executive'],
      default: 'Mid Level',
    },
    deadline: { type: Date },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicantCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobPostingSchema.index({ title: 'text', company: 'text', description: 'text', tags: 'text' });
jobPostingSchema.index({ isActive: 1, createdAt: -1 });
jobPostingSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('JobPosting', jobPostingSchema);
