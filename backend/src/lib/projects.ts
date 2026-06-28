import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { supabaseAdmin } from './supabase'
import { createContainer, getWorkspacePath } from './docker'

export async function seedTemplate(dir: string, type: string) {
  // Helper to write file and ensure parent directory exists
  const writeFileWithDirs = async (filePath: string, content: string) => {
    const fullPath = path.join(dir, filePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content)
  }

  if (type === 'node') {
    // 1. Node.js Express API Boilerplate
    await writeFileWithDirs('package.json', JSON.stringify({
      name: "cloudcode-express-api",
      version: "1.0.0",
      description: "Production-ready Node.js Express API boilerplate",
      main: "src/server.js",
      scripts: {
        "start": "node src/server.js",
        "dev": "node --watch src/server.js"
      },
      dependencies: {
        "express": "^4.19.2",
        "cors": "^2.8.5",
        "dotenv": "^16.4.5",
        "morgan": "^1.10.0",
        "helmet": "^7.1.0"
      }
    }, null, 2))

    await writeFileWithDirs('.env.example', `PORT=3000\nNODE_ENV=development\nAPI_KEY=your_secret_api_key_here\n`)
    await writeFileWithDirs('.env', `PORT=3000\nNODE_ENV=development\nAPI_KEY=dev_api_key_123\n`)

    await writeFileWithDirs('src/server.js', `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const apiRouter = require('./routes/api');
const errorHandler = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1', apiRouter);

// Base Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the CloudCode Node.js API Service',
    docs: '/api/v1/info'
  });
});

// Error Handling
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Server running in \${process.env.NODE_ENV || 'development'} mode on http://0.0.0.0:\${PORT}\`);
});
`)

    await writeFileWithDirs('src/routes/api.js', `const express = require('express');
const router = express.Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Sample Resource Endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'CloudCode Express API',
    version: '1.0.0',
    features: ['Express', 'Helmet Security', 'CORS Enabled', 'Morgan Logging'],
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
`)

    await writeFileWithDirs('src/middleware/error.js', `module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
`)

    await writeFileWithDirs('README.md', `# CloudCode Node.js Express Boilerplate

A clean, production-ready Express API structure.

## Getting Started

Run the following commands inside your terminal:
\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure
- \`src/server.js\` - Application entrypoint & middleware configuration.
- \`src/routes/api.js\` - Modular API endpoints.
- \`src/middleware/error.js\` - Global error handler.
`)

  } else if (type === 'react') {
    // 2. React + Vite SPA Premium Dashboard Template
    await writeFileWithDirs('package.json', JSON.stringify({
      name: "cloudcode-react-dashboard",
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: {
        "dev": "vite --port 3000 --host 0.0.0.0",
        "build": "vite build",
        "preview": "vite preview --port 3000 --host 0.0.0.0"
      },
      dependencies: {
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "lucide-react": "^0.395.0"
      },
      devDependencies: {
        "vite": "^5.2.11",
        "@vitejs/plugin-react": "^4.3.0"
      }
    }, null, 2))

    await writeFileWithDirs('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CloudCode Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`)

    await writeFileWithDirs('vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  }
})
`)

    await writeFileWithDirs('src/main.jsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`)

    await writeFileWithDirs('src/index.css', `:root {
  --background: #090B0F;
  --card: #121620;
  --border: rgba(255,255,255,0.08);
  --text: #F3F4F6;
  --text-secondary: #9CA3AF;
  --primary: #8B5CF6;
  --primary-glow: rgba(139, 92, 246, 0.15);
  --success: #10B981;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

body {
  background-color: var(--background);
  color: var(--text);
  overflow-x: hidden;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background-color: var(--card);
  border-right: 1px solid var(--border);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo span {
  color: var(--primary);
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.menu-item:hover, .menu-item.active {
  color: var(--text);
  background-color: rgba(255, 255, 255, 0.04);
}

.menu-item.active {
  border-left: 3px solid var(--primary);
  background-color: var(--primary-glow);
}

.main-content {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #EC4899);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
}

.card-footer {
  font-size: 12px;
  color: var(--success);
  display: flex;
  align-items: center;
  gap: 4px;
}

.table-container {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.table-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

td {
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

tr:last-child td {
  border-bottom: none;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success);
  display: inline-block;
}
`)

    await writeFileWithDirs('src/App.jsx', `import React, { useState } from 'react'
import { LayoutDashboard, Users, Settings, Bell, TrendingUp, Cpu, Server, ShieldCheck } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          Cloud<span>Code</span>
        </div>
        <ul className="menu">
          <li 
            className={\`menu-item \${activeTab === 'dashboard' ? 'active' : ''}\`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </li>
          <li 
            className={\`menu-item \${activeTab === 'analytics' ? 'active' : ''}\`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={18} />
            Analytics
          </li>
          <li 
            className={\`menu-item \${activeTab === 'settings' ? 'active' : ''}\`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            Settings
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>Console Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
              Welcome back to your cloud workspace environment.
            </p>
          </div>
          <div className="user-profile">
            <Bell size={20} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
            <div className="avatar" />
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="grid">
          <div className="card">
            <div className="card-header">
              <span>CONTAINER STATUS</span>
              <Server size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="card-value">Running</div>
            <div className="card-footer">
              <span>✓ Online & Responsive</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span>CPU UTILIZATION</span>
              <Cpu size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="card-value">1.42%</div>
            <div className="card-footer" style={{ color: 'var(--text-secondary)' }}>
              <span>Load is nominal</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span>SECURITY TUNNEL</span>
              <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
            </div>
            <div className="card-value">Active</div>
            <div className="card-footer">
              <span>✓ Encrypted connection</span>
            </div>
          </div>
        </section>

        {/* Recent Activity Table */}
        <section className="table-container">
          <div className="table-title">Recent Workspace Events</div>
          <table>
            <thead>
              <tr>
                <th>EVENT</th>
                <th>SOURCE</th>
                <th>TIMESTAMP</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Container provisioned</td>
                <td>System Agent</td>
                <td>Just now</td>
                <td><span className="status-badge">Success</span></td>
              </tr>
              <tr>
                <td>Repository cloned</td>
                <td>Git Manager</td>
                <td>5 mins ago</td>
                <td><span className="status-badge">Success</span></td>
              </tr>
              <tr>
                <td>Hot Reload Server Started</td>
                <td>Vite Builder</td>
                <td>10 mins ago</td>
                <td><span className="status-badge">Success</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}
`)

  } else if (type === 'nextjs') {
    // 3. Next.js App Router Boilerplate
    await writeFileWithDirs('package.json', JSON.stringify({
      name: "cloudcode-nextjs-app",
      version: "1.0.0",
      private: true,
      scripts: {
        "dev": "next dev -p 3000 -H 0.0.0.0",
        "build": "next build",
        "start": "next start -p 3000 -H 0.0.0.0"
      },
      dependencies: {
        "next": "^14.2.3",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "lucide-react": "^0.395.0"
      },
      devDependencies: {
        "typescript": "^5.4.5",
        "@types/node": "^20.14.2",
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0"
      }
    }, null, 2))

    await writeFileWithDirs('next.config.js', `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
`)

    await writeFileWithDirs('tsconfig.json', `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`)

    await writeFileWithDirs('src/app/layout.tsx', `import React from 'react';
import './globals.css';

export const metadata = {
  title: 'CloudCode Next.js Workspace',
  description: 'Built with CloudCode',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`)

    await writeFileWithDirs('src/app/globals.css', `body {
  margin: 0;
  padding: 0;
  background-color: #05070A;
  color: #F3F4F6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
`)

    await writeFileWithDirs('src/app/page.tsx', `import React from 'react';
import { Server, Cpu, Globe, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        padding: '8px 16px',
        borderRadius: '99px',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        color: '#A78BFA',
        fontSize: '12px',
        fontWeight: '600',
        marginBottom: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Server size={12} />
        Next.js App Router Workspace Live
      </div>

      <h1 style={{
        fontSize: '42px',
        fontWeight: '800',
        letterSpacing: '-1px',
        margin: '0 0 16px 0',
        background: 'linear-gradient(to right, #ffffff, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Next.js Boilerplate
      </h1>

      <p style={{
        fontSize: '16px',
        color: '#9CA3AF',
        maxWidth: '500px',
        lineHeight: '24px',
        margin: '0 0 40px 0'
      }}>
        A professional, TypeScript-ready Next.js application setup. Edit <code>src/app/page.tsx</code> to begin coding.
      </p>

      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '800px',
        width: '100%'
      }}>
        <div style={{
          flex: '1 1 250px',
          backgroundColor: '#0F131A',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#A78BFA" /> App Router
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF', lineHeight: '18px' }}>
            Fully configured with React Server Components, layout files, and nested routing capabilities.
          </p>
        </div>

        <div style={{
          flex: '1 1 250px',
          backgroundColor: '#0F131A',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} color="#A78BFA" /> API Routes
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF', lineHeight: '18px' }}>
            Supports edge-ready route handlers. Check out the built-in health API endpoint.
          </p>
        </div>
      </div>
    </main>
  );
}
`)

    await writeFileWithDirs('src/app/api/health/route.ts', `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    env: process.env.NODE_ENV
  });
}
`)

  } else if (type === 'flask') {
    // 4. Python Flask Blueprint API Boilerplate
    await writeFileWithDirs('requirements.txt', `Flask==3.0.3\nflask-cors==4.0.1\npython-dotenv==1.0.1\n`)
    await writeFileWithDirs('.env', `FLASK_APP=src/app.py\nFLASK_ENV=development\nPORT=3000\n`)
    
    await writeFileWithDirs('src/app.py', `import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from src.routes.api import api_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    @app.route("/")
    def index():
        return jsonify({
            "status": "success",
            "message": "Welcome to the CloudCode Flask API Service",
            "endpoints": {
                "health": "/api/v1/health",
                "info": "/api/v1/info"
            }
        })

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"status": "error", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)
`)

    await writeFileWithDirs('src/routes/api.py', `from flask import Blueprint, jsonify
import time

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": int(time.time()),
        "service": "Flask API"
    })

@api_bp.route('/info', methods=['GET'])
def info():
    return jsonify({
        "name": "CloudCode Flask Blueprint Service",
        "version": "1.0.0",
        "features": ["Flask Blueprints", "Flask-CORS", "Dotenv Configured"]
    })
`)

    await writeFileWithDirs('README.md', `# CloudCode Flask Boilerplate

Modular Flask API using the Application Factory pattern and Blueprints.

## Setup & Execution

Run in your terminal:
\`\`\`bash
pip3 install -r requirements.txt
python3 src/app.py
\`\`\`
`)

  } else if (type === 'fastapi') {
    // 5. Python FastAPI Clean Boilerplate
    await writeFileWithDirs('requirements.txt', `fastapi==0.111.0\nuvicorn==0.30.1\npydantic==2.7.4\npython-dotenv==1.0.1\n`)
    await writeFileWithDirs('.env', `PORT=3000\nENV=development\n`)

    await writeFileWithDirs('app/main.py', `import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.v1.router import api_router

load_dotenv()

app = FastAPI(
    title="CloudCode FastAPI Service",
    description="Production-ready FastAPI boilerplate with clean structure.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the CloudCode FastAPI Service",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
`)

    await writeFileWithDirs('app/api/v1/router.py', `from fastapi import APIRouter
from app.api.v1.endpoints import items

api_router = APIRouter()

@api_router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "FastAPI"
    }

api_router.include_router(items.router, prefix="/items", tags=["Items"])
`)

    await writeFileWithDirs('app/api/v1/endpoints/items.py', `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float

# Mock DB
db_items = [
    Item(id=1, name="Cloud Node", price=29.99, description="High performance cloud computing node"),
    Item(id=2, name="Encrypted Tunnel", price=9.99, description="Secure TLS connection tunnel")
]

@router.get("/", response_model=List[Item])
def get_items():
    return db_items

@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int):
    for item in db_items:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")
`)

    await writeFileWithDirs('README.md', `# CloudCode FastAPI Boilerplate

FastAPI application featuring Pydantic request/response schemas, structured router directories, and interactive Swagger docs.

## Setup & Execution

Run in your terminal:
\`\`\`bash
pip3 install -r requirements.txt
python3 app/main.py
\`\`\`
`)

  } else if (type === 'gin') {
    // 6. Go Gin Web API Boilerplate
    await writeFileWithDirs('go.mod', `module cloudcode-gin\n\ngo 1.20\n\nrequire github.com/gin-gonic/gin v1.9.1\n`)
    
    await writeFileWithDirs('main.go', `package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Routes
	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "healthy",
				"service": "Go Gin API",
			})
		})

		v1.GET("/info", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"name":    "CloudCode Go Gin Boilerplate",
				"version": "1.0.0",
				"gin":     "v1.9.1",
			})
		})
	}

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Welcome to the CloudCode Go Gin Service",
			"health":  "/api/v1/health",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 Server starting on 0.0.0.0:%s", port)
	r.Run("0.0.0.0:" + port)
}
`)

    await writeFileWithDirs('README.md', `# CloudCode Go Gin Boilerplate

Highly-performant Go web API powered by the Gin framework.

## Setup & Execution

Run in your terminal:
\`\`\`bash
go mod tidy
go run main.go
\`\`\`
`)

  } else if (type === 'rust') {
    // 7. Rust Cargo Actix-Web/Axum API Boilerplate
    await writeFileWithDirs('Cargo.toml', `[package]
name = "cloudcode-rust-api"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7.5"
tokio = { version = "1.38.0", features = ["full"] }
serde = { version = "1.0.204", features = ["derive"] }
serde_json = "1.0.120"
tower-http = { version = "0.5.2", features = ["cors", "trace"] }
`)

    await writeFileWithDirs('src/main.rs', `use axum::{
    routing::get,
    Json, Router,
};
use serde::{Serialize, Deserialize};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

#[derive(Serialize, Deserialize)]
struct HealthStatus {
    status: String,
    service: String,
}

#[derive(Serialize, Deserialize)]
struct WelcomeMessage {
    message: String,
    docs: String,
}

#[tokio::main]
async fn main() {
    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build routes
    let app = Router::new()
        .route("/", get(welcome))
        .route("/api/v1/health", get(health_check))
        .layer(cors);

    // Run the server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("🚀 Rust Axum server running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn welcome() -> Json<WelcomeMessage> {
    Json(WelcomeMessage {
        message: "Welcome to the CloudCode Rust Axum Service".to_string(),
        docs: "/api/v1/health".to_string(),
    })
}

async fn health_check() -> Json<HealthStatus> {
    Json(HealthStatus {
        status: "healthy".to_string(),
        service: "Rust Axum".to_string(),
    })
}
`)

    await writeFileWithDirs('README.md', `# CloudCode Rust Axum Boilerplate

Extremely fast, memory-safe asynchronous Rust web API utilizing the Axum framework and Tokio runtime.

## Setup & Execution

Run in your terminal:
\`\`\`bash
cargo run
\`\`\`
`)

  } else {
    // Fallback: Empty Workspace
    await writeFileWithDirs('README.md', `# CloudCode Blank Workspace\n\nWelcome to your clean cloud development environment. Write code and compile it instantly!\n`)
  }
}

