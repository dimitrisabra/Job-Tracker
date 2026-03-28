const { validationResult } = require('express-validator');
const {
  addActivity,
  createJob,
  createPosting: createPostingStore,
  deletePosting: deletePostingStore,
  getPostingById,
  hasUserAppliedToPosting,
  incrementPostingApplicantCount,
  listAdminPostings,
  listPublicPostings,
  togglePosting: togglePostingStore,
  updatePosting: updatePostingStore,
} = require('../utils/devStore');

const getPublicPostings = async (req, res, next) => {
  try {
    const result = listPublicPostings(req.query);
    res.json({
      postings: result.items,
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

const getPosting = async (req, res, next) => {
  try {
    const posting = getPostingById(req.params.id, { incrementView: true });
    if (!posting) {
      return res.status(404).json({ message: 'Job posting not found.' });
    }

    const alreadyApplied = req.user ? hasUserAppliedToPosting(req.user._id, req.params.id) : false;
    res.json({ ...posting, alreadyApplied });
  } catch (error) {
    next(error);
  }
};

const applyToPosting = async (req, res, next) => {
  try {
    const posting = getPostingById(req.params.id);
    if (!posting || !posting.isActive) {
      return res.status(404).json({ message: 'Job posting not found or no longer active.' });
    }

    if (hasUserAppliedToPosting(req.user._id, req.params.id)) {
      return res.status(409).json({ message: 'You have already applied to this position.' });
    }

    const { coverLetter, notes } = req.body;
    const appliedAt = new Date().toISOString();
    const job = createJob({
      user: req.user._id,
      jobPosting: posting._id,
      jobTitle: posting.title,
      company: posting.company,
      status: 'Applied',
      priority: 'Medium',
      location: posting.location,
      salary: posting.salary,
      coverLetter: coverLetter || '',
      notes: notes || '',
      tags: posting.tags || [],
      dateApplied: appliedAt,
      statusHistory: [{ status: 'Applied', changedAt: appliedAt, note: '' }],
    });

    incrementPostingApplicantCount(posting._id, 1);
    addActivity({
      user: req.user._id,
      action: 'JOB_APPLIED',
      description: `Applied to ${posting.title} at ${posting.company} via job board`,
      meta: { jobId: job._id, postingId: posting._id },
    });

    res.status(201).json({
      message: `Successfully applied to ${posting.title} at ${posting.company}!`,
      job,
    });
  } catch (error) {
    next(error);
  }
};

const adminGetPostings = async (req, res, next) => {
  try {
    const result = listAdminPostings(req.query);
    res.json({
      postings: result.items,
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

const createPosting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const posting = createPostingStore(req.body, req.user._id);
    addActivity({
      user: req.user._id,
      action: 'POSTING_CREATED',
      description: `Admin posted job: ${posting.title} at ${posting.company}`,
      meta: { postingId: posting._id },
    });

    res.status(201).json({ message: 'Job posting created!', posting });
  } catch (error) {
    next(error);
  }
};

const updatePosting = async (req, res, next) => {
  try {
    const posting = updatePostingStore(req.params.id, req.body);
    if (!posting) {
      return res.status(404).json({ message: 'Posting not found.' });
    }

    res.json({ message: 'Posting updated!', posting });
  } catch (error) {
    next(error);
  }
};

const deletePosting = async (req, res, next) => {
  try {
    const posting = deletePostingStore(req.params.id);
    if (!posting) {
      return res.status(404).json({ message: 'Posting not found.' });
    }

    res.json({ message: 'Posting deleted.' });
  } catch (error) {
    next(error);
  }
};

const togglePosting = async (req, res, next) => {
  try {
    const posting = togglePostingStore(req.params.id);
    if (!posting) {
      return res.status(404).json({ message: 'Posting not found.' });
    }

    res.json({ message: `Posting ${posting.isActive ? 'activated' : 'deactivated'}.`, posting });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicPostings,
  getPosting,
  applyToPosting,
  adminGetPostings,
  createPosting,
  updatePosting,
  deletePosting,
  togglePosting,
};
