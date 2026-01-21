# Advanced Ticketing System

A full-stack ticketing platform with real-time seat locking, admin-controlled event management, and a premium UI.

## How to run (Windows + VS Code)

### 1) Set environment variables

**Backend**

Copy `server/.env.example` to `server/.env` and set real values:

```
MONGO_URI=mongodb://localhost:27017/ticketing
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
ADMIN_PASSWORD=changeme
ADMIN_JWT_SECRET=supersecret
```

**Frontend**

Copy `ticket-app/.env.example` to `ticket-app/.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2) Install dependencies

Open two terminals in VS Code:

**Terminal 1 (server):**

```
cd server
npm install
npm run start
```

**Terminal 2 (frontend):**

```
cd ticket-app
npm install
npm run dev
```

### 3) Open the app

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Troubleshooting

### MongooseError: uri must be a string

This happens when `MONGO_URI` is missing. Ensure `server/.env` exists and includes a valid `MONGO_URI`.

## Test checklist

- Login at `/admin/login`, then create and delete events in `/admin`.
- Open an event seat map, lock seats, and verify real-time updates in another browser.
- Checkout to book seats and ensure others see booked states.
