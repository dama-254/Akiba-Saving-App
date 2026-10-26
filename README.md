# Akiba Savings

A full-stack savings bank app. Open an account, deposit money, withdraw, send money to other customers and follow every transaction on a statement. Built with Flask, PostgreSQL and React.

> **Practice project.** Akiba simulates banking. Balances live in a database and no real money is held or moved. A real bank would confirm deposits through a payment provider (for example the M-Pesa Daraja API) instead of the open deposit endpoint used here.

## Features

- **Account opening** with a unique 10-digit account number created at registration
- **Secure login** with salted password hashes, 30-minute sessions that end automatically, and a 15-minute lockout after 5 failed attempts
- **Transaction PIN**: a separate 4-digit PIN approves every withdrawal and transfer
- **Deposits, withdrawals and transfers** between customers, with a receipt after each one
- **Statement** with running balance, filters (deposits, withdrawals, sent, received) and pagination
- **Balance privacy toggle** to hide the amount on screen
- **Responsive design** that works on phones, with pop-ups that slide up from the bottom

## Built with

| Layer | Tools |
| --- | --- |
| Backend | Flask, SQLAlchemy, Flask-JWT-Extended, Flask-CORS, gunicorn |
| Database | SQLite locally, PostgreSQL in production |
| Frontend | React (Vite), React Router, plain CSS |

## How money is handled

- **Whole cents, never decimals.** Amounts are stored as integers (KES 1,250.50 is `125050`), and incoming amounts are parsed with `Decimal`, so rounding errors cannot creep in.
- **A ledger that is never edited.** Every deposit, withdrawal and transfer adds a row with its amount, the balance after it, and a unique reference. There are no endpoints to change or delete a transaction.
- **Transfers are all-or-nothing.** The debit, the credit and both ledger rows are saved in one database commit. Both sides share one reference.
- **No double spending.** Account rows are locked while a transaction runs, so two requests cannot spend the same money (enforced on PostgreSQL).
- **Limits.** KES 1,000,000 per transaction, at most 2 decimal places, no negative or zero amounts.

## Security design

- Passwords and PINs are stored only as salted hashes.
- Login answers "invalid email or password" for both unknown emails and wrong passwords, so attackers cannot discover which emails have accounts.
- Wrong PINs count toward the same lockout as wrong passwords, which matters because a 4-digit PIN has only 10,000 combinations.
- Every account route checks the logged-in user from the token. Users can only ever see and move their own money.
- The server refuses to start in production without its secret keys and an explicit frontend origin for CORS.

### Known limitations

- Lockout is per account, so someone could lock another person out on purpose. Real systems add rate limiting per IP address as well.
- The session token is kept in `sessionStorage`, which scripts running on the page can read. Production banks use `httpOnly` cookies instead.
- No email verification or password reset yet.
- Tables are created with `create_all()`. A longer-lived app should use migrations (Flask-Migrate).
- Single currency (KES). No automated tests yet.

## API

All `/api/account` routes need the header `Authorization: Bearer <token>`.

| Method | Path | Needs PIN | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | no | Health check |
| POST | `/api/auth/register` | no | Create a user and account (name, email, password, pin) |
| POST | `/api/auth/login` | no | Log in, returns token and account |
| GET | `/api/auth/me` | no | Current user and account |
| GET | `/api/account` | no | Account number and balance |
| GET | `/api/account/transactions` | no | Statement (`limit`, `offset`, `kind`) |
| POST | `/api/account/deposit` | no | Add money (simulated) |
| POST | `/api/account/withdraw` | yes | Take money out |
| POST | `/api/account/transfer` | yes | Send money to another account number |

## Run it locally

You need Python 3.12+ and Node.js.

**Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

It runs on http://127.0.0.1:5000 and creates a local SQLite database automatically.

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

It runs on http://localhost:5173.

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | backend | PostgreSQL connection string. When set, the app runs in production mode. |
| `SECRET_KEY` | backend | Flask secret (required in production) |
| `JWT_SECRET_KEY` | backend | Signs login tokens (required in production) |
| `FRONTEND_ORIGIN` | backend | The frontend's address for CORS, with no trailing slash (required in production) |
| `VITE_API_URL` | frontend | The backend's address, set at build time |

## Deployment

- **Backend on Render:** a Web Service from the `backend` folder (build `pip install -r requirements.txt`, start `gunicorn app:app`) plus a Render PostgreSQL database.
- **Frontend on Vercel:** the `frontend` folder (Vite preset), with `VITE_API_URL` pointing at the Render service. `vercel.json` makes page refreshes work.

## Project structure

```text
akiba-savings-app/
├── backend/
│   ├── app.py            # app factory and blueprint registration
│   ├── config.py         # settings and environment variables
│   ├── extensions.py     # db, jwt, cors instances
│   ├── models.py         # User, Account, Transaction
│   └── routes/
│       ├── auth.py       # register, login, me
│       └── account.py    # balance, statement, deposit, withdraw, transfer
└── frontend/
    └── src/
        ├── api/          # API client
        ├── components/   # navbar, transaction row, money pop-up
        ├── context/      # login state and auto-logout
        ├── pages/        # landing, register, login, dashboard, statement
        └── utils/        # money and date formatting
```

## Roadmap

- Savings pots for goals (the original goal-tracker idea) and monthly interest
- Rate limiting, password reset and email verification
- Automated tests for the money routes
- Real deposits through the M-Pesa Daraja API

Built by [dama-254](https://github.com/dama-254).
