# Sovereign Bank – MERN Online Banking System

Features: registration & login (JWT, bcrypt), auto-issued account number, deposit, withdraw,
transfer by account number, statement, admin console (view clients, freeze/unfreeze).

## Run
Requires Node 18+ and MongoDB (local or Atlas).

1. Backend
   cd server && npm install && npm run dev
   (edit server/.env — set MONGO_URI and JWT_SECRET)
2. Frontend (new terminal)
   cd client && npm install && npm run dev
3. Open http://localhost:5173

Admin: register using the email set as ADMIN_EMAIL in server/.env (default admin@royalbank.com).
