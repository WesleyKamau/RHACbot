<div align="center">
  <img src="rhacbot-next/public/rhac-logo.png" alt="RHAC Logo" width="120" />
  
  # 🏢 RHACbot Control Panel
  
  <p align="center">
    <strong>Streamline campus-wide communication across residence halls</strong>
  </p>
  
  <p align="center">
    A modern full-stack Next.js application for broadcasting messages to GroupMe floor chats across multiple buildings and regions
  </p>
  
  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-deployment">Deployment</a>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-7.0-13aa52?style=flat-square&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tests-86_Passing-success?style=flat-square" alt="Tests" />
  </p>
</div>

---

## 🎯 What is RHACbot?

**RHACbot** is a comprehensive communication management system designed for Residence Hall Advisory Councils (RHAC) to efficiently broadcast announcements, event updates, and important information to students across campus residence halls.

### The Problem It Solves

Managing communication across dozens of residence hall floor chats is challenging:
- 📱 **Scattered Groups**: Floor chats spread across multiple buildings and regions
- ⏰ **Time-Consuming**: Manually posting to each chat takes significant time
- 🎯 **Targeting Issues**: Difficulty sending region-specific or building-specific messages
- 📊 **No Central Control**: No unified system to manage which chats are connected

### The RHACbot Solution

<table>
<tr>
<td width="50%">

**🚀 For Administrators**
- Send messages to entire campus or specific regions with one click
- Target individual buildings or custom combinations
- Manage connected floor chats centrally
- Secure password-protected access

</td>
<td width="50%">

**🏘️ For Residents**
- Simple GroupMe link submission
- Receive relevant announcements automatically
- Stay informed about campus events
- Connect their floor in under a minute

</td>
</tr>
</table>

---

## ✨ Features

<table>
<tr>
<td>

### 📢 **Smart Message Broadcasting**
- **Hierarchical Targeting**: Choose Campuswide, specific regions (North Campus, South Campus, etc.), or individual buildings
- **Mixed Selections**: Combine regions and specific buildings for precise targeting
- **One-Click Distribution**: Send to hundreds of students instantly
- **Image Support**: Upload and attach images to messages
- **GroupMe Integration**: Native API integration for reliable delivery

</td>
<td>

### 🏗️ **Intelligent Organization**
- **Regional Grouping**: Buildings organized by campus region
- **Searchable Interface**: Quick building lookup with fuzzy search
- **Collapsed Tree View**: Clean, navigable interface
- **Parent-Child Logic**: Select a region to automatically include all buildings

</td>
</tr>
<tr>
<td>

### 🔐 **Security & Reliability**
- **Password Protection**: Secure admin-only access with JWT
- **Environment-Based Config**: Separate dev/prod configurations
- **Type Safety**: Full TypeScript implementation
- **MongoDB Storage**: Persistent, scalable database
- **Error Handling**: Comprehensive validation and error responses

</td>
<td>

### 🧪 **Production-Ready**
- **86 Tests Passing**: API routes, utilities, and UI logic
- **High Coverage**: 77-100% coverage on API routes
- **Type-Safe**: TypeScript across the entire codebase
- **Modern Stack**: Next.js 16 with App Router and Server Actions

</td>
</tr>
</table>

---

## 🏗️ Architecture

```mermaid
graph TD
    A[👤 RHAC Executive Board] -->|Compose Message| B[Next.js App]
    C[🏠 Resident Advisor] -->|Submit GroupMe Link| B
    B -->|Server Actions| D[Next.js API Routes]
    D -->|Store Data| E[(MongoDB)]
    D -->|Upload Images| H[GroupMe Image API]
    H -->|Image URL| D
    D -->|Send Messages| F[GroupMe API]
    F -->|Deliver| G[Floor Group Chats]
    
    style A fill:#ba0001,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#1890ff,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#000,stroke:#666,stroke-width:2px,color:#fff
    style E fill:#13aa52,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#00aff0,stroke:#333,stroke-width:2px,color:#000
    style G fill:#faad14,stroke:#333,stroke-width:2px,color:#000
    style H fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
```

### 📦 Repository Structure

