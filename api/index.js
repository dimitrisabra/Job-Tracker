process.env.DATA_DIR = process.env.DATA_DIR || '/tmp/job-tracker-data';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.TRUST_PROXY = process.env.TRUST_PROXY || 'true';

module.exports = require('../backend/server');
