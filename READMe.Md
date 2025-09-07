EzBook — Backend README
Overview

Express + Mongoose backend API for EzBook. Handles users, facilities, bookings, manager overview, file uploads, email notifications.

Prerequisites

Node 18+ / npm 9+

MongoDB connection string

Cloudinary account (if using)

SMTP or transactional email service (for sending verification & booking emails)

Required env variables

PORT=10000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_SMTP_HOST=...
EMAIL_SMTP_PORT=...
EMAIL_SMTP_USER=...
EMAIL_SMTP_PASS=...
FRONTEND_URL=https://your-frontend.netlify.app  # for redirects

npm install

# dev (nodemon)
npm run dev

# production
npm start


Important routes (summary)

User

POST /api/user/register — register (sends email verification)

GET /api/user/verify-email?token=... — email verification

POST /api/user/login — local login -> returns { token, user }

POST /api/user/google-login — google login endpoint

GET /api/user/me — authenticated (JWT), returns user

PATCH /api/user/me/avatar — authenticated, upload avatar (multer & Cloudinary)

Facilities

GET /api/facility — list facilities (filters, pagination). For manager, it returns only facilities they created (via req.user).

GET /api/facility/:id — get facility by id

POST /api/facility — create facility (requires manager/admin)

PUT /api/facility/:id — update facility (manager must own facility)

DELETE /api/facility/:id — delete facility (manager must own facility)

Bookings

POST /api/bookings — create booking

GET /api/bookings — manager/admin listing (use filter / sort query params)

GET /api/bookings/mine — user-specific bookings

PUT /api/bookings/:id — manager approves/cancels booking (permission checks)

PATCH /api/bookings/user/:id — user updates/cancels own booking

GET /api/bookings/mine/pdf — export bookings as PDF

Manager

GET /api/manager/overview — manager analytics: total facilities, bookings, pending approvals, recent notifications

Models

UserModel — { userName, email, password, role: ['user','manager','admin'], isVerified, avatar, verificationToken, verificationTokenExpires }

FacilityModel — { name, description, type, location, price, availability, pictures: [], createdBy, ... }

BookingModel — { userId, facilityId, date, startTime, endTime, package, status }

Middleware

authenticate — verifies JWT, attaches sanitized req.user (with userId, role)

authorize(roles) — checks req.user.role is allowed

errorHandler — centralized error handling for Express

