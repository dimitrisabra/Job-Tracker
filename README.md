# 📋 JobTracker — Full-Stack Job Application Tracker

A complete, production-ready job application tracking system with user and admin roles, built with React, Node.js, Express, and MongoDB.

---

## ✨ Features

### User Features
- 📊 **Dashboard** — Visual stats (total, interviews, offers, rejected) with bar & pie charts
- 💼 **Applications CRUD** — Add, edit, delete job applications with full details
- 🔍 **Search & Filter** — Search by title/company/notes, filter by status, sort by multiple fields
- 📄 **Pagination** — Efficient paginated results
- 🔔 **Email Notifications** — Mocked email on status change (real SMTP ready)
- 🤖 **AI Notes Suggestions** — OpenAI-powered improvements for application notes
- 📋 **Activity Log** — Full history of all user actions
- 👤 **Profile Management** — Update name, email, and password

### Admin Features
- ⚡ **Admin Dashboard** — Platform-wide analytics and user growth charts
- 👥 **User Management** — View, suspend, activate, and delete users
- 🗂️ **All Applications** — View and filter every application in the system
- 📈 **Analytics** — Status breakdowns, monthly growth, key metrics

### Tech Highlights
- 🔐 JWT authentication with role-based route protection
- 🔒 Password hashing with bcrypt (12 rounds)
- ⚡ Rate limiting (100 req/15 min per IP)
- 📱 Fully responsive — mobile + desktop
- 🌙 Dark theme with clean modern UI

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or [Atlas](https://mongodb.com/atlas))
- npm or yarn

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd job-tracker
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/job-tracker
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
OPENAI_API_KEY=sk-your-openai-key   # Optional — for AI notes feature
FRONTEND_URL=http://localhost:5173
```

**Seed sample data (optional but recommended):**

```bash
npm run seed
```

This creates:
| Role  | Email | Password |
|-------|-------|----------|
| Admin | admin@jobtracker.com | Admin123! |
| User  | alex@example.com | password123 |
| User  | sarah@example.com | password123 |

**Start the backend:**

```bash
npm run dev    # Development with nodemon
npm start      # Production
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

> The Vite dev server proxies `/api` requests to `localhost:5000` automatically.

---

## 📁 Project Structure

```
job-tracker/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Signup, login, getMe
│   │   ├── jobController.js       # CRUD, stats, AI suggest
│   │   ├── userController.js      # Profile, password
│   │   └── adminController.js     # Admin analytics, user mgmt
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + adminOnly
│   │   └── errorHandler.js        # Global error handling
│   ├── models/
│   │   ├── User.js                # User schema + bcrypt hooks
│   │   ├── Job.js                 # Job application schema
│   │   └── ActivityLog.js         # Audit trail (90-day TTL)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── emailService.js        # Nodemailer email notifications
│   │   └── seedData.js            # Development seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── LoadingScreen.jsx  # Loading screen + Spinner
│   │   │   │   ├── Pagination.jsx     # Reusable pagination
│   │   │   │   └── StatusBadge.jsx    # Job status badges
│   │   │   ├── jobs/
│   │   │   │   └── JobModal.jsx       # Add/edit job modal + AI
│   │   │   └── layout/
│   │   │       ├── Layout.jsx         # App shell
│   │   │       └── Sidebar.jsx        # Navigation sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx          # Stats + charts
│   │   │   ├── Jobs.jsx               # Application list + CRUD
│   │   │   ├── Profile.jsx            # Profile + password
│   │   │   ├── ActivityLog.jsx        # User activity history
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       └── AdminJobs.jsx
│   │   ├── services/
│   │   │   └── api.js                 # Axios + all API calls
│   │   ├── App.jsx                    # Router + route guards
│   │   └── index.css                  # Tailwind + custom styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## 📘 API Documentation

### Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, get JWT |
| GET | `/auth/me` | ✅ | Get current user |

**POST `/auth/signup`**
```json
{ "name": "Alex Johnson", "email": "alex@example.com", "password": "password123" }
```
Response: `{ token, user: { _id, name, email, role, status } }`

**POST `/auth/login`**
```json
{ "email": "alex@example.com", "password": "password123" }
```
Response: `{ token, user: { _id, name, email, role, status, lastLogin } }`

---

### 💼 Jobs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/jobs` | ✅ | List user's jobs (paginated) |
| GET | `/jobs/stats` | ✅ | Dashboard statistics |
| GET | `/jobs/activity` | ✅ | User activity log |
| GET | `/jobs/:id` | ✅ | Get single job |
| POST | `/jobs` | ✅ | Create job |
| PUT | `/jobs/:id` | ✅ | Update job |
| DELETE | `/jobs/:id` | ✅ | Delete job |
| POST | `/jobs/:id/ai-suggest` | ✅ | AI notes suggestion |

**GET `/jobs` — Query params:**
```
?page=1&limit=10&status=Applied&search=stripe&sortBy=createdAt&sortOrder=desc
```

**POST `/jobs` — Body:**
```json
{
  "jobTitle": "Senior Engineer",
  "company": "Stripe",
  "status": "Applied",
  "notes": "Applied via referral",
  "dateApplied": "2024-08-15",
  "location": "Remote",
  "salary": "$150k–$180k",
  "jobUrl": "https://stripe.com/jobs/123"
}
```

---

### 👤 Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✅ | Get profile |
| PUT | `/users/profile` | ✅ | Update name/email |
| PUT | `/users/change-password` | ✅ | Change password |
| GET | `/users/activity` | ✅ | Activity log |

---

### ⚡ Admin (Admin role required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | ✅ Admin | Platform analytics |
| GET | `/admin/users` | ✅ Admin | All users (paginated) |
| GET | `/admin/users/:id` | ✅ Admin | User detail + jobs |
| PATCH | `/admin/users/:id/status` | ✅ Admin | Suspend/activate user |
| DELETE | `/admin/users/:id` | ✅ Admin | Delete user + data |
| GET | `/admin/jobs` | ✅ Admin | All jobs (paginated) |
| GET | `/admin/activity` | ✅ Admin | System activity log |

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for JWT signing (keep secure!) |
| `JWT_EXPIRES_IN` | ❌ | Token expiry (default: `7d`) |
| `PORT` | ❌ | Server port (default: `5000`) |
| `NODE_ENV` | ❌ | `development` or `production` |
| `FRONTEND_URL` | ❌ | CORS allowed origin |
| `EMAIL_HOST` | ❌ | SMTP host |
| `EMAIL_PORT` | ❌ | SMTP port |
| `EMAIL_USER` | ❌ | SMTP email address |
| `EMAIL_PASS` | ❌ | SMTP password or app password |
| `OPENAI_API_KEY` | ❌ | For AI notes suggestions |

---

## 🚢 Deployment

### Backend (Railway / Render / Fly.io)

1. Set all environment variables in the platform dashboard
2. Set `NODE_ENV=production`
3. Set `FRONTEND_URL=https://your-frontend.vercel.app`
4. Deploy from your Git repo

### Frontend (Vercel / Netlify)

1. Update `vite.config.js` proxy OR set `VITE_API_URL` env var
2. In `src/services/api.js`, change `baseURL` to your backend URL:
   ```js
   baseURL: import.meta.env.VITE_API_URL || '/api'
   ```
3. Deploy frontend to Vercel/Netlify

### MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Whitelist your server's IP
3. Copy the connection string to `MONGODB_URI`

---

## 🤖 AI Feature Setup

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add `OPENAI_API_KEY=sk-...` to your `.env`
3. In the Jobs page → Edit a job → click **🤖 AI Suggest**

The AI analyzes the job title, company, and current notes, then suggests improvements including interview prep, follow-up points, and research areas.

---

## 🧪 Sample Test Data

After running `npm run seed` in the backend:

- **Admin account**: Full admin dashboard access
- **Alex's account**: 10 pre-populated job applications across all statuses, spanning 6 months of data for realistic chart visualization
- **Sarah's account**: 2 applications for additional variety

---

## 📝 License

MIT — free to use, modify, and distribute.
