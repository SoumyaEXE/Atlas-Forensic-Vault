<p align="center">
  <img src="public/og.jpeg.jpg" alt="Atlas Forensic Vault Banner" width="100%">
</p>

<h1 align="center">🕵️ ATLAS FORENSIC VAULT</h1>

<h3 align="center"><i>"Every Repository Has a Story. We Make It Talk."</i></h3>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js" alt="Next.js"></a>
  <a href="https://www.mongodb.com/atlas"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB Atlas"></a>
  <a href="https://elevenlabs.io/"><img src="https://img.shields.io/badge/ElevenLabs-AI_Voice-5D5FEF?style=for-the-badge" alt="ElevenLabs"></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google" alt="Gemini"></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel" alt="Vercel"></a>
</p>

<p align="center">
  <a href="https://mlh.isoumya.xyz">🌐 Live Demo</a> •
  <a href="#-demo-video">📺 Video Demo</a> •
  <a href="#-key-features">✨ Features</a>
</p>

---

## 🎯 The Problem

**Developers are drowning in code they didn't write.**

| Challenge | Pain Point |
|-----------|------------|
| 📚 Documentation | Reading docs is time-consuming |
| 🔍 New Codebases | Understanding takes hours/days |
| 🎧 Passive Learning | Can't learn while commuting |
| 📖 Code Reviews | Traditional reviews are dry & boring |

---

## 💡 Our Solution

**Atlas Forensic Vault** transforms any GitHub repository into an engaging **AI-generated podcast** narrated in a Film Noir detective style.

> *"In this city, every line of code tells a story. Most of them are tragedies. Some are comedies. But in my precinct? They're all mysteries until I say otherwise."*
> 
> — **Det. Mongo D. Bane**

### 🎬 How It Works

```
1️⃣ SUBMIT    →    2️⃣ INVESTIGATE    →    3️⃣ LISTEN    →    4️⃣ LEARN
   GitHub URL         AI Analysis           Podcast           Understand
```

---

## 🏗️ System Architecture

### High-Level Overview

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        UI["Next.js 16 Frontend"]
        Player["Reel-to-Reel Audio Player"]
        Transcript["Live Transcript Viewer"]
    end

    subgraph API["⚡ API Layer"]
        Analyze["/api/analyze"]
        Generate["/api/generate-audio"]
        Stream["/api/podcasts/audio"]
    end

    subgraph Services["🧠 AI Services"]
        GitHub["📦 GitHub API"]
        Gemini["🧠 Gemini 2.5 Flash"]
        Eleven["🎙️ ElevenLabs TTS"]
    end

    subgraph Database["🍃 MongoDB Atlas"]
        Podcasts[("Podcasts Collection")]
        Vector["🔍 Vector Search"]
        Changes["📡 Change Streams"]
    end

    UI --> Analyze
    Analyze --> GitHub
    GitHub --> Gemini
    Gemini --> Podcasts
    Podcasts --> Generate
    Generate --> Eleven
    Eleven --> Podcasts
    Podcasts --> Stream
    Stream --> Player
    Changes -.->|Real-time Updates| UI
    Podcasts --> Transcript
```

### 🔄 Data Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 User
    participant App as 🖥️ Next.js
    participant GitHub as 📦 GitHub
    participant Gemini as 🧠 Gemini
    participant DB as 🍃 MongoDB
    participant Voice as 🎙️ ElevenLabs

    User->>App: Submit Repository URL
    App->>DB: Create Podcast Record
    App->>GitHub: Fetch Repo Metadata
    GitHub-->>App: Files & Structure
    App->>DB: Update Progress 25%
    App->>Gemini: Generate Script
    Gemini-->>App: Noir-Style Script
    App->>DB: Store Script 75%
    App->>Voice: Generate Audio
    Voice-->>App: Audio Buffers
    App->>DB: Store Audio 100%
    DB-->>User: Real-time Progress
    User->>App: Play Podcast
    App-->>User: Stream Audio + Transcript
```

### 🎭 Narrative Styles

```mermaid
graph LR
    A[🎬 Select Style] --> B[🕵️ True Crime]
    A --> C[⚽ Sports]
    A --> D[🦁 Documentary]
    
    B --> E["Detective Voice<br/>Film Noir"]
    C --> F["Dual Commentators<br/>Play-by-Play"]
    D --> G["Attenborough Style<br/>Nature Doc"]
    
    E --> H[🎙️ Generate Podcast]
    F --> H
    G --> H
```

---

## 🔧 Tech Stack

<div align="center">

