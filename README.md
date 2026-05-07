 Neural Repo Intelligence (Codebase Explainer) 🧠💻

Neural Repo Intelligence is a powerful, AI-driven visual tool designed to help developers instantly decode, analyze, and compare GitHub repositories. Whether you're onboarding to a new project or auditing a codebase for technical debt, this tool provides deep architectural insights with a single URL.

## ✨ Key Features

- **Neural Code Mapping**: Interactive D3-powered relationship graphs to visualize repository structure and file dependencies.
- **Battlefront Mode (Versus)**: Side-by-side architectural warfare. Compare two repositories to evaluate structural integrity, scalability, and tech stack trade-offs.
- **Health Auditor**: AI-powered spot-checks that identify code smells, long methods, and potential bottlenecks.
- **Automated Doc Forge**: Instantly generate professional READMEs, setup guides, and high-level documentation.
- **Interactive Chat**: Chat directly with the codebase to ask specific questions about implementation details or logic flow.
- **Repository Pulse**: Real-time visualization of language distribution and contributor activity.

## 🛠 Tech Stack

- **Frontend**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS for a sleek, dark-themed brutalist interface.
- **Animations**: `motion/react` (Framer Motion) for fluid transitions and micro-interactions.
- **Intelligence**: Powered by Google Gemini AI (`gemini-3-flash-preview`).
- **Icons**: Lucide React.
- **Viz**: D3.js and Recharts.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key



## 🌐 Deployment (Render.com)

The project is optimized for deployment on Render using a custom Express server to serve the static SPA.

- **Build Command**: `npm install; npm run build`
- **Start Command**: `npm start`
- **Environment Variable**: Ensure `GEMINI_API_KEY` is set in the Render dashboard.

