# 🚀 EraCODE IDE

<div align="center">

![EraCODE IDE](https://img.shields.io/badge/EraCODE-IDE-blue?style=for-the-badge&logo=visual-studio-code)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**A Next-Generation Cloud-Native IDE with AI-Powered Development Assistance**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**EraCODE IDE** is a modern, full-featured Integrated Development Environment built with cutting-edge web technologies. It combines the power of cloud computing, AI assistance, and comprehensive development tools into a single, seamless platform. Whether you're coding locally or managing cloud infrastructure, EraCODE IDE provides everything you need in one place.

### 🎯 Key Highlights

- **🤖 AI-Powered Coding Assistant** - Integrated LangGraph-based multi-agent system with Groq/OpenAI support
- **☁️ Cloud Terminal Support** - Connect to AWS EC2, SSH servers, and local terminals seamlessly
- **🐳 Docker Management** - Full container lifecycle management with real-time monitoring
- **🔄 CI/CD Integration** - GitHub Actions workflow visualization and management
- **📊 System Monitoring** - Real-time CPU, memory, network, and process tracking
- **🗄️ Database Management** - Support for PostgreSQL, MySQL, MongoDB, and SQLite
- **🧪 API Testing** - Built-in HTTP/WebSocket API tester with cookie inspection
- **📁 File Explorer** - Full-featured file system with drag-and-drop support
- **🎨 Monaco Editor** - VSCode-quality code editing with syntax highlighting
- **🔍 Advanced Search** - Multi-file search with regex support
- **📈 Data Visualization** - Mermaid diagrams, charts, and workflow visualizations

---

## ✨ Features

### 🎨 **Modern UI/UX**
- Sleek dark theme with smooth animations
- Resizable panels with drag-and-drop support
- Multi-tab editor with file management
- Responsive design for all screen sizes

### 💻 **Terminal Capabilities**
- **Local Terminals** - Native terminal support (PowerShell, CMD, Bash, WSL)
- **Cloud Terminals** - AWS EC2 instance management and SSH connections
- **Multi-Terminal** - Multiple terminal sessions with easy switching
- **WebSocket-based** - Real-time terminal streaming with low latency

### 🤖 **AI Agent System**
- Multi-agent architecture using LangGraph
- Code generation and refactoring assistance
- Intelligent code review and suggestions
- Natural language to code conversion
- Context-aware completions

### 🐳 **Docker Integration**
- Container lifecycle management (start, stop, restart, remove)
- Real-time container logs streaming
- Resource usage monitoring
- Image management
- Network and volume inspection

### 🔄 **CI/CD Pipeline**
- GitHub Actions workflow visualization
- Real-time build status monitoring
- Pipeline stage tracking
- Workflow execution history
- Integration with GitHub repositories

### 🗄️ **Database Tools**
- **PostgreSQL** - Full query editor with schema browser
- **MySQL** - Table management and data visualization
- **MongoDB** - Document explorer and query builder
- **SQLite** - Lightweight database support
- Connection pooling and management

### 🧪 **API Testing**
- HTTP request builder (GET, POST, PUT, DELETE, PATCH)
- WebSocket connection testing
- Cookie inspection (including HttpOnly cookies)
- Header management
- Response visualization
- Request history

### 📊 **System Monitoring**
- Real-time CPU and memory usage
- Network I/O tracking
- Process management
- Disk usage statistics
- System information dashboard

### 🎨 **Visualization Tools**
- Mermaid diagram rendering
- Flowchart and sequence diagrams
- Data charts (line, bar, pie)
- Architecture diagrams
- Git graph visualization

### 🔍 **Search & Navigation**
- Multi-file text search
- Regex pattern matching
- File type filtering
- Search history
- Quick file navigation

### 📁 **File Management**
- Tree-view file explorer
- Drag-and-drop file operations
- File upload/download
- Context menu operations
- File watching and auto-refresh

---

## 🏗️ Architecture

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
│  │  - Zustand   │  │  - node-pty  │  │  - Groq/GPT  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │  Browser │        │  Docker  │        │   AWS    │
   └──────────┘        └──────────┘        └──────────┘
```

### 📦 Components

#### **Frontend** (`eracode-ide-frontend`)
- **Framework**: React 19 + TypeScript + Vite
- **State Management**: Zustand
- **Editor**: Monaco Editor (VSCode engine)
- **Terminal**: Xterm.js with WebSocket support
- **Styling**: TailwindCSS 4
- **UI Components**: Custom components with Lucide icons
- **Real-time**: Socket.IO client

#### **Backend** (`eracode-ide-backend`)
- **Runtime**: Node.js + Express
- **WebSocket**: Socket.IO for real-time communication
- **Terminal**: node-pty for native terminal support
- **Cloud**: AWS SDK for EC2 management, SSH2 for remote connections
- **Docker**: Dockerode for container management
- **Database**: Sequelize (SQL), Mongoose (MongoDB)
- **File System**: Chokidar for file watching
- **Git**: simple-git for version control

#### **AI Agents** (`eracode-ide-agents-backend`)
- **Framework**: FastAPI + Python
- **AI Engine**: LangGraph for multi-agent orchestration
- **LLM Providers**: Groq (Llama), OpenAI (GPT-4)
- **Chains**: LangChain for prompt engineering
- **Tools**: Custom tools for code analysis and generation

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.10+
- **Docker** (optional, for container management)
- **AWS Account** (optional, for cloud terminals)
- **Git**

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Mayank11104/EraCODE-IDE.git
cd EraCODE-IDE
```

### 2️⃣ Setup Frontend

```bash
cd eracode-ide-frontend
npm install
```

Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_AI_BACKEND_URL=http://localhost:8000
```

### 3️⃣ Setup Backend

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

### 4️⃣ Setup AI Agents Backend

```bash
cd ../eracode-ide-agents-backend
pip install -r requirements.txt
```

Create `.env` file:
```env
# LLM Provider (groq or openai)
MODEL_PROVIDER=groq
MODEL_NAME=llama-3.3-70b-versatile

# API Keys
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=8000
DEBUG=true
NODE_BACKEND_URL=http://localhost:3001
```

### 5️⃣ Setup Databases (Optional)

Using Docker Compose:
```bash
cd ..
docker-compose up -d
```

This will start:
- PostgreSQL on port 5433
- MongoDB on port 27017

---

## 🎮 Usage

### Start All Services

#### Terminal 1: Frontend
```bash
cd eracode-ide-frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

#### Terminal 2: Backend
```bash
cd eracode-ide-backend
npm run dev
```
Backend will run on `http://localhost:3001`

#### Terminal 3: AI Agents
```bash
cd eracode-ide-agents-backend
python -m uvicorn src.main:app --reload --port 8000
```
AI Backend will run on `http://localhost:8000`

### Access the IDE

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🛠️ Tech Stack

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
| Groq | Fast LLM Inference |
| OpenAI | GPT Models |
| Pydantic | Data Validation |
| Uvicorn | ASGI Server |

---

## 📸 Screenshots

### Main IDE Interface
![Main Interface](docs/screenshots/main-interface.png)

### AI Agent Assistant
![AI Agent](docs/screenshots/ai-agent.png)

### Docker Management
![Docker Panel](docs/screenshots/docker-panel.png)

### Database Explorer
![Database](docs/screenshots/database-panel.png)

### API Testing
![API Tester](docs/screenshots/api-tester.png)

---

## 🗺️ Roadmap

- [ ] **Collaborative Editing** - Real-time multi-user editing
- [ ] **Plugin System** - Extensible plugin architecture
- [ ] **Theme Customization** - Custom theme editor
- [ ] **Kubernetes Support** - K8s cluster management
- [ ] **Code Debugging** - Integrated debugger
- [ ] **Git GUI** - Visual git operations
- [ ] **Mobile App** - iOS/Android companion apps
- [ ] **Self-Hosted** - Docker deployment option
- [ ] **Marketplace** - Extension marketplace

---

## 🤝 Contributing

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Mayank Sharma**

- GitHub: [@Mayank11104](https://github.com/Mayank11104)
- LinkedIn: [Connect with me](https://www.linkedin.com/in/mayank-sharma)

---

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VSCode's editor
- [Xterm.js](https://xtermjs.org/) - Terminal emulator
- [LangGraph](https://github.com/langchain-ai/langgraph) - Multi-agent framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS

---

## 📞 Support

If you have any questions or need help, please:

- Open an [Issue](https://github.com/Mayank11104/EraCODE-IDE/issues)
- Start a [Discussion](https://github.com/Mayank11104/EraCODE-IDE/discussions)
- Contact via [Email](mailto:your.email@example.com)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Mayank Chaudhari](https://github.com/Mayank11104)

</div>
