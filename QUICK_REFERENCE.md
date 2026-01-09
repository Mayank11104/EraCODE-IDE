# 📋 EraCODE IDE - Quick Reference Guide

## 🎯 Quick Start Commands

### Start Development Environment

```bash
# Terminal 1 - Frontend
cd eracode-ide-frontend && npm run dev

# Terminal 2 - Backend  
cd eracode-ide-backend && npm run dev

# Terminal 3 - AI Agents
cd eracode-ide-agents-backend && uvicorn src.main:app --reload --port 8000
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **AI Agents**: http://localhost:8000/docs

---

## ⌨️ Keyboard Shortcuts

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

## 🔧 Configuration Files

### Frontend Environment (`.env`)
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_AI_BACKEND_URL=http://localhost:8000
```

### Backend Environment (`.env`)
```env
PORT=3001
NODE_ENV=development

# AWS (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Database (Optional)
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=postgres

MONGO_URI=mongodb://admin:password123@localhost:27017
```

### AI Agents Environment (`.env`)
```env
MODEL_PROVIDER=groq
MODEL_NAME=llama-3.3-70b-versatile
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
PORT=8000
DEBUG=true
NODE_BACKEND_URL=http://localhost:3001
```

---

## 🐳 Docker Quick Commands

### Start Databases
```bash
docker-compose up -d
```

### Stop Databases
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

---

## 📚 API Endpoints Reference

### Backend REST API

#### Health Check
```bash
GET http://localhost:3001/api/health
```

#### Terminals
```bash
GET http://localhost:3001/api/terminals
```

#### Git Operations
```bash
POST http://localhost:3001/api/git/clone
POST http://localhost:3001/api/git/commit
POST http://localhost:3001/api/git/push
GET  http://localhost:3001/api/git/status
```

#### Docker Operations
```bash
GET  http://localhost:3001/api/docker/containers
POST http://localhost:3001/api/docker/containers/:id/start
POST http://localhost:3001/api/docker/containers/:id/stop
```

#### Database Operations
```bash
POST http://localhost:3001/api/database/connect
POST http://localhost:3001/api/database/query
GET  http://localhost:3001/api/database/tables
```

#### File Operations
```bash
GET  http://localhost:3001/api/files/read
POST http://localhost:3001/api/files/write
POST http://localhost:3001/api/files/delete
```

#### Search
```bash
POST http://localhost:3001/api/search/files
POST http://localhost:3001/api/search/content
```

#### System Monitoring
```bash
GET http://localhost:3001/api/system/metrics
```

#### API Proxy
```bash
POST http://localhost:3001/api/proxy-request
```

### AI Agents API

#### Chat with Agent
```bash
POST http://localhost:8000/agent/chat
Body: {
  "message": "Generate a React component",
  "context": "..."
}
```

#### Generate Code
```bash
POST http://localhost:8000/agent/generate
Body: {
  "prompt": "Create a login form",
  "language": "typescript"
}
```

#### Code Review
```bash
POST http://localhost:8000/agent/review
Body: {
  "code": "...",
  "language": "javascript"
}
```

---

## 🔌 WebSocket Events

### Terminal Socket (Socket.IO)
```javascript
// Connect
const socket = io('http://localhost:3001')

// Create terminal
socket.emit('terminal:create', { type: 'local' })

// Send input
socket.emit('terminal:input', { terminalId, data })

// Receive output
socket.on('terminal:output', ({ terminalId, data }) => {})

// Close terminal
socket.emit('terminal:close', { terminalId })
```

### System Monitor Socket
```javascript
// Subscribe to metrics
socket.emit('system:subscribe')

// Receive metrics
socket.on('system:metrics', (data) => {
  console.log(data.cpu, data.memory, data.network)
})

// Unsubscribe
socket.emit('system:unsubscribe')
```

---

## 🗄️ Database Connection Strings

### PostgreSQL
```
postgresql://postgres:mysecretpassword@localhost:5433/postgres
```

### MongoDB
```
mongodb://admin:password123@localhost:27017
```

### MySQL
```
mysql://root:password@localhost:3306/database
```

### SQLite
```
sqlite:///path/to/database.db
```

---

## 🛠️ Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend connection issues
```bash
# Check if port 3001 is available
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <pid> /F
```

### AI Agents not responding
```bash
# Check Python environment
python --version  # Should be 3.10+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check API keys
echo $GROQ_API_KEY
```

