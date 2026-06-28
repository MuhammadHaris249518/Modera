# AI Content Moderation Platform

A full-stack AI-powered content moderation platform that automatically analyzes uploaded images for policy violations, provides structured moderation verdicts, supports user appeals, and enables administrators to manage moderation policies and review flagged content.

<<<<<<< HEAD
## Key Features

### Dual AI Model Architecture

**Primary: Google Gemini API**
- Advanced image understanding
- Detailed reasoning and explanations
- 3 retry attempts with exponential backoff
- Automatic failover on errors

**Fallback: Hugging Face CLIP (Local)**
- Zero API costs, no billing required
- Runs entirely on your hardware
- Automatic activation when Gemini fails
- Threshold-based content detection
- Multiple category detection simultaneously
=======
## 🔗 Quick Links

* 🎥 **Demo Video:** https://drive.google.com/file/d/1Vk4xPetkZFP1pO5qVXTuiaBqZbqvKm4V/view?usp=sharing
* 📂 **Repository:** https://github.com/MuhammadHaris249518/Modera

---

## 📖 Overview
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

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
* Confidence Score (0-100)
* Reasoning Summary
* Final Verdict
* Multiple category detection
* Threshold-based decisions

**Detection Categories:**
- Safe Image
- Violence
- Weapon
- Adult Content
- Drugs

<<<<<<< HEAD
**Possible outcomes:**
- Approved
- Flagged for Review
- Blocked
=======
* ✅ Approved
* ⚠️ Flagged for Review
* ❌ Blocked
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

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

* **Primary:** Google Gemini API (cloud-based)
* **Fallback:** Hugging Face CLIP (local inference)
  - Model: `openai/clip-vit-base-patch32`
  - No API key required
  - CPU/CUDA support

## DevOps

* Docker
* Docker Compose

---

# 🏛️ System Architecture

```text
<<<<<<< HEAD
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
┌─────────────────────────────────────┐
│      AI Moderation Engine           │
│  ┌───────────────────────────────┐  │
│  │ 1. Google Gemini API (Primary)│  │
│  │    - 3 retry attempts         │  │
│  │    - Exponential backoff      │  │
│  └───────────┬───────────────────┘  │
│              │ On failure            │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │ 2. Hugging Face CLIP (Fallback)│ │
│  │    - Local inference          │  │
│  │    - No API key needed        │  │
│  │    - Threshold-based decisions│  │
│  └───────────┬───────────────────┘  │
│              │ On failure            │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │ 3. Basic Metadata (Last Resort)│ │
│  │    - Image size/brightness    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
=======
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
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b
```

---

<<<<<<< HEAD
# Moderation Flow

## Primary Flow (Gemini API)

1. User uploads an image
2. Backend encodes image to base64
3. Sends to Gemini API with moderation prompt
4. Gemini analyzes and returns JSON response
5. Response is parsed and normalized
6. Results stored in MongoDB
7. User receives verdict

## Fallback Flow (Hugging Face CLIP)

If Gemini fails (timeout, rate limit, 403, network error):

1. System automatically switches to Hugging Face
2. CLIP model classifies image against 5 categories
3. Each category evaluated against threshold (default: 60%)
4. Multiple categories can be flagged simultaneously
5. Results converted to project format
6. If HF also fails, uses basic metadata fallback

## Threshold-Based Decision Making

```python
WEAPON_THRESHOLD = 0.60    # 60% confidence
VIOLENCE_THRESHOLD = 0.60  # 60% confidence
ADULT_THRESHOLD = 0.60     # 60% confidence
DRUG_THRESHOLD = 0.60      # 60% confidence
```

**Logic:**
- If ANY harmful category exceeds its threshold → `status: "harmful"`
- Otherwise → `status: "safe"`
- Multiple categories can be triggered simultaneously

---

# Project Structure
=======
# 📂 Project Structure
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

```bash
Modera/
│
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   │   ├── ai_service.py              # Main AI orchestration
│   │   │   └── huggingface_service.py     # HF CLIP fallback
│   │   ├── core/             # Configuration & security
│   │   ├── db/               # Database connection
│   │   └── main.py           # FastAPI app entry
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   ├── services/         # API clients
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilities
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
<<<<<<< HEAD
- User information
- Credentials (hashed passwords)
- Roles (user/admin)
- Email verification status
=======

* User Profile Information
* Authentication Credentials
* User Roles
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

## Submissions Collection

Stores:
<<<<<<< HEAD
- Uploaded image metadata
- Moderation results (from AI)
- Verdict information
- Confidence scores
- Submission timestamps
- AI provider used (gemini/huggingface/basic_fallback)
=======

* Uploaded Image Metadata
* Moderation Results
* Verdict Information
* Submission Timestamps
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

## Appeals Collection

Stores:
<<<<<<< HEAD
- Appeal requests
- Appeal status (pending/approved/rejected)
- Administrative decisions
- Appeal reasoning
=======

* Appeal Requests
* User Justification
* Appeal Status
* Administrative Decisions
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

## Policies Collection

Stores:
<<<<<<< HEAD
- Confidence thresholds
- Moderation settings
- Enforcement configurations
- Category-specific rules
=======

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
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

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
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=moderation_db

# Security
SECRET_KEY=your-secret-key-here

# AI Configuration
AI_PROVIDER=gemini  # Options: gemini, local_fallback
GEMINI_API_KEY=your_gemini_api_key  # Optional - uses HF fallback if missing
GEMINI_MODEL=gemini-3.5-flash

# CORS
FRONTEND_ORIGIN=http://localhost:3000

# Admin (development only)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
```

## Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

<<<<<<< HEAD
# Installation & Setup
=======
# 🚀 Running with Docker
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or cloud)
- Git

<<<<<<< HEAD
## Option 1: Local Development

### Backend Setup

```bash
# Navigate to backend directory
cd Modera/backend
=======
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
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

# Create virtual environment
python -m venv venv
```

<<<<<<< HEAD
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
=======
### Windows

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b
pip install -r requirements.txt
```

<<<<<<< HEAD
# Create .env file (see Environment Variables section)

# Run server
uvicorn app.main:app --reload
```

Backend will run at: http://localhost:8000

### Frontend Setup
=======
### Run Backend

```bash
uvicorn app.main:app --reload
```

---

## Frontend Setup
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

```bash
# Navigate to frontend directory
cd Modera/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

<<<<<<< HEAD
Frontend will run at: http://localhost:3000
=======
Frontend will run at:
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

## Option 2: Docker (Recommended)

### Prerequisites

- Docker
- Docker Compose

### Start Application

```bash
# From project root
docker-compose up --build
```

### Services

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:3000       |
| Backend  | http://localhost:8000       |
| API Docs | http://localhost:8000/docs  |
| MongoDB  | localhost:27017             |

---

# AI Moderation Details

## Gemini API (Primary)

**Configuration:**
- Model: `gemini-3.5-flash` (configurable)
- Retries: 3 attempts
- Backoff: Exponential (1s, 2s, 4s)
- Timeout: Default (60s)

**Advantages:**
- High accuracy
- Detailed reasoning
- Context understanding
- Fast response times

**Requirements:**
- Google Cloud account
- Gemini API key
- Billing enabled (pay-per-use)

**Get API Key:**
1. Visit https://aistudio.google.com/app/apikey
2. Create new API key
3. Add to `.env` as `GEMINI_API_KEY`

## Hugging Face CLIP (Fallback)

**Configuration:**
- Model: `openai/clip-vit-base-patch32`
- Size: ~600MB (downloaded once, cached)
- Device: Auto-detects CUDA/CPU
- Thresholds: 60% default (configurable)

**Advantages:**
- No API costs
- No billing required
- Runs locally
- Privacy-friendly
- Works offline

**Requirements:**
- PyTorch (~2GB)
- Transformers library
- ~1GB disk space for model

**First Run:**
- Model downloads automatically to `~/.cache/huggingface/hub`
- Takes 2-5 minutes depending on connection
- Cached for all future runs

**Hardware Compatibility:**
- CPU: Intel Xeon (works, slower)
- GPU: NVIDIA Quadro T2000 (4GB VRAM) - recommended
- RAM: 16GB minimum
- OS: Windows, Mac, Linux

## Basic Metadata (Last Resort)

If both AI services fail:
- Analyzes image dimensions
- Calculates average brightness
- Returns safe by default
- No content understanding

---

# Response Format

## Successful Analysis

```json
{
  "graphicViolence": {
    "detected": false,
    "confidence": 0.0,
    "reason": "Not detected"
  },
  "weaponsContraband": {
    "detected": true,
    "confidence": 85.5,
    "reason": "Detected by Hugging Face: Weapon"
  },
  "provider": "huggingface",
  "model": "openai/clip-vit-base-patch32",
  "reasoning": "Hugging Face detected: Weapon"
}
```

## Hugging Face Extended Data

When using Hugging Face fallback, additional fields are included:

```json
{
  "provider": "huggingface",
  "hf_scores": {
    "Weapon": 0.91,
    "Violence": 0.45,
    "Adult Content": 0.03,
    "Drugs": 0.02,
    "Safe Image": 0.04
  },
  "hf_status": "harmful"
}
```

---

# Configuration

## Threshold Tuning

Edit `backend/app/services/huggingface_service.py`:

```python
WEAPON_THRESHOLD = 0.60    # 0.0 to 1.0
VIOLENCE_THRESHOLD = 0.60  # 0.0 to 1.0
ADULT_THRESHOLD = 0.60     # 0.0 to 1.0
DRUG_THRESHOLD = 0.60      # 0.0 to 1.0
```

**Guidelines:**
- Lower (0.50): More sensitive, more false positives
- Higher (0.70): Less sensitive, fewer false positives
- Current (0.60): Balanced approach

## AI Provider Selection

Edit `.env`:

```env
# Use Gemini (requires API key)
AI_PROVIDER=gemini

