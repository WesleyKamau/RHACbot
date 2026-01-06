# RHACbot Next.js Application

<div align="center">
  
  ![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
  ![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
  ![Tests](https://img.shields.io/badge/Tests-86_Passing-success?style=flat-square)
  
  **Modern full-stack Next.js application for campus-wide residence hall communication**
  
</div>

---

## 📖 Overview

This is a production-ready Next.js 16 application that serves as both the frontend and backend for RHACbot, a comprehensive communication management system for Residence Hall Advisory Councils.

**Key Features:**
- 🎯 Full-stack Next.js with App Router
- 🔐 Built-in API routes (no separate backend needed)
- 💾 MongoDB integration for data persistence
- 🧪 86 comprehensive tests with high coverage
- 📱 Responsive design with Ant Design 5
- 🎨 Optional animated background (Vanta.js)
- 🔒 Secure authentication and validation

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- MongoDB Atlas account (free tier available)
- GroupMe API access token

### Installation

```bash
# Install dependencies
npm install

# Configure environment (see Configuration section)
# Create ../.env in the project root

# Run tests
npm test

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔧 Configuration

**Important:** Environment variables are located in `../.env` (root of repository), not in the rhacbot-next folder.

Next.js automatically loads environment variables from the parent directory. See [../.env.example](../.env.example) for the complete configuration template.

**Required Variables:**
```env
GROUPME_ACCESS_TOKEN=your_token_here
ADMIN_PASSWORD=your_password
SECRET_KEY=your_secret_key
MONGODB_URI=mongodb+srv://...
MONGODB_DB=Cluster0
ENV=dev
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_STYLISH=true
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Test Coverage
```bash
npm test -- --coverage
```

**Test Suites (86 tests):**
- ✅ API Routes: 22 tests (auth, buildings, messages, chats, health)
- ✅ Utilities: 54 tests (GroupMe, database, config, types)
- ✅ UI Logic: 26 tests (tree select, region selection)
- ✅ Mock Coverage: fetch, MongoDB, file system, UUID

See [TEST_COVERAGE.md](TEST_COVERAGE.md) for detailed coverage reports.

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production-optimized application |
| `npm start` | Start production server |
| `npm test` | Run Jest test suite |
| `npm run lint` | Run ESLint code quality checks |

---

## 🏗️ Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # Backend API endpoints
│   │   ├── auth/             # POST /api/auth
│   │   ├── buildings/        # GET /api/buildings
│   │   ├── chats/add/        # POST /api/chats/add
│   │   ├── messages/send/    # POST /api/messages/send
│   │   └── health/           # GET /api/health
│   ├── send-message/         # Send message page
│   ├── add-chat/             # Add chat page
│   ├── learn-more/           # Information page
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
└── components/               # React components
    └── ui/                   # UI components (button, typography)

lib/                          # Server-side utilities
├── config.ts                 # Environment configuration
├── database.ts               # MongoDB operations
├── groupme.ts                # GroupMe API integration
└── types.ts                  # Type definitions & validation

__tests__/                    # Jest test suites
├── api/                      # API route tests
├── lib/                      # Utility function tests
└── tree-select-logic.test.ts # UI logic tests

data/
└── buildings.json            # Buildings database
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel** - Import your repository
3. **Configure Environment Variables** - Add all required env vars
4. **Deploy** - Automatic deployment on push

Vercel is optimized for Next.js and provides:
- Automatic builds and deployments
- Edge network CDN
- Serverless function optimization
- Environment variable management

### Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway up
```

### Environment Variables for Production

Ensure all variables from `../.env.example` are configured in your deployment platform, with `ENV=prod` and `NEXT_PUBLIC_ENV=prod`.

---

## 🔌 API Routes

All API routes are server-side Next.js route handlers located in `src/app/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and database status |
| `/api/buildings` | GET | Get all buildings data |
| `/api/auth` | POST | Authenticate admin user |
| `/api/chats/add` | POST | Register new floor chat |
| `/api/messages/send` | POST | Send message to selected groups |

All routes include comprehensive error handling, validation, and testing.

---

## 🎨 Styling

This application uses a modern styling approach:

- **Ant Design 5** - Primary component library with React 19 compatibility
- **Tailwind CSS** - Utility-first CSS framework
- **CSS Modules** - Scoped component styles
- **Vanta.js** - Optional animated background (configurable via `NEXT_PUBLIC_STYLISH`)

The design is fully responsive and optimized for desktop and mobile devices.

---

## 🔒 Security

- Password-based authentication for admin access
- Environment-based configuration (dev/prod separation)
- Type-safe TypeScript implementation
- Input validation on all API routes
- MongoDB connection with error handling
- Secure GroupMe API integration

---

## 📚 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Next.js App Router](https://nextjs.org/docs/app) - Modern routing with React Server Components
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying) - Deploy your app

### Project Documentation
- [Main README](../README.md) - Project overview and setup
- [TEST_COVERAGE.md](TEST_COVERAGE.md) - Detailed test coverage report
- [API.md](../API.md) - Complete API documentation

---

## 🤝 Contributing

See the [main README](../README.md#-contributing) for contribution guidelines.

---

<div align="center">
  <p>Built with ❤️ using Next.js 16 and React 19</p>
</div>