```
RHACbot/
├── 📱 rhacbot-next/          # Next.js 16 Full-Stack Application
│   ├── src/
│   │   ├── app/              # App router pages & API routes
│   │   │   ├── api/          # Server-side API endpoints
│   │   │   │   ├── auth/     # Authentication
│   │   │   │   ├── buildings/ # Building data
│   │   │   │   ├── chats/    # Chat management
│   │   │   │   ├── messages/ # Message sending
│   │   │   │   └── health/   # Health check
│   │   │   ├── send-message/ # Message broadcasting page
│   │   │   ├── add-chat/     # Floor chat registration page
│   │   │   └── learn-more/   # Information page
│   │   └── components/       # React components
│   ├── lib/                  # Server-side utilities
│   │   ├── config.ts         # Environment configuration
│   │   ├── database.ts       # MongoDB operations
│   │   ├── groupme.ts        # GroupMe API integration
│   │   └── types.ts          # TypeScript type definitions
│   ├── __tests__/            # Jest test suite (86 tests)
│   │   ├── api/              # API route tests
│   │   └── lib/              # Utility function tests
│   └── data/                 # Buildings & regions data
│
├── 📄 .env                   # Environment variables (not in git)
├── 📄 .env.example           # Example environment configuration
└── 📖 README.md              # You are here

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **GroupMe Account** with API access token
- **MongoDB** Atlas account (free tier available)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/WesleyKamau/RHACbot.git
cd RHACbot/rhacbot-next
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment

Create a `.env` file in the root directory (not inside rhacbot-next):

```bash
# Copy the example
cp ../.env.example ../.env
```

Edit `../.env` with your credentials:

```env
# GroupMe API Configuration
GROUPME_ACCESS_TOKEN=your_groupme_token_here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=Cluster0
MONGODB_DB_DEV=rhac_db_dev
MONGODB_DB_PROD=rhac_db_prod

# Authentication & Security
ADMIN_PASSWORD=your_admin_password
SECRET_KEY=your_secret_key_here

# Environment Configuration
ENV=dev

# Next.js Public Variables
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_STYLISH=true
```

### 4️⃣ Run Tests

```bash
npm test
```

All 86 tests should pass ✅

### 5️⃣ Start Development Server

```bash
npm run dev
```

Application runs on `http://localhost:3000`

### 6️⃣ Access the Application

1. **Open** `http://localhost:3000`
2. **Navigate** to "Send Message" and authenticate with your admin password
3. **Select** target buildings/regions
4. **Send** your first announcement! 🎉

---

## 🧪 Testing

### Run All Tests
```bash
cd rhacbot-next
npm test
```

### Test Coverage (86 total tests)

**API Routes (22 tests)**
- ✅ Health check endpoint
- ✅ Buildings data endpoint
- ✅ Authentication with JWT
- ✅ Message sending with validation
- ✅ Chat management operations

**Utilities (54 tests)**
- ✅ GroupMe API integration
- ✅ Database operations (MongoDB)
- ✅ Configuration management
- ✅ Type validation
- ✅ Image upload handling

**UI Logic (26 tests)**
- ✅ Tree select hierarchy (Campuswide → Regions → Buildings)
- ✅ Parent-child checkbox behavior
- ✅ Region and building selection logic
- ✅ Edge cases and real-world scenarios

See [TEST_COVERAGE.md](rhacbot-next/TEST_COVERAGE.md) for detailed coverage reports.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

The application is configured for seamless Vercel deployment:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WesleyKamau/RHACbot)

**Manual Deployment:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd rhacbot-next
vercel --prod
```

**Required Environment Variables in Vercel:**
- `GROUPME_ACCESS_TOKEN` - Your GroupMe API token
- `ADMIN_PASSWORD` - Admin authentication password
- `SECRET_KEY` - Encryption key for sessions
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name
- `MONGODB_DB_PROD` - Production database name
- `ENV` - Set to `prod`
- `NEXT_PUBLIC_ENV` - Set to `prod`
- `NEXT_PUBLIC_STYLISH` - Set to `true` or `false`

### Alternative: Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
cd rhacbot-next
railway up
```

---

## 🔧 Configuration

### Environment Variables

All environment variables are defined in the root `.env` file (not inside rhacbot-next).

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GROUPME_ACCESS_TOKEN` | GroupMe API token | ✅ Yes | - |
| `ADMIN_PASSWORD` | Admin authentication password | ✅ Yes | - |
| `SECRET_KEY` | Session encryption key | ✅ Yes | - |
| `MONGODB_URI` | MongoDB connection string | ✅ Yes | - |
| `MONGODB_DB` | Default database name | ✅ Yes | - |
| `MONGODB_DB_DEV` | Development database name | ❌ No | Uses `MONGODB_DB` |
| `MONGODB_DB_PROD` | Production database name | ❌ No | Uses `MONGODB_DB` |
| `ENV` | Environment (`dev`/`prod`) | ❌ No | `dev` |
| `NEXT_PUBLIC_ENV` | Client-side environment indicator | ❌ No | `dev` |
| `NEXT_PUBLIC_STYLISH` | Enable animated background | ❌ No | `true` |

**Note:** Next.js automatically loads environment variables from `../.env` relative to the project root (rhacbot-next).

---

## 📚 API Documentation

### 🔒 Authentication
```http
POST /api/auth
Content-Type: application/json