### Docker containers not starting
```bash
# Check Docker status
docker ps -a

# Restart Docker service
# Windows: Restart Docker Desktop
# Linux: sudo systemctl restart docker

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

---

## 📦 Project Structure

```
EraCODE-IDE/
├── eracode-ide-frontend/          # React Frontend
│   ├── src/
│   │   ├── components/            # UI Components
│   │   │   ├── panels/           # Feature Panels
│   │   │   ├── Sidebar.tsx       # Main Sidebar
│   │   │   ├── AgentPanel.tsx    # AI Agent UI
│   │   │   └── ...
│   │   ├── pages/                # Main Pages
│   │   │   ├── MainPage.tsx      # IDE Layout
│   │   │   ├── EditorPage.tsx    # Code Editor
│   │   │   └── TerminalPage.tsx  # Terminal
│   │   ├── stores/               # Zustand Stores
│   │   ├── services/             # API Services
│   │   ├── hooks/                # Custom Hooks
│   │   └── types/                # TypeScript Types
│   └── package.json
│
├── eracode-ide-backend/           # Node.js Backend
│   ├── controllers/              # Route Controllers
│   ├── services/                 # Business Logic
│   │   ├── terminal.service.js   # Terminal Management
│   │   ├── awsEc2Service.js      # AWS Integration
│   │   ├── dockerService.js      # Docker API
│   │   └── ...
│   ├── routes/                   # API Routes
│   ├── sockets/                  # WebSocket Handlers
│   ├── middleware/               # Express Middleware
│   ├── config/                   # Configuration
│   └── server.js                 # Main Server
│
├── eracode-ide-agents-backend/    # Python AI Backend
│   ├── src/
│   │   ├── agents/               # LangGraph Agents
│   │   ├── tools/                # Agent Tools
│   │   ├── graph/                # Agent Workflows
│   │   ├── api/                  # FastAPI Routes
│   │   ├── models/               # Data Models
│   │   ├── prompts/              # LLM Prompts
│   │   └── main.py               # FastAPI App
│   └── requirements.txt
│
├── docker-compose.yml             # Database Services
└── README.md                      # Main Documentation
```

---

## 🎨 UI Component Guide

### Sidebar Icons
- 📁 Explorer - File browser
- 🔍 Search - Multi-file search
- 🌿 Git - Version control
- 🐛 Debug - Debugging tools
- 🔄 CI/CD - Pipeline monitoring
- 🐳 Docker - Container management
- 🚀 Deploy - Deployment tools
- 📊 Monitor - System metrics
- 🧪 API - API testing
- 🗄️ Database - DB management
- 📈 Visualizer - Diagrams
- 📂 Projects - Project management

### Panel Shortcuts
- Click icon once: Open panel
- Click again: Close panel
- Some panels (Projects, CI/CD, Visualizer): Full-width mode

---

## 🔐 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use `.env.example` for templates
- Rotate API keys regularly

### AWS Credentials
- Use IAM roles when possible
- Limit permissions to minimum required
- Enable MFA on AWS account

### Database Connections
- Use strong passwords
- Enable SSL/TLS for production
- Restrict network access

### API Keys
- Store in environment variables
- Use different keys for dev/prod
- Monitor usage and quotas

---

## 📈 Performance Tips

### Frontend
- Use React DevTools for profiling
- Lazy load heavy components
- Optimize Monaco Editor settings
- Limit terminal buffer size

### Backend
- Enable compression middleware
- Use connection pooling for databases
- Implement request rate limiting
- Monitor memory usage

### AI Agents
- Cache frequent prompts
- Use streaming for long responses
- Implement request queuing
- Monitor token usage

---

## 🧪 Testing

### Frontend Tests
```bash
cd eracode-ide-frontend
npm run test
```

### Backend Tests
```bash
cd eracode-ide-backend
npm run test
```

### AI Agents Tests
```bash
cd eracode-ide-agents-backend
pytest
```

---

## 📞 Support & Resources

### Documentation
- [Full Documentation](docs/README.md)
- [API Reference](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)

### Community
- [GitHub Discussions](https://github.com/Mayank11104/EraCODE-IDE/discussions)
- [Issue Tracker](https://github.com/Mayank11104/EraCODE-IDE/issues)
- [Discord Server](#) (Coming Soon)

### Contact
- Email: your.email@example.com
- LinkedIn: [Mayank Sharma](https://www.linkedin.com/in/mayank-sharma)
- GitHub: [@Mayank11104](https://github.com/Mayank11104)

---

## 🎓 Learning Resources

### Tutorials
- [Getting Started Guide](docs/tutorials/getting-started.md)
- [Building Your First Extension](docs/tutorials/extensions.md)
- [AI Agent Customization](docs/tutorials/ai-agents.md)

### Video Guides
- [Installation Walkthrough](#)
- [Feature Overview](#)
- [Advanced Usage](#)

---

<div align="center">

**Made with ❤️ by [Mayank Sharma](https://github.com/Mayank11104)**

[⭐ Star on GitHub](https://github.com/Mayank11104/EraCODE-IDE) | [🐛 Report Bug](https://github.com/Mayank11104/EraCODE-IDE/issues) | [💡 Request Feature](https://github.com/Mayank11104/EraCODE-IDE/issues)

</div>