export async function provisionContainer(projectId: string) {
  try {
    const { containerId, port } = await createContainer(projectId)
    await supabaseAdmin
      .from('projects')
      .update({ 
        status: 'ready', 
        container_id: containerId,
        port: port ? parseInt(port, 10) : null
      })
      .eq('id', projectId)
  } catch (err) {
    console.error('Container provisioning failed:', err)
    await supabaseAdmin
      .from('projects')
      .update({ status: 'error' })
      .eq('id', projectId)
  }
}

export async function createProjectInternal(
  userId: string,
  name: string,
  type: 'node' | 'react' | 'empty' | 'flask' | 'fastapi' | 'rust' | 'gin' | 'nextjs'
) {
  const projectId = uuidv4()

  const { data: project, error: dbError } = await supabaseAdmin
    .from('projects')
    .insert({
      id: projectId,
      user_github_id: userId,
      name,
      type,
      status: 'creating',
    })
    .select()
    .single()

  if (dbError) {
    throw new Error(dbError.message)
  }

  const workspacePath = getWorkspacePath(projectId)
  await fs.mkdir(workspacePath, { recursive: true })

  await seedTemplate(workspacePath, type)
  
  // Grant full permissions recursively so the non-root "coder" user in Docker can write to it
  try {
    const { execSync } = require('child_process')
    execSync(`chmod -R 777 "${workspacePath}"`, { stdio: 'ignore' })
  } catch (e) {
    console.error('Failed to chmod recursively:', e)
  }

  provisionContainer(projectId).catch(console.error)

  return project
}
