# feastMateApp

Full-stack Mobile & Web Application Development (MAD) food ordering platform with live group ordering, bill splitting, admin dashboard, and a TF-IDF + Logistic Regression NLP chatbot assistant.

## Architecture & Project Structure

| Directory | Stack | Default Port | Description |
| :--- | :--- | :--- | :--- |
| `backend/` | Node.js, Express 5, MongoDB (Mongoose) | `5000` | REST API for authentication, menu items, individual orders, group orders, and chatbot proxy (`/api/auth`, `/api/foods`, `/api/orders`, `/api/group-orders`, `/api/chat`). |
| `chatbot_ml/` | Python, Flask, scikit-learn, joblib | `5001` | TF-IDF (1–2 n-grams) + Logistic Regression intent classifier trained on `intents.json` (`/health`, `/predict`). |
| `frontend/` | React 18, Vite 6, Axios | `5173` | Single-page client with category filtering (`All`, `Burger`, `Pizza`, `Sides`, `Drinks`), cart totals, and integrated chat widget. |

## Setup & Running Locally

### 1. Backend API (`backend/`)
1. Navigate to `backend/` and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in `backend/`:
   ```env
   MONGO_URI=mongodb://localhost:27017/feastmate
   JWT_SECRET=your_jwt_secret
   PORT=5000
   CHATBOT_URL=http://localhost:5001
   ```
3. Seed sample menu items and default admin account (`admin@feastmate.com` / `admin123`):
   ```bash
   node seed.js
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. ML Chatbot Service (`chatbot_ml/`)
1. Navigate to `chatbot_ml/` and install Python dependencies:
   ```bash
   cd chatbot_ml
   pip install -r requirements.txt
   ```
2. Train the intent model and start the Flask service:
   ```bash
   python train.py
   python app.py
   ```

### 3. React Frontend (`frontend/`)
1. Navigate to `frontend/` and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Optional: set `VITE_API_URL=http://localhost:5000` in `frontend/.env`, then start the dev server:
   ```bash
   npm run dev
   ```

## Core API Endpoints
* `GET /` — API health check
* `/api/auth` — User & admin authentication (JWT + bcrypt)
* `/api/foods` — Menu catalog CRUD and category lookup
* `/api/orders` — Individual order placement and history
* `/api/group-orders` — Shared room creation, joining, and bill splitting
* `/api/chat` — Chatbot message routing to the Flask NLP microservice