# OR use Hugging Face only (no API key)
AI_PROVIDER=local_fallback
```

**Note:** Even with `AI_PROVIDER=gemini`, the system automatically falls back to Hugging Face if Gemini fails.

---

# 🔒 Security Features

* JWT Authentication
<<<<<<< HEAD
* Password Hashing (bcrypt)
=======
* Password Hashing
* Protected API Routes
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b
* Role-Based Access Control
* Input Validation
<<<<<<< HEAD
* Secure Environment Variables
* No hardcoded credentials

---

# Testing

## Test Gemini API

1. Add valid `GEMINI_API_KEY` to `.env`
2. Upload image through frontend
3. Check backend logs for: `"provider": "gemini"`
4. Verify detailed AI analysis in response

## Test Hugging Face Fallback

1. Remove or invalidate `GEMINI_API_KEY`
2. Upload image through frontend
3. First upload: Model downloads (~600MB, 2-5 min)
4. Check backend logs for: `"provider": "huggingface"`
5. Verify threshold-based results

## Test Multiple Categories

Upload images containing:
- Weapons only → Should detect Weapon
- Violence only → Should detect Violence
- Both weapon + violence → Should detect both
- Safe content → Should return safe

---

# Troubleshooting

## Hugging Face Model Not Loading

**Error:** `Failed to load Hugging Face model`

**Solutions:**
1. Check internet connection (first download only)
2. Verify disk space (~1GB required)
3. Check Python version (3.11+)
4. Reinstall: `pip install --upgrade torch transformers`

## Gemini API 403 Error

**Error:** `PERMISSION_DENIED`

**Solutions:**
1. Enable "Generative Language API" in Google Cloud Console
2. Set up billing account
3. Verify API key has no restrictions
4. Wait 5-10 minutes after enabling API

## Port Already in Use

**Error:** `Address already in use`

**Solutions:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

## MongoDB Connection Failed

**Solutions:**
1. Start MongoDB: `mongod`
2. Or use Docker: `docker-compose up mongodb`
3. Check `MONGODB_URL` in `.env`

---

# Performance

## Hardware Requirements

**Minimum:**
- CPU: Intel Xeon or equivalent
- RAM: 16GB
- Storage: 5GB free space
- GPU: Optional (CUDA supported)

**Recommended:**
- CPU: Intel Xeon (10th Gen+) or AMD Ryzen
- RAM: 16GB+
- Storage: 10GB+ SSD
- GPU: NVIDIA Quadro T2000 (4GB VRAM) or better

## Performance Metrics

| Model | First Run | Subsequent | Memory |
|-------|-----------|------------|--------|
| Gemini | ~2s | ~1-2s | Minimal |
| Hugging Face | ~5-10s | ~3-5s | ~1.5GB |
| Basic Fallback | <1s | <1s | Minimal |

---

# Development

## Adding New Categories

1. Update `CLASSIFICATION_LABELS` in `huggingface_service.py`
2. Add threshold constant
3. Update `CATEGORY_THRESHOLDS` mapping
4. Add category mapping in `ai_service.py`

## Logging

Logs are output to console with levels:
- INFO: Normal operations
- ERROR: Failures and exceptions
- Debug: Detailed debugging (enable in production)

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

# License

MIT License - see LICENSE file for details
=======
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
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b

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

<<<<<<< HEAD
GitHub: https://github.com/MuhammadHaris249518/Modera

LinkedIn: https://linkedin.com/in/yourprofile

---

# Support

For issues or questions:
1. Check Troubleshooting section
2. Review API documentation at http://localhost:8000/docs
3. Open GitHub issue

---

# Roadmap

## Completed
- [x] Dual AI model architecture
- [x] Hugging Face CLIP integration
- [x] Threshold-based moderation
- [x] Multiple category detection
- [x] Automatic failover system

## Planned
- [ ] Multi-image uploads
- [ ] Analytics dashboard
- [ ] Policy versioning
- [ ] Audit logging
- [ ] Cloud storage support
- [ ] Real-time notifications
- [ ] Batch processing
- [ ] Custom model fine-tuning
=======
GitHub: https://github.com/MuhammadHaris249518

LinkedIn: https://linkedin.com/in/your-linkedin-profile
>>>>>>> 93c2fc6bb610c32a5ba7a3171df6230c7b213c2b
