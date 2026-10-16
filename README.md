# Quotexx full-stack starter (React + Express + MongoDB)

## What is included
- `client`: React user application with signup/login, account, support, deposit **requests**, and embedded preserved trading-chart UI from the earlier HTML build.
- `admin`: React admin dashboard with role-gated access, records, search-ready list views, edit controls, CRUD for configuration, and audit records.
- `server`: Express REST API, Mongoose models, bcrypt password hashes, JWT authentication, role authorization, rate limiting, and input validation.

**This is a functional integration starter, NOT a production trading/payment system.** Chart prices, trades, and payouts in the legacy iframe are simulated and are NOT saved to MongoDB. The deposit request API stores a pending request, does not collect funds, verify bank transfers, or credit a balance. Withdrawal requests similarly do not transfer funds. Do not represent it as real-money trading.

## Requirements
Node.js 20+, MongoDB 7+ (local or Atlas), npm.

## Setup
1. `cp server/.env.example server/.env` and configure MongoDB URL, a random JWT secret (32+ characters), and strong admin credentials.
2. From project root: `npm install`
3. `npm run seed -w server` (creates initial admin, pairs and bonus configuration)
4. `npm run dev`
5. User site: http://localhost:5173 ; Admin: http://localhost:5174 ; API: http://localhost:4000/api/health

## API routes
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`
- `GET /api/pairs`, `GET /api/notices`, `GET /api/me/overview`
- `POST /api/me/deposits`, `POST /api/me/withdrawals`, `POST /api/me/tickets`
- `GET /api/admin/overview`
- `GET /api/admin/:entity` (users, deposits, withdrawals, trades, pairs, bonuses, tickets, notices, settings, audit)
- `POST /api/admin/:entity` (pairs, bonuses, notices, settings only)
- `PATCH /api/admin/:entity/:id` (allowlisted fields only)
- `DELETE /api/admin/:entity/:id` (configuration entities only)

## Important deployment work remaining
- Implement payment provider callbacks with signatures, idempotency, ledger accounting, and reconciliation. Never credit funds from unverified client requests.
- Connect trading engine to licensed data, server-authoritative pricing, risk controls, and settlement; do not use browser simulation as authoritative.
- Add real Google OAuth via a registered Google Cloud client; no fake Google login.
- Add refresh-token rotation, MFA for admin, CSRF strategy if using cookies, tests, monitoring, backup, HTTPS, and regulatory/legal review before handling real money.
- Use strict schema validation for admin configuration changes, pagination/search, and database transactions for all balance movements.
- This package intentionally preserves the existing trading preview UI in `client/public/legacy.html`, rather than falsely claiming its old local JavaScript is backed by the server.