{
  "password": "your_admin_password"
}

Response: 200 OK
{
  "message": "Authentication successful"
}
```

### 📤 Send Message
```http
POST /api/messages/send
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "password": "your_admin_password",
  "message_body": "Your announcement here",
  "regions": ["all"],         // or ["North", "South"] or []
  "building_ids": [],          // or [1, 5, 10] for specific buildings
  "image_path": "/path/to/image.jpg"  // optional
}

Response: 200 OK
{
  "message": "Messages sent successfully",
  "results": [...]
}
```

### ➕ Add Floor Chat
```http
POST /api/chats/add
Content-Type: application/json

{
  "groupme_link": "https://groupme.com/join_group/...",
  "building_id": 1,
  "floor_number": 3
}

Response: 200 OK
{
  "message": "Chat registered successfully"
}
```

### 🏢 Get Buildings
```http
GET /api/buildings

Response: 200 OK
[
  {
    "id": 1,
    "name": "Baker Hall",
    "region": "North"
  },
  ...
]
```

### ❤️ Health Check
```http
GET /api/health

Response: 200 OK
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-05T12:00:00Z"
}
```

Full API documentation: [API.md](API.md)

---

## 🛠️ Tech Stack

### Full-Stack Next.js Application
- **Framework**: Next.js 16.0 (App Router)
- **Runtime**: Node.js 18+
- **UI Library**: React 19
- **Language**: TypeScript 5.x
- **Components**: Ant Design 5.x (with React 19 compatibility layer)
- **Database**: MongoDB 7.0 (via Node.js driver)
- **Authentication**: Password-based with environment config
- **API Integration**: GroupMe API for messaging
- **Testing**: Jest 30.2 + React Testing Library (86 tests)
- **Styling**: CSS Modules + Ant Design Theme + Tailwind CSS

### Development Tools
- **Type Checking**: TypeScript with strict mode
- **Testing**: Jest with jsdom environment
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git + GitHub

### Deployment
- **Recommended**: Vercel (optimized for Next.js)
- **Alternative**: Railway, AWS, or any Node.js hosting
- **CI/CD**: Automated testing before deployment
- **Environment**: Separate dev/prod configurations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Run tests** to ensure everything works:
   ```bash
   cd rhacbot-next
   npm test
   ```
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Development Guidelines

- **Tests Required**: All new features must include tests
- **Type Safety**: Use TypeScript types properly
- **Code Style**: Follow existing patterns and conventions
- **Documentation**: Update README and docs as needed
- **Test Coverage**: Maintain or improve existing coverage

---

## 📁 Project Structure

```
rhacbot-next/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes (Backend)
│   │   │   ├── auth/         # Authentication endpoint
│   │   │   ├── buildings/    # Buildings data endpoint
│   │   │   ├── chats/        # Chat management
│   │   │   ├── messages/     # Message sending
│   │   │   └── health/       # Health check
│   │   ├── send-message/     # Send message page
│   │   ├── add-chat/         # Add chat page
│   │   ├── learn-more/       # Information page
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   └── components/           # Reusable components
│       └── ui/               # UI components (shadcn/ui)
├── lib/                      # Server-side utilities
│   ├── config.ts             # Configuration management
│   ├── database.ts           # MongoDB operations
│   ├── groupme.ts            # GroupMe API client
│   └── types.ts              # Type definitions & validation
├── __tests__/                # Test suites
│   ├── api/                  # API route tests
│   ├── lib/                  # Utility tests
│   └── tree-select-logic.test.ts  # UI logic tests
├── data/                     # Static data
│   └── buildings.json        # Buildings database
├── public/                   # Static assets
├── jest.config.js            # Jest configuration
├── jest.setup.js             # Jest setup (polyfills)
├── tsconfig.json             # TypeScript config
├── next.config.js            # Next.js config
└── package.json              # Dependencies & scripts
```

---

## 📝 License

This project is part of the OSU Residence Hall Advisory Council (RHAC) infrastructure.

---

## 👥 Support

- **Issues**: [GitHub Issues](https://github.com/WesleyKamau/RHACbot/issues)
- **Questions**: Open a discussion or issue
- **RHAC**: Contact your local Residence Hall Advisory Council

---

<div align="center">
  <p>Made with ❤️ for Ohio State residence halls</p>
  <p>
    <strong>Empowering student communication across campus</strong>
  </p>
</div>