| Category | Technologies |
|:--------:|:------------:|
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss) |
| **Animation** | ![Framer](https://img.shields.io/badge/Framer_Motion-12-FF0080?logo=framer) ![Three.js](https://img.shields.io/badge/Three.js-0.182-000000?logo=three.js) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb) |
| **AI Services** | ![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google) ![ElevenLabs](https://img.shields.io/badge/ElevenLabs-v2-5D5FEF) |
| **Deployment** | ![Vercel](https://img.shields.io/badge/Vercel-Serverless-000?logo=vercel) |

</div>

### 📦 Detailed Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | Server-side rendering, type safety |
| **Styling** | Tailwind CSS 4, Framer Motion | Responsive design, animations |
| **3D Graphics** | Three.js, React Three Fiber | Immersive UI elements |
| **Database** | MongoDB Atlas | Document storage, vector search |
| **AI - Script** | Google Gemini 2.5 Flash | Codebase analysis, script generation |
| **AI - Voice** | ElevenLabs Multilingual v2 | High-quality text-to-speech |
| **Hosting** | Vercel (Pro) | Serverless deployment, 300s timeout |
| **API** | GitHub REST API | Repository data fetching |

---

## ✨ Key Features

### 🎙️ 1. AI-Powered Code Narration
Transform any GitHub repository into an engaging podcast with multiple narrative styles:

| Style | Voice | Description |
|-------|-------|-------------|
| 🕵️ **True Crime** | Detective | Film noir investigation of "code crimes" |
| ⚽ **Sports** | Dual Commentators | Exciting play-by-play of the codebase |
| 🦁 **Documentary** | Attenborough | Nature doc style exploration |

### 🎛️ 2. Retro Reel-to-Reel Player
- 🎞️ Spinning tape reel animations
- 🔘 Vintage brushed-metal aesthetic
- 📊 Progress tracking with visual feedback

### 📜 3. Live Transcript Synchronization
- ✨ Real-time highlighting as audio plays
- 📍 Auto-scroll follows the narration
- 👆 Click-to-seek on any text segment

### 🔍 4. MongoDB Atlas Integration
- **Vector Search** - Semantic search across transcripts
- **Change Streams** - Real-time progress updates
- **Flexible Schema** - Dynamic podcast structures

### 📄 5. Export Options
- **🟢 Redacted** - Shareable summary
- **🔴 Classified** - Full investigation report

---

## 📊 MongoDB Atlas Integration

### Why MongoDB Atlas?

We leverage **three key MongoDB Atlas features**:

| Feature | Use Case | Benefit |
|---------|----------|---------|
| 📄 **Flexible Schema** | Store variable segment counts | No rigid table structures |
| 🔍 **Vector Search** | Semantic transcript search | Find similar codebases |
| 📡 **Change Streams** | Real-time progress updates | No polling required |

### 1. Flexible Schema
```javascript
// Each podcast has different segment counts and metadata
{
  id: "abc-123",
  script: {
    title: "CASE FILE #REACT-HOOKS",
    segments: [
      { speaker: "narrator", text: "...", emotion: "mysterious" },
      { speaker: "sound_effect", text: "thunder" },
      // Variable number of segments per podcast
    ]
  },
  analysis_summary: { /* Dynamic fields based on repo */ }
}
```

### 2. Vector Search
```javascript
// Find similar podcast transcripts
db.podcasts.aggregate([
  {
    $vectorSearch: {
      queryVector: embeddings,
      path: "script_embedding",
      numCandidates: 100,
      limit: 5
    }
  }
]);
```

### 3. Change Streams
```javascript
// Real-time progress updates to frontend
const changeStream = collection.watch([
  { $match: { "fullDocument.id": podcastId } }
]);

changeStream.on("change", (change) => {
  updateClientProgress(change.fullDocument.progress);
});
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- API keys for Gemini & ElevenLabs

### Installation

```bash
# Clone the repository
git clone https://github.com/SoumyaEXE/Atlas-Forensic-Vault.git
cd Atlas-Forensic-Vault

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://...

# AI Services
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# GitHub (optional, increases rate limit)
GITHUB_TOKEN=your_github_token
```

### Run Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

---

## 🏆 Hackathon Highlights

| Criteria | Implementation |
|----------|----------------|
| ✅ **MongoDB Atlas** | Vector Search + Change Streams + Flexible Schema |
| ✅ **Innovation** | First-ever code-to-podcast with Film Noir theme |
| ✅ **AI Integration** | Gemini for analysis, ElevenLabs for voice |
| ✅ **Production Ready** | Deployed and functional on Vercel |
| ✅ **Real-World Utility** | Actually helps developers understand codebases |

---

## 👥 Team

<div align="center">

| 👨‍💻 Developer |
|:-------------:|
| **Soumya** |
| Full Stack Developer |
| [![GitHub](https://img.shields.io/badge/GitHub-SoumyaEXE-181717?style=flat&logo=github)](https://github.com/SoumyaEXE) |

</div>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🕵️ *"Case Closed."*

**Built with ❤️ for MLH Hack For Hackers!**

[![MongoDB](https://img.shields.io/badge/Powered_by-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)

</div>
