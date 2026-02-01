# Peargent Echo 🧠

> Intelligent memory layer for AI agents. Give your agents persistent, semantic memory.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-beta-yellow.svg)

## Features

- 🔍 **Semantic Search** - Find memories by meaning, not just keywords
- 🧠 **Auto-Extraction** - Automatically extract entities and facts using LLM
- ⏰ **Smart Forgetting** - Memories decay naturally over time
- 🔑 **Simple API** - RESTful API with easy integration
- 👥 **Multi-Agent** - Scope memories by agent, user, or session
- 📊 **Usage Tracking** - Monitor your API usage and credits

## Quick Start

### 1. Install the SDK (coming soon)

```bash
pip install peargent-echo
```

### 2. Use in your code

```python
from peargent_echo import Echo

# Initialize with your API key
echo = Echo(api_key="echo_sk_...")

# Store a memory
echo.add("User prefers dark mode and likes Python")

# Search semantically
results = echo.search("What are the user's preferences?")
print(results[0].content)
# → "User prefers dark mode and likes Python"
```

## API Reference

### Add Memory

```bash
curl -X POST https://your-domain.com/api/v1/memories \
  -H "Authorization: Bearer echo_sk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "User prefers dark mode",
    "agentId": "assistant-1",
    "metadata": {"source": "user-preferences"}
  }'
```

### Search Memories

```bash
curl -X POST https://your-domain.com/api/v1/search \
  -H "Authorization: Bearer echo_sk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are user preferences?",
    "limit": 10
  }'
```

### List Memories

```bash
curl https://your-domain.com/api/v1/memories \
  -H "Authorization: Bearer echo_sk_YOUR_KEY"
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Convex account
- OpenAI API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/peargent-echo.git
cd peargent-echo
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev --once --configure=new
```

4. Add your OpenAI API key to Convex:
```bash
npx convex env set OPENAI_API_KEY sk-your-key
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Project Structure

```
peargent-echo/
├── convex/                 # Backend (Convex)
│   ├── schema.ts          # Database schema
│   ├── memories.ts        # Memory CRUD + search
│   ├── auth.ts            # Authentication
│   ├── keys.ts            # API key management
│   ├── credits.ts         # Credit system
│   ├── maintenance.ts     # Scheduled jobs
│   └── lib/
│       ├── embeddings.ts  # OpenAI integration
│       └── crypto.ts      # Hashing utilities
│
├── src/
│   ├── app/
│   │   ├── page.tsx       # Landing page
│   │   ├── login/         # Login page
│   │   ├── signup/        # Signup page
│   │   ├── dashboard/     # Dashboard pages
│   │   └── api/v1/        # Public API routes
│   └── components/        # React components
```

## Credit Costs

| Operation | Credits |
|-----------|---------|
| Add memory | 1 |
| Search | 1 |
| Update | 1 |
| Get/List | Free |
| Delete | Free |

New accounts start with **100 free credits**.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_CONVEX_URL` (from Convex dashboard)
4. Deploy!

### Deploy Convex to Production

```bash
npx convex deploy
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📧 Email: support@peargent.com
- 💬 Discord: [Join our community](https://discord.gg/peargent)
- 📖 Docs: [docs.peargent.com](https://docs.peargent.com)
