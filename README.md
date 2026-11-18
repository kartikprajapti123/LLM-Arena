# LLM Arena – AI Benchmarking Hub

A full-stack platform for comparing and evaluating responses from multiple Large Language Models (LLMs) in one place.

🌐 **Live Demo:** [www.llmarena.online](https://www.llmarena.online)

## About

LLM Arena is a project I built to make it easier to compare different AI models and understand how they perform against the same prompt.

Users can select multiple LLM providers, submit a prompt, and receive responses from different models. An AI-powered judge then evaluates the responses using defined criteria and identifies the best-performing answer.

The platform also includes workspace and project management, allowing users to organize comparisons and collaborate with team members.

## Features

- **Multi-LLM Comparison** – Compare responses from different models using the same prompt.
- **Multiple AI Providers** – Integration with OpenAI, Google Gemini, Groq and Cloudflare AI.
- **AI-Powered Evaluation** – Evaluate responses based on accuracy, relevance, completeness, clarity and helpfulness.
- **Workspace Management** – Create workspaces and manage members.
- **Project Management** – Organize comparisons within individual projects.
- **Team Collaboration** – Invite members and manage workspace roles.
- **Comparison History** – Store and review previous model responses and evaluations.
- **REST API** – Backend services built with Django REST Framework.

## Tech Stack

| Category | Technologies |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Frontend | React |
| State Management | Redux Toolkit |
| UI | Ant Design |
| Database | PostgreSQL |
| Real-time Communication | Django Channels, WebSockets |
| Background Services | Celery, Redis |
| AI Integration | OpenAI, Gemini, Groq, Cloudflare AI |
| Deployment | Ubuntu VPS, Apache, Daphne |

## How It Works

1. Create a workspace and project.
2. Select the AI providers and models you want to compare.
3. Submit a common prompt.
4. The platform sends the prompt to the selected models.
5. Responses are collected and passed to the AI judge.
6. The judge evaluates each response and determines the winner.
7. Review the results, scores and evaluation reasoning.

## Project Structure

```text
LLM-Arena/
│
├── backend/
│   ├── apps/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

*The structure above is illustrative; adjust it to match the actual repository.*

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd LLM-Arena
```

### 2. Backend Setup

```bash
cd backend

python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables, including database settings, Django configuration and AI provider API keys.

Run migrations:

```bash
python manage.py migrate
```

Start the backend:

```bash
python manage.py runserver
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Configure the frontend environment variables and start the application:

```bash
npm run dev
```

## Demo Access

Demo accounts are available to explore different workspace roles:

- **Workspace Owner:** Full workspace and member management.
- **Workspace Member:** Access to assigned workspace projects and comparisons.

Use the demo credentials provided on the live portfolio.

## Deployment

The production application is hosted on an Ubuntu VPS.

- Apache for web server and reverse proxy.
- Daphne for Django ASGI application.
- PostgreSQL for persistent data.
- Redis for real-time communication and background services.
- HTTPS for secure communication.

## Author


- Live Project: [llmarena.online](https://www.llmarena.online)

---

*Built to explore, compare and better understand the capabilities of different language models.*