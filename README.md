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

- 🔐 **Authentication**: [Clerk](https://clerk.com/)
- 💻 **Database & Storage**: [Supabase](https://supabase.com/)
- 🖼️ **Frontend**: [Next.js](https://nextjs.org/) with TypeScript
- 🎨 **UI**: [Tailwind CSS](https://tailwindcss.com/) with [ShadcnUI](https://ui.shadcn.com/)
- 🌍 **3D Visualization**: [Three.js](https://threejs.org/) with React Three Fiber
- ☁️ **Hosting**: [Vercel](https://vercel.com/)

## Database Structure

### Memories (记忆)
```
memories
  id: UUID (PK)
  user_id: TEXT
  transcript: TEXT
  ai_response: TEXT
  audio_url: TEXT
  emotion_score: INTEGER
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
```

### Achievements (成就)
```
user_achievements
  id: UUID (PK)
  user_id: TEXT
  achievement_id: TEXT
  title: TEXT
  description: TEXT
  icon: TEXT
  condition: TEXT
  category: TEXT
  points: INTEGER
  unlocked: BOOLEAN
  progress: INTEGER
  date_unlocked: TIMESTAMPTZ
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
```

### Points (积分)
```
user_points
  id: UUID (PK)
  user_id: TEXT
  total_points: INTEGER
  last_checkin: TIMESTAMPTZ
  checkin_streak: INTEGER
  updated_at: TIMESTAMPTZ

points_history
  id: UUID (PK)
  user_id: TEXT
  points: INTEGER
  source: TEXT
  source_id: TEXT
  description: TEXT
  created_at: TIMESTAMPTZ
```

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