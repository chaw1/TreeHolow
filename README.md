# TreeHolow 🌳🍃

TreeHolow is a digital sanctuary platform designed to provide users with a safe space to express their thoughts and emotions. Through a combination of AI technology and immersive 3D visualization, TreeHolow creates a unique emotional support system where your thoughts grow into a beautiful virtual tree.

## Features

- 🗣️ **Voice Recording & Transcription**: Share your thoughts through voice which gets transcribed automatically
- 🤖 **AI-Powered Responses**: Receive thoughtful AI-generated responses to your confessions
- 🌳 **Memory Visualization**: Watch your memories grow as a 3D tree, with each thought adding to its branches
- 🏆 **Achievement System**: Earn points and unlock achievements through consistent usage
- 🌐 **Multilingual Support**: Available in English, Chinese, and Japanese
- 🔒 **Secure Authentication**: Privacy-focused design with secure user accounts

## Tech Stack

### Local Mode
- 🦙 AI Models: Supports [Ollama](https://github.com/jmorganca/ollama), [OpenAI](https://openai.com/), or [Replicate](https://replicate.com/)
- 🔔 State Management: [Inngest](https://www.inngest.com/)
- 💻 Database: [Supabase](https://supabase.com/) with pgvector for embeddings
- 🧠 LLM Orchestration: [LangChain](https://js.langchain.com/docs/)
- 🖼️ Frontend: [Next.js](https://nextjs.org/) with TypeScript
- 🎨 UI: [Tailwind CSS](https://tailwindcss.com/) with [ShadcnUI](https://ui.shadcn.com/)
- 🌍 3D Visualization: [Three.js](https://threejs.org/) with React Three Fiber

### Production Mode
All of the above, plus:
- 🔐 Authentication: [Clerk](https://clerk.com/)
- ☁️ Hosting: [Fly.io](https://fly.io/)
- 🧮 Rate Limiting: [Upstash](https://upstash.com/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Docker](https://www.docker.com/get-started)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Setup Instructions

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/TreeHolow.git
   cd TreeHolow
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set up Supabase locally**
   ```
   supabase start
   ```

4. **Configure environment variables**
   ```
   cp .env.local.example .env.local
   ```
   Then update the environment variables with your credentials.

5. **Set up Inngest**
   ```
   npx inngest-cli@latest dev
   ```

6. **Start the development server**
   ```
   npm run dev
   ```

7. **Open your browser and navigate to**
   ```
   http://localhost:3000
   ```

## Deployment

The application can be deployed using Fly.io. See the deployment guide in the repository for detailed instructions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.