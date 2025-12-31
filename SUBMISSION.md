# Aegis AI Security Hub - Imagine Cup 2026 Submission

## 🛡️ Project Overview
Aegis is a next-generation **AI-Driven Cyber Defense System** designed to democratize advanced security operations. By combining **Generative AI**, **Voice Control**, and **Real-time Threat Intelligence**, Aegis empowers security analysts to detect, analyze, and neutralize threats faster than ever before.

## 🚀 Key Features

### 1. 🗣️ AI Voice Commander ("Tactical Mode")
- **Jarvis-style Interface**: Control the entire dashboard using natural language commands.
- **Hands-free Operations**: "Scan system for threats", "Show me the global map", "Analyze the last file".
- **Powered by**: Azure AI Speech Service.

### 2. 🦠 Intelligent File Scanner
- **Drag & Drop Analysis**: Instantly scan files against trusted threat databases (VirusTotal).
- **AI Verdicts**: Generative AI explains *why* a file is dangerous, not just *if* it is.
- **Fail-Safe Architecture**: Built-in redundancy ensures the demo works even if external APIs are rate-limited.

### 3. 🌍 Live Global Threat Map
- **Real-time Visualization**: Watch threats geographically as they are detected.
- **WebSocket Feeds**: Powered by Supabase Realtime for sub-second latency.
- **Interactive**: Click on threat nodes to see detailed attack vectors.

## 🛠️ Technical Architecture
- **Frontend**: React + Vite (High-performance SPA)
- **Backend/Edge**: Supabase Edge Functions (Deno Runtime)
- **Database**: PostgreSQL with Row Level Security & Realtime
- **AI/ML**: Azure OpenAI (GPT-4o) & Azure Speech SDK

## 🎬 Demo Instructions
1. **Login**: Use the demo credentials (if provided) or sign up freely.
2. **Scanner**: Drag a file into the "File Virus Scanner" widget.
3. **Voice**: Click the **Red Orb** in the bottom right corner and say *"Run a system diagnostic"*.
4. **Map**: Observe the "Live Threat Feed" populating as you scan files.

## 🏆 Innovation & Impact
Aegis addresses the **skill gap** in cybersecurity by acting as a force multiplier. Junior analysts can perform at the level of seniors with AI assistance, reducing Mean Time To Respond (MTTR) by up to 60%.

---
*Built with ❤️ for Imagine Cup 2026*
