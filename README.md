# PrepNexus - AI-Powered Placement & Interview Preparation Platform

PrepNexus is a comprehensive Generative AI platform designed to help candidates prepare for placements and technical interviews through automated resume parsing and scoring, RAG-based company preparation, personalized learning roadmaps, and AI-driven mock interviews.

---

## 🚀 Features

- **AI Resume Analyzer & Parser:** Extracts text from PDF and DOCX files, evaluates formatting, ATS match, and provides granular score breakdowns.
- **Skill Matcher:** Compares resume skills against target job roles and identifies skill gaps.
- **Company Preparation with RAG:** Leverages past interview experiences to generate company-specific prep questions and answers.
- **Personalized Roadmaps:** Creates step-by-step career and topic roadmaps powered by LLMs.
- **AI Mock Interviews & Voice Simulation:** Dynamic interview question generation and interactive feedback.
- **Authentication & Dashboard:** Secure user registration, JWT-based authentication, and history tracking.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Django & Django REST Framework (DRF)
- **Database:** MongoDB (via PyMongo)
- **AI / LLMs:** Google Gemini (`gemini-2.5-flash`), Groq API (`llama-3.3-70b-versatile`)
- **Document Processing:** PyMuPDF, python-docx
- **Authentication:** JWT (`djangorestframework-simplejwt`)

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS, Lucide React
- **State Management:** React Context API

---

## ⚙️ Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY, GROQ_API_KEY, and MONGODB_URI

# Run Django development server
python manage.py runserver
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run Vite dev server
npm run dev
```

---

## 🔐 Environment Variables

Refer to `backend/.env.example` for all required environment variables:
- `SECRET_KEY`: Django secret key
- `DEBUG`: Set to `True` for development
- `MONGODB_URI`: Connection string for MongoDB
- `GEMINI_API_KEY`: API key from [Google AI Studio](https://aistudio.google.com/)
- `GROQ_API_KEY`: API key from [Groq Console](https://console.groq.com/)

> **Note:** Never commit `.env` containing sensitive credentials to GitHub.

---

## 📄 License
This project is open-source and available under the MIT License.
