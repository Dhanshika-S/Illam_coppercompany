# Illam – Traditional Living

Illam is a React/Vite storefront with an Express, MongoDB Atlas, and Mongoose API.
The existing storefront pages are protected by a server-verified session; the
login, account creation, and password recovery screens reuse the existing
login-page design.

## Local setup

1. Copy `.env.example` to `.env` if you do not already have a local `.env`, then
   set `MONGO_URI` to the existing Atlas connection string and choose a long,
   random `JWT_SECRET`. Do not replace an existing database URI or commit `.env`.
2. Set `EMAIL_USER` to the Gmail account used for password recovery and
   `EMAIL_PASS` to that account's Google App Password. `CLIENT_URL` must be the
   exact frontend origin (the default Vite origin is `http://localhost:5173`).
3. In one terminal run `npm run start:api`.
4. In another terminal run `npm run dev`, then open `http://localhost:5173`.

The API uses an HTTP-only, same-site JWT cookie; the browser stores only the
display profile. Password-reset codes are six digits, expire after five
minutes, and are stored as keyed hashes. Password reset is authorized by a
short-lived one-time token issued only after code verification.

## Authentication API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`

The existing product, cart, and order API routes remain in place. Cart and order
routes continue to require authentication.

## Verification

Run `npm run lint` and `npm run build` for source checks. Complete registration,
login, refresh, logout, and password recovery against the configured MongoDB
Atlas and Gmail SMTP credentials to verify the live integrations; OTP delivery
cannot be confirmed without an actual configured Gmail App Password.
