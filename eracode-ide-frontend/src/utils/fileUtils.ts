export const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
        'ts': 'typescript',
        'tsx': 'typescript',
        'js': 'javascript',
        'jsx': 'javascript',
        'json': 'json',
        'css': 'css',
        'scss': 'scss',
        'html': 'html',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rs': 'rust',
        'md': 'markdown',
        'yml': 'yaml',
        'yaml': 'yaml',
        'xml': 'xml',
        'sql': 'sql',
    };

    return languageMap[ext || ''] || 'plaintext';
};

// Sample file contents for demo
export const getSampleFileContent = (fileName: string): string => {
    const contents: Record<string, string> = {
        'App.tsx': `import { useState } from 'react';\nimport './App.css';\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="App">\n      <h1>Welcome to EraCODE IDE</h1>\n      <p>The new era of coding environment</p>\n      <button onClick={() => setCount(count + 1)}>\n        Count: {count}\n      </button>\n    </div>\n  );\n}\n\nexport default App;`,

        'index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI';\n  -webkit-font-smoothing: antialiased;\n}`,

        'package.json': `{\n  "name": "eracode-ide",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1"\n  }\n}`,

        'README.md': `# EraCODE IDE\n\nThe all-in-one agentic development environment.\n\n## Features\n\n- 🚀 Fast and lightweight\n- 🤖 AI-powered coding assistant\n- 📦 Built-in DevOps tools\n\n## Getting Started\n\nOpen a file from Explorer to start coding!`,
    };

    return contents[fileName] || `// ${fileName}\n\n// Start coding here...`;
};
