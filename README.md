# Aegis by Securityella - Imagine Cup 2026

**Aegis** is a Zero-Trust AI Security Sentinel that detects and neutralizes prompt injection attacks, jailbreaks, and hidden malicious intent in real-time.

## Features

- **Global Threat Map**: Real-time visualization of intercepted threats from around the world (powered by Supabase).
- **Voice Command Interface**: Hands-free control for SOC operators ("Scan System", "Show Threats").
- **Live Intercept Console**: AI-powered analysis of prompt injections and jailbreaks using **Azure OpenAI**.
- **File Malware Scanner**: Drag-and-drop file scanning powered by **VirusTotal API**.
- **Immersive Audio Engine**: Real-time synthesized sound effects (Web Audio API) for a cinematic experience.
- **Cinematic Startup**: Immersive boot sequence for high-stakes demonstrations.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Database, Realtime, Edge Functions)
- **AI**: Azure OpenAI Service (GPT-4o) via Edge Functions
- **External APIs**: VirusTotal (File Scanning)

## Configuration

### 1. Azure OpenAI (Required)
To enable the AI threat detection, you must set the following environment variables in your Supabase Edge Function secrets:
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL.
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key.
- `AZURE_OPENAI_DEPLOYMENT_NAME`: The name of your model deployment (e.g., `gpt-4o`).

### 2. Azure Static Web Apps (Deployment)
To enable auto-deployment, add the following secret to your GitHub Repository:
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: The deployment token from your Azure Static Web App resource.

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Start the development server:
    ```sh
    npm run dev
    ```

## Imagine Cup 2026
Designed with a "Mission Impossible" aesthetic to wow judges and demonstrate the future of AI security.
