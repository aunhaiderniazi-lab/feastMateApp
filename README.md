# feastMateApp

A full-stack food ordering app with group ordering, bill splitting, an admin dashboard, and an NLP chatbot.

## Architecture

| Directory | Stack | Port | Description |
| :--- | :--- | :--- | :--- |
| `backend/` | Node.js, Express 5, MongoDB (Mongoose) | 5000 | REST API for auth, menu items, orders, group orders and the chatbot proxy |
| `chatbot_ml/` | Python, Flask, scikit-learn | 5001 | Intent classifier (TF-IDF + Logistic Regression) trained on `intents.json` |
| `frontend/` | React 18, Vite 6, Axios | 5173 | Menu with category filters, cart and chat widget |

## Setup

### 1. Backend (`backend/`)

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URI=mongodb://localhost:27017/feastmate
JWT_SECRET=your_jwt_secret
PORT=5000
CHATBOT_URL=http://localhost:5001
```

Seed sample menu items and create the admin account. The admin password is set in `seed.js`. Change it before you deploy.

```bash
node seed.js
npm run dev
```

### 2. Chatbot (`chatbot_ml/`)

```bash
cd chatbot_ml
pip install -r requirements.txt
python train.py
python app.py
```

### 3. Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

Optional: set `VITE_API_URL=http://localhost:5000` in `frontend/.env`.

## API endpoints

- `GET /` : health check
- `/api/auth` : user and admin login (JWT)
- `/api/foods` : menu items
- `/api/orders` : individual orders
- `/api/group-orders` : shared orders and bill splitting
- `/api/chat` : chatbot messages
