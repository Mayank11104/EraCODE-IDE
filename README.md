# EraCODE IDE

<div align="center">

![EraCODE IDE](https://img.shields.io/badge/EraCODE-IDE-blue?style=for-the-badge&logo=visual-studio-code)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**A Next-Generation Cloud-Native IDE with AI-Powered Development Assistance**

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [Tech Stack](#tech-stack) • [Contributing](#contributing)

</div>

---

## Overview

**EraCODE IDE** is a modern, full-featured Integrated Development Environment built with cutting-edge web technologies. It combines the power of cloud computing, AI assistance, and comprehensive development tools into a single, seamless platform. Whether you're coding locally or managing cloud infrastructure, EraCODE IDE provides everything you need in one place.

### Key Highlights

- **AI-Powered Coding Assistant** - Integrated LangGraph-based multi-agent system with Azure OpenAI
- **Cloud Terminal Support** - Connect to AWS EC2, SSH servers, and local terminals seamlessly
- **Docker Management** - Full container lifecycle management with real-time monitoring
- **CI/CD Integration** - GitHub Actions workflow visualization and management
- **System Monitoring** - Real-time CPU, memory, network, and process tracking
- **Database Management** - Support for PostgreSQL, MySQL, MongoDB, and SQLite
- **API Testing** - Built-in HTTP/WebSocket API tester with cookie inspection
- **File Explorer** - Full-featured file system with drag-and-drop support
- **Monaco Editor** - VSCode-quality code editing with syntax highlighting
- **Advanced Search** - Multi-file search with regex support
- **Data Visualization** - Mermaid diagrams, charts, and workflow visualizations

---

## Features

### Modern UI/UX
- Sleek dark theme with smooth animations
- Resizable panels with drag-and-drop support
- Multi-tab editor with file management
- Responsive design for all screen sizes

### Terminal Capabilities
- **Local Terminals** - Native terminal support (PowerShell, CMD, Bash, WSL)
- **Cloud Terminals** - AWS EC2 instance management and SSH connections
- **Multi-Terminal** - Multiple terminal sessions with easy switching
- **WebSocket-based** - Real-time terminal streaming with low latency

### AI Agent System
- Multi-agent architecture using LangGraph
- Code generation and refactoring assistance
- Intelligent code review and suggestions
- Natural language to code conversion
- Context-aware completions powered by Azure OpenAI

### Docker Integration
- Container lifecycle management (start, stop, restart, remove)
- Real-time container logs streaming
- Resource usage monitoring
- Image management
- Network and volume inspection

### CI/CD Pipeline
- GitHub Actions workflow visualization
- Real-time build status monitoring
- Pipeline stage tracking
- Workflow execution history
- Integration with GitHub repositories

### Database Tools
- **PostgreSQL** - Full query editor with schema browser
- **MySQL** - Table management and data visualization
- **MongoDB** - Document explorer and query builder
- **SQLite** - Lightweight database support
- Connection pooling and management

### API Testing
- HTTP request builder (GET, POST, PUT, DELETE, PATCH)
- WebSocket connection testing
- Cookie inspection (including HttpOnly cookies)
- Header management
- Response visualization
- Request history

### System Monitoring
- Real-time CPU and memory usage
- Network I/O tracking
- Process management
- Disk usage statistics
- System information dashboard

### Visualization Tools
- Mermaid diagram rendering
- Flowchart and sequence diagrams
- Data charts (line, bar, pie)
- Architecture diagrams
- Git graph visualization

### Search & Navigation
- Multi-file text search
- Regex pattern matching
- File type filtering
- Search history
- Quick file navigation

### File Management
- Tree-view file explorer
- Drag-and-drop file operations
- File upload/download
- Context menu operations
- File watching and auto-refresh

---

## Architecture

EraCODE IDE follows a modern microservices architecture with three main components:

```
┌─────────────────────────────────────────────────────────┐
│                    EraCODE IDE                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  AI Agents   │ │
│  │   (React)    │◄─┤   (Node.js)  │◄─┤   (Python)   │ │
│  │              │  │              │  │              │ │
│  │  - Monaco    │  │  - Express   │  │  - LangGraph │ │
│  │  - Xterm.js  │  │  - Socket.IO │  │  - FastAPI   │ │
│  │  - Zustand   │  │  - node-pty  │  │  - Azure AI  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │  Browser │        │  Docker  │        │   AWS    │
   └──────────┘        └──────────┘        └──────────┘
```

### Components

#### Frontend (`eracode-ide-frontend`)
- **Framework**: React 19 + TypeScript + Vite
- **State Management**: Zustand
- **Editor**: Monaco Editor (VSCode engine)
- **Terminal**: Xterm.js with WebSocket support
- **Styling**: TailwindCSS 4
- **UI Components**: Custom components with Lucide icons
- **Real-time**: Socket.IO client

#### Backend (`eracode-ide-backend`)
- **Runtime**: Node.js + Express
- **Port**: 3001
- **WebSocket**: Socket.IO for real-time communication
- **Terminal**: node-pty for native terminal support
- **Cloud**: AWS SDK for EC2 management, SSH2 for remote connections
- **Docker**: Dockerode for container management
- **Database**: Sequelize (SQL), Mongoose (MongoDB)
- **File System**: Chokidar for file watching
- **Git**: simple-git for version control

#### AI Agents (`eracode-ide-agents-backend`)
- **Framework**: FastAPI + Python
- **Port**: 5000
- **AI Engine**: LangGraph for multi-agent orchestration
- **LLM Provider**: Azure OpenAI
- **Chains**: LangChain for prompt engineering
- **Tools**: Custom tools for code analysis and generation

---

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+
- Docker (optional, for container management)
- AWS Account (optional, for cloud terminals)
- Azure OpenAI API Key
- Git

### Clone the Repository

```bash
git clone https://github.com/Mayank11104/EraCODE-IDE.git
cd EraCODE-IDE
```

### Setup Frontend

```bash
cd eracode-ide-frontend
npm install
```

Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_AI_BACKEND_URL=http://localhost:5000
```

### Setup Backend

```bash
cd ../eracode-ide-backend
npm install
```

Create `.env` file:
```env
PORT=3001
NODE_ENV=development

# AWS Configuration (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Database Configuration (Optional)
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=postgres

MONGO_URI=mongodb://admin:password123@localhost:27017
```

### Setup AI Agents Backend

```bash
cd ../eracode-ide-agents-backend
pip install -r requirements.txt
```

Create `.env` file:
```env
# LLM Provider
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4

# Azure OpenAI API Key
OPENAI_API_KEY=your_azure_openai_api_key

# Server
PORT=5000
DEBUG=true
NODE_BACKEND_URL=http://localhost:3001
```

### Setup Databases (Optional)

Using Docker Compose:
```bash
cd ..
docker-compose up -d
```

This will start:
- PostgreSQL on port 5433
- MongoDB on port 27017

---

## Usage

### Start All Services

**Terminal 1 - Frontend:**
```bash
cd eracode-ide-frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

**Terminal 2 - Backend:**
```bash
cd eracode-ide-backend
npm run dev
```
Backend runs on `http://localhost:3001`

**Terminal 3 - AI Agents:**
```bash
cd eracode-ide-agents-backend
python -m uvicorn src.main:app --reload --port 5000
```
AI Backend runs on `http://localhost:5000`

### Access the IDE

Open your browser and navigate to:
```
http://localhost:5173
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| TailwindCSS 4 | Styling |
| Monaco Editor | Code Editor |
| Xterm.js | Terminal Emulator |
| Socket.IO Client | Real-time Communication |
| Zustand | State Management |
| Axios | HTTP Client |
| Recharts | Data Visualization |
| Mermaid | Diagram Rendering |
| React Markdown | Markdown Rendering |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web Framework |
| Socket.IO | WebSocket Server |
| node-pty | Terminal Emulation |
| Dockerode | Docker API |
| AWS SDK | Cloud Integration |
| SSH2 | Remote Connections |
| Sequelize | SQL ORM |
| Mongoose | MongoDB ODM |
| simple-git | Git Operations |
| Chokidar | File Watching |
| systeminformation | System Metrics |

### AI Agents
| Technology | Purpose |
|------------|---------|
| Python 3.10+ | Runtime |
| FastAPI | Web Framework |
| LangGraph | Multi-Agent Orchestration |
| LangChain | LLM Framework |
| Azure OpenAI | GPT Models |
| Pydantic | Data Validation |
| Uvicorn | ASGI Server |

---

## Project Structure

```
EraCODE-IDE/
├── eracode-ide-frontend/          # React Frontend
│   ├── src/
│   │   ├── components/            # UI Components
│   │   ├── pages/                 # Main Pages
│   │   ├── stores/                # Zustand Stores
│   │   ├── services/              # API Services
│   │   ├── hooks/                 # Custom Hooks
│   │   └── types/                 # TypeScript Types
│   └── package.json
│
├── eracode-ide-backend/           # Node.js Backend (Port 3001)
│   ├── controllers/               # Route Controllers
│   ├── services/                  # Business Logic
│   ├── routes/                    # API Routes
│   ├── sockets/                   # WebSocket Handlers
│   ├── middleware/                # Express Middleware
│   ├── config/                    # Configuration
│   └── server.js                  # Main Server
│
├── eracode-ide-agents-backend/    # Python AI Backend (Port 5000)
│   ├── src/
│   │   ├── agents/                # LangGraph Agents
│   │   ├── tools/                 # Agent Tools
│   │   ├── graph/                 # Agent Workflows
│   │   ├── api/                   # FastAPI Routes
│   │   ├── models/                # Data Models
│   │   ├── prompts/               # LLM Prompts
│   │   └── main.py                # FastAPI App
│   └── requirements.txt
│
├── docker-compose.yml             # Database Services
└── README.md                      # Documentation
```

---

## API Endpoints

### Backend (Port 3001)

**Health Check:**
```
GET http://localhost:3001/api/health
```

**Terminals:**
```
GET http://localhost:3001/api/terminals
```

**Git Operations:**
```
POST http://localhost:3001/api/git/clone
POST http://localhost:3001/api/git/commit
POST http://localhost:3001/api/git/push
GET  http://localhost:3001/api/git/status
```

**Docker Operations:**
```
GET  http://localhost:3001/api/docker/containers
POST http://localhost:3001/api/docker/containers/:id/start
POST http://localhost:3001/api/docker/containers/:id/stop
```

**Database Operations:**
```
POST http://localhost:3001/api/database/connect
POST http://localhost:3001/api/database/query
GET  http://localhost:3001/api/database/tables
```

**System Monitoring:**
```
GET http://localhost:3001/api/system/metrics
```

### AI Agents (Port 5000)

**Chat with Agent:**
```
POST http://localhost:5000/agent/chat
```

**Generate Code:**
```
POST http://localhost:5000/agent/generate
```

**Code Review:**
```
POST http://localhost:5000/agent/review
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + `` | Toggle Terminal |
| `Ctrl + L` | Toggle AI Agent Panel |
| `Ctrl + B` | Toggle Sidebar |
| `Ctrl + P` | Quick File Search |
| `Ctrl + Shift + F` | Search in Files |
| `Ctrl + S` | Save File |
| `Ctrl + W` | Close Tab |

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Mayank Chaudhari**

- GitHub: [@Mayank11104](https://github.com/Mayank11104)
- LinkedIn: [Connect with me](https://www.linkedin.com/in/mayank-chaudhari)

---

## Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VSCode's editor
- [Xterm.js](https://xtermjs.org/) - Terminal emulator
- [LangGraph](https://github.com/langchain-ai/langgraph) - Multi-agent framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) - AI capabilities

---

## Support

If you have any questions or need help:

- Open an [Issue](https://github.com/Mayank11104/EraCODE-IDE/issues)
- Start a [Discussion](https://github.com/Mayank11104/EraCODE-IDE/discussions)

---

<div align="center">

**Star this repository if you find it helpful!**

Made with ❤️ by [Mayank Chaudhari](https://github.com/Mayank11104)

</div>
