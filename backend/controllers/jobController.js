const { validationResult } = require('express-validator');
const { sendStatusChangeEmail } = require('../utils/emailService');
const {
  addActivity,
  createJob,
  deleteJob,
  getJobById,
  getUserStats,
  listJobsForUser,
  listUserActivity,
  updateJob,
} = require('../utils/devStore');

const getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = listJobsForUser(req.user._id, {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
    });

    res.json({
      jobs: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    res.json(getUserStats(req.user._id));
  } catch (error) {
    next(error);
  }
};

const getJob = async (req, res, next) => {
  try {
    const job = getJobById(req.params.id, req.user._id);
    if (!job) {
      return res.status(404).json({ message: 'Job application not found.' });
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
};

const createJobHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const payload = {
      ...req.body,
      user: req.user._id,
      statusHistory: [{ status: req.body.status || 'Applied', changedAt: req.body.dateApplied || new Date().toISOString(), note: req.body.statusNote || '' }],
    };

    const job = createJob(payload);
    addActivity({
      user: req.user._id,
      action: 'JOB_CREATED',
      description: `Applied to ${job.jobTitle} at ${job.company}`,
      meta: { jobId: job._id, status: job.status },
    });

    res.status(201).json({ message: 'Job application created!', job });
  } catch (error) {
    next(error);
  }
};

const updateJobHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const job = getJobById(req.params.id, req.user._id);
    if (!job) {
      return res.status(404).json({ message: 'Job application not found.' });
    }

    const updates = { ...req.body };
    if (updates.status && updates.status !== job.status) {
      updates.statusHistory = [
        ...(job.statusHistory || []),
        { status: updates.status, changedAt: new Date().toISOString(), note: updates.statusNote || '' },
      ];

      await sendStatusChangeEmail(
        req.user.email,
        req.user.name,
        updates.jobTitle !== undefined ? updates.jobTitle : job.jobTitle,
        updates.company !== undefined ? updates.company : job.company,
        job.status,
        updates.status
      );

      addActivity({
        user: req.user._id,
        action: 'STATUS_CHANGED',
        description: `${job.jobTitle} at ${job.company}: ${job.status} -> ${updates.status}`,
        meta: { jobId: job._id, oldStatus: job.status, newStatus: updates.status },
      });
    } else {
      addActivity({
        user: req.user._id,
        action: 'JOB_UPDATED',
        description: `Updated ${updates.jobTitle !== undefined ? updates.jobTitle : job.jobTitle} at ${updates.company !== undefined ? updates.company : job.company}`,
        meta: { jobId: job._id },
      });
    }

    const updatedJob = updateJob(req.params.id, req.user._id, updates);
    res.json({ message: 'Job application updated!', job: updatedJob });
  } catch (error) {
    next(error);
  }
};

const deleteJobHandler = async (req, res, next) => {
  try {
    const job = deleteJob(req.params.id, req.user._id);
    if (!job) {
      return res.status(404).json({ message: 'Job application not found.' });
    }

    addActivity({
      user: req.user._id,
      action: 'JOB_DELETED',
      description: `Deleted application: ${job.jobTitle} at ${job.company}`,
      meta: { jobTitle: job.jobTitle, company: job.company },
    });

    res.json({ message: 'Job application deleted.' });
  } catch (error) {
    next(error);
  }
};

const aiSuggestNotes = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ message: 'AI feature not configured. Please set OPENAI_API_KEY.' });
    }

    const job = getJobById(req.params.id, req.user._id);
    if (!job) {
      return res.status(404).json({ message: 'Job application not found.' });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a career coach helping someone improve their job application notes.

Job Title: ${job.jobTitle}
Company: ${job.company}
Current Notes: ${job.notes || '(no notes yet)'}
Application Status: ${job.status}

Please suggest specific improvements to these notes. Consider:
1. Key points to highlight for follow-ups
2. Questions to prepare for interviews
3. Company research to do
4. Skills to emphasize

Keep the response concise and actionable (max 200 words).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    addActivity({
      user: req.user._id,
      action: 'AI_SUGGESTION',
      description: `AI notes suggestion for ${job.jobTitle} at ${job.company}`,
      meta: { jobId: job._id },
    });

    res.json({ suggestion: completion.choices[0].message.content });
  } catch (error) {
    if (error.code === 'invalid_api_key') {
      return res.status(400).json({ message: 'Invalid OpenAI API key.' });
    }
    next(error);
  }
};

const getActivityLog = async (req, res, next) => {
  try {
    res.json(listUserActivity(req.user._id, 50));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getStats,
  getJob,
  createJob: createJobHandler,
  updateJob: updateJobHandler,
  deleteJob: deleteJobHandler,
  aiSuggestNotes,
  getActivityLog,
};
