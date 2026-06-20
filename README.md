# AI Content Moderation Platform

A full-stack AI-powered content moderation platform that automatically analyzes uploaded images for policy violations, provides structured moderation verdicts, supports user appeals, and enables administrators to manage moderation policies and review flagged content.

## 🔗 Quick Links

* 🎥 **Demo Video:** https://drive.google.com/file/d/1Vk4xPetkZFP1pO5qVXTuiaBqZbqvKm4V/view?usp=sharing
* 📂 **Repository:** https://github.com/MuhammadHaris249518/Modera

---

## 📖 Overview

This project was developed as part of a Full-Stack Engineering Internship Assessment.

The platform allows users to upload images for AI-powered moderation screening while providing administrators with tools to review appeals, manage moderation policies, and oversee platform activity.

The application demonstrates full-stack development, REST API design, authentication and authorization, MongoDB data modeling, AI integration, and Dockerized deployment.

---

## ✨ Features

### 👤 User Features

* User Registration & Login
* Secure JWT Authentication
* Image Upload & Moderation
* View Submission History
* Submit Appeals Against Decisions
* Track Appeal Status

### 🛡️ Admin Features

* Admin Dashboard
* Review Appeals Queue
* Policy Configuration Management
* User Monitoring
* Manual Verdict Overrides
* Moderation Control Panel

### 🤖 AI Moderation Features

The moderation engine analyzes uploaded images and generates:

* Classification Result
* Confidence Score
* Reasoning Summary
* Final Verdict

Possible outcomes:

* ✅ Approved
* ⚠️ Flagged for Review
* ❌ Blocked

---

# 🏗️ Technology Stack

## Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* ShadCN UI
* Axios

## Backend

* FastAPI
* Python 3.11
* Pydantic
* JWT Authentication

## Database

* MongoDB

## AI Integration

* Google Gemini API

## DevOps

* Docker
* Docker Compose

---

# 🏛️ System Architecture

```text
┌─────────────────────────┐
│      Frontend           │
│   Next.js + React       │
└────────────┬────────────┘
             │ REST API
             ▼
┌─────────────────────────┐
│       FastAPI           │
│   Business Logic Layer  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   AI Moderation Layer   │
│      Gemini API         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       MongoDB           │
│    Persistent Storage   │
└─────────────────────────┘
```

---

# 📂 Project Structure

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

# 🗄️ Database Design

## Users Collection

Stores:

* User Profile Information
* Authentication Credentials
* User Roles

## Submissions Collection

Stores:

* Uploaded Image Metadata
* Moderation Results
* Verdict Information
* Submission Timestamps

## Appeals Collection

Stores:

* Appeal Requests
* User Justification
* Appeal Status
* Administrative Decisions

## Policies Collection

Stores:

* Confidence Thresholds
* Moderation Rules
* Category Configuration

---

# 🔄 Moderation Workflow

### Step 1 – Upload

The user uploads an image through the web interface.

### Step 2 – AI Analysis

The backend forwards the image to the AI moderation service.

### Step 3 – Classification

The AI evaluates the image and produces:

* Classification Results
* Confidence Scores
* Reasoning Summaries

### Step 4 – Verdict Generation

The moderation engine determines whether the image should be:

* Approved
* Flagged for Review
* Blocked

### Step 5 – Storage

Results are stored in MongoDB and become available in the user's submission history.

### Step 6 – Appeals

Users can challenge moderation decisions through the appeal system.

---

# 🔐 Authentication & Authorization

The platform uses JWT-based authentication and role-based access control.

### User Permissions

* Upload Images
* View Personal History
* Submit Appeals
* Track Appeal Status

### Admin Permissions

* Review Appeals
* Configure Policies
* Manage Moderation Decisions
* Access Administrative Features

---

# 🌐 API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

## Submissions

```http
POST /api/submissions
GET  /api/submissions
GET  /api/submissions/{id}
```

## Appeals

```http
POST  /api/appeals
GET   /api/appeals
PATCH /api/appeals/{id}
```

## Policies

```http
GET /api/policies
PUT /api/policies/{id}
```

---

# ⚙️ Environment Variables

## Backend (.env)

```env
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=modera

JWT_SECRET_KEY=your_secret_key

GEMINI_API_KEY=your_gemini_api_key
```

## Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

# 🚀 Running with Docker

## Prerequisites

* Docker
* Docker Compose

## Start the Application

```bash
docker-compose up --build
```

## Available Services

| Service           | URL                        |
| ----------------- | -------------------------- |
| Frontend          | http://localhost:3000      |
| Backend API       | http://localhost:8000      |
| API Documentation | http://localhost:8000/docs |
| MongoDB           | localhost:27017            |

---

# 💻 Running Locally

## Backend Setup

```bash
cd backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Backend

```bash
uvicorn app.main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend will run at:

```text
http://localhost:3000
```

---

# 🔒 Security Features

* JWT Authentication
* Password Hashing
* Protected API Routes
* Role-Based Access Control
* Input Validation
* Environment Variable Configuration

---

# 🚧 Future Improvements

* Multi-Image Upload Support
* Analytics Dashboard
* Policy Versioning
* Audit Logs
* Cloud Storage Integration
* Real-Time Notifications
* Advanced Reporting

---

# 🎯 Assessment Objectives Covered

* Full-Stack Web Development
* REST API Design
* MongoDB Data Modeling
* Authentication & Authorization
* AI Integration
* Appeal Workflow
* Administrative Controls
* Dockerized Deployment
* Clean Software Architecture

---

# 👨‍💻 Author

**Muhammad Haris**

Full Stack Developer

GitHub: https://github.com/MuhammadHaris249518

LinkedIn: https://linkedin.com/in/your-linkedin-profile
