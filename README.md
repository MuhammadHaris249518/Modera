# AI Content Moderation Platform

A full-stack AI-powered content moderation platform that automatically analyzes uploaded images for policy violations, provides structured moderation verdicts, supports user appeals, and enables administrators to manage moderation policies and review flagged content.

---

## Features

### User Features

* User Registration & Login
* JWT Authentication
* Image Upload & AI Moderation
* Submission History
* Appeal Submission
* Appeal Status Tracking

### Admin Features

* Admin Dashboard
* Review Moderation Appeals
* Manage Moderation Policies
* Monitor User Activity
* Override Moderation Decisions

### AI Moderation Features

The moderation engine analyzes uploaded images and produces:

* Classification Result
* Confidence Score
* Reasoning Summary
* Final Verdict

Possible outcomes:

* Approved
* Flagged for Review
* Blocked

---

# Technology Stack

## Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* ShadCN UI

## Backend

* FastAPI
* Python 3.11
* JWT Authentication
* Pydantic

## Database

* MongoDB

## AI Integration

* Google Gemini API

## DevOps

* Docker
* Docker Compose

---

# System Architecture

```text
┌─────────────────┐
│    Frontend     │
│ Next.js / React │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│     FastAPI     │
│ Business Logic  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Moderation   │
│ Gemini Service  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
```

---

# Project Structure

```bash
Modera/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── core/
│   │   ├── db/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── lib/
│   │
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local
│
├── docker-compose.yml
├── README.md
└── docs/
```

---

# Database Design

## Users

Stores:

* User information
* Credentials
* Roles

## Submissions

Stores:

* Uploaded image metadata
* Moderation results
* Verdict information
* Submission timestamps

## Appeals

Stores:

* Appeal requests
* Appeal status
* Administrative decisions

## Policies

Stores:

* Confidence thresholds
* Moderation settings
* Enforcement configurations

---

# Moderation Workflow

1. User uploads an image.
2. Backend sends image to AI moderation service.
3. AI evaluates image content.
4. Confidence scores and reasoning are generated.
5. Verdict is calculated.
6. Results are stored in MongoDB.
7. User can review verdict or submit an appeal.

---

# API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

## Submissions

```http
POST /api/submissions
GET /api/submissions
GET /api/submissions/{id}
```

## Appeals

```http
POST /api/appeals
GET /api/appeals
PATCH /api/appeals/{id}
```

## Policies

```http
GET /api/policies
PUT /api/policies/{id}
```

---

# Environment Variables

## Backend

Create a `.env` file:

```env
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=modera

JWT_SECRET_KEY=your_secret_key

GEMINI_API_KEY=your_gemini_api_key
```

## Frontend

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

# Running with Docker

## Prerequisites

* Docker
* Docker Compose

## Start Application

```bash
docker-compose up --build
```

## Services

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |
| MongoDB  | localhost:27017            |

---

# Running Locally

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend will be available at:

```text
http://localhost:3000
```

---

# Security Features

* JWT Authentication
* Password Hashing
* Role-Based Access Control
* Protected API Endpoints
* Input Validation
* Secure Environment Variables

---

# Future Improvements

* Multi-image uploads
* Analytics dashboard
* Policy versioning
* Audit logging
* Cloud storage support
* Real-time notifications

---

# Author

**Muhammad Haris**

Full Stack Developer

GitHub: https://github.com/yourusername

LinkedIn: https://linkedin.com/in/yourprofile
