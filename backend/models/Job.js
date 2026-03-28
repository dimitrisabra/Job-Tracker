const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobPosting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      default: null,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title too long'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name too long'],
    },
    status: {
      type: String,
      enum: ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
      default: 'Applied',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    notes: { type: String, trim: true, maxlength: [5000], default: '' },
    coverLetter: { type: String, trim: true, maxlength: [5000], default: '' },
    dateApplied: { type: Date, required: true, default: Date.now },
    interviewDate: { type: Date, default: null },
    location: { type: String, trim: true, maxlength: [100], default: '' },
    salary: { type: String, trim: true, default: '' },
    jobUrl: { type: String, trim: true, default: '' },
    contactName: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true, lowercase: true }],
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

jobSchema.index({ jobTitle: 'text', company: 'text', notes: 'text' });
jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ user: 1, createdAt: -1 });
jobSchema.index({ interviewDate: 1, user: 1 });

module.exports = mongoose.model('Job', jobSchema);
