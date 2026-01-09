import { useState, useEffect } from 'react'
import {
  Database, Server, Table, Play, Plus, RefreshCw, X,
  List, Eye, Network
} from 'lucide-react'

// Types
type DBType = 'postgres' | 'mysql' | 'sqlite' | 'mongodb' | 'mariadb';

interface ConnectionConfig {
  name: string;
  type: DBType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  file?: string; // For SQLite
}

interface TableSchema {
  name: string;
  columns?: any[];
  foreignKeys?: {
    tableName: string;
    columnName: string;
    referencedTableName: string;
    referencedColumnName: string;
  }[];
}

interface CollectionSchema {
  name: string;
  columns?: any[];
}

interface Schema {
  tables?: TableSchema[];
  collections?: CollectionSchema[];
}

export default function DatabasePanel() {
  // State
  const [activeTab, setActiveTab] = useState<'query' | 'schema' | 'connect' | 'data'>('connect');
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [schema, setSchema] = useState<Schema | null>(null);

  // Data / Query State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [insertData, setInsertData] = useState('');
  const [activeTable, setActiveTable] = useState<string | null>(null); // Restore missing state
  /* State for SQL Form */
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Visualizer State
  const [nodes, setNodes] = useState<any[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection Form State
  const [config, setConfig] = useState<ConnectionConfig>({
    name: 'My Database',
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '',
    database: 'postgres'
  });

  const openInsertModal = () => {
    if (config.type === 'mongodb') {
      setInsertData('{\n  \n}');
    } else {
      // Init empty form values for SQL
      const table = schema?.tables?.find(t => t.name === activeTable);
      const initialValues: any = {};
      table?.columns?.forEach((col: any) => {
        initialValues[col.field] = '';
      });
      setFormValues(initialValues);
    }
    setIsInsertModalOpen(true);
  };

  const handleInsert = async () => {
    if (!activeConnectionId || !activeTable) return;
    setIsLoading(true);
    setError(null);

    try {
      let queryText = '';
      if (config.type === 'mongodb') {
        // Validate JSON
        let parsed;
        try { parsed = JSON.parse(insertData); }
        catch (e) { throw new Error("Invalid JSON format"); }

        queryText = JSON.stringify({
          collection: activeTable,
          action: 'insertOne',
          filter: parsed // Backend uses 'filter' as payload for insertOne currently
        });
      } else {
        // Generate SQL INSERT
        const columns = Object.keys(formValues).filter(k => formValues[k] !== ''); // Only insert non-empty? Or all? Let's send all but handle empty strings
        // Better: Filter out empty strings if they are auto-increment? 
        // For simplicity, let's include everything the user typed.

        const cols = columns.map(c => `"${c}"`).join(', '); // Quote identifiers
        const vals = columns.map(c => {
          const val = formValues[c];
          // Simple type inference or quoting
          if (val === null || val === '') return 'NULL';
          if (!isNaN(Number(val)) && val.trim() !== '') return Number(val); // Number
          return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
        }).join(', ');

        queryText = `INSERT INTO "${activeTable}" (${cols}) VALUES (${vals});`;
      }

      const response = await fetch('http://localhost:3001/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: activeConnectionId, query: queryText })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Insert failed');

      setIsInsertModalOpen(false);
      // Refresh view
      handleViewTable(activeTable, 'table'); // 'collection' or 'table' doesn't matter for refresh
      setResults(Array.isArray(data.results) ? data.results : [data.results]); // Show insert result (e.g. { acknowledged: true })

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  // ... Inside Data View Render ...
  // <div className="h-10 ... flex justify-between">
  //    ...
  //    <div className="flex gap-2">
  //        <button onClick={openInsertModal} ...> <Plus .../> Add </button>
  //        <button onClick={() => executeQuery(query)} ...> Refresh </button>
  //    </div>
  // </div>

  // --- Actions ---

  const handleInputChange = (field: keyof ConnectionConfig, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      if (field === 'type') {
        if (value === 'postgres') newConfig.port = 5432;
        if (value === 'mysql') newConfig.port = 3306;
        if (value === 'mariadb') newConfig.port = 3306;
        if (value === 'mongodb') newConfig.port = 27017;
        if (value === 'sqlite') { newConfig.port = undefined; newConfig.host = undefined; }
      }
      return newConfig;
    });
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to connect');

      setActiveConnectionId(data.connectionId);
      setActiveTab('query');
      fetchSchema(data.connectionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchema = async (connectionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/database/schema?connectionId=${connectionId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSchema(data);
    } catch (err: any) {
      console.error("Schema fetch error:", err);
    }
  };

  const executeQuery = async (queryText: string) => {
    if (!activeConnectionId) return;
    setIsLoading(true);
    setResults(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: activeConnectionId, query: queryText })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Query failed');
      setResults(Array.isArray(data.results) ? data.results : [data.results]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunQuery = () => executeQuery(query);

  const handleViewTable = (name: string, _type: 'table' | 'collection') => {
    setActiveTable(name);
    setActiveTab('data');
    setResults(null);

    // Auto-generate "Easy" query
    let q = '';
    if (config.type === 'mongodb') {
      q = JSON.stringify({ collection: name, action: 'find', filter: {} }, null, 2);
    } else {
      q = `SELECT * FROM ${name} LIMIT 100`;
    }
    setQuery(q); // Sync query editor too
    executeQuery(q);
  };

  // --- Visualizer Helper ---

  const generateGraphLayout = (schemaNodes: any[]) => {
    const GRID_COLS = 2;
    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 200; // Increased to match foreignObject height
    const X_GAP = 100;
    const Y_GAP = 80;

    return schemaNodes.map((node, index) => ({
      ...node,
      x: (index % GRID_COLS) * (NODE_WIDTH + X_GAP) + 50,
      y: Math.floor(index / GRID_COLS) * (NODE_HEIGHT + Y_GAP) + 50
    }));
  };

  // Init nodes when schema changes
  useEffect(() => {
    if (schema) {
      const rawNodes = [...(schema.tables || []), ...(schema.collections || [])];
      if (rawNodes.length > 0) {
        setNodes(generateGraphLayout(rawNodes));
      } else {
        setNodes([]);
      }
    }
  }, [schema]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent, nodeName: string, x: number, y: number) => {
    e.stopPropagation();
    setDraggingNode(nodeName);
    setDragOffset({
      x: e.clientX - x,
      y: e.clientY - y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      setNodes(prev => prev.map(n => {
        if (n.name === draggingNode) {
          return { ...n, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
        }
        return n;
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };


  // --- Renderers ---

  return (
    <div className="w-full h-full bg-dark-bg text-text-primary flex">
      {/* SIDEBAR */}
      <div className="w-[300px] border-r border-dark-border flex flex-col bg-dark-surface shrink-0">
        <div className="h-10 px-4 border-b border-dark-border flex items-center justify-between bg-dark-header">
          <span className="font-bold text-sm tracking-wide flex items-center gap-2">
            <Database size={16} className="text-blue-400" /> EXPLORER
          </span>
          <div className="flex gap-1">
            {activeConnectionId && (
              <button onClick={() => setActiveTab('schema')} className={`p-1 rounded hover:bg-dark-hover ${activeTab === 'schema' ? 'text-blue-400' : ''}`} title="Schema Visualizer">
                <Network size={16} />
              </button>
            )}
            <button onClick={() => setActiveTab('connect')} className="p-1 hover:bg-dark-hover rounded" title="New Connection">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!activeConnectionId ? (
            <div className="text-center text-text-secondary mt-10 text-sm p-4">
              <Server size={32} className="mx-auto mb-2 opacity-30" />
              <p>No active connection</p>
              <button onClick={() => setActiveTab('connect')} className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs">
                Connect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="px-2 py-1 text-xs font-bold text-green-400 flex items-center gap-2 border-b border-dark-border pb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                {config.name} ({config.type})
              </div>

              {/* Tables */}
              {schema?.tables && (
                <div>
                  <div className="px-2 text-xs font-semibold text-text-secondary uppercase mb-1">Tables ({schema.tables.length})</div>
                  {schema.tables.map(table => (
                    <div key={table.name} className="flex items-center gap-2 px-2 py-1.5 hover:bg-dark-hover rounded cursor-pointer text-sm group"
                      onClick={() => handleViewTable(table.name, 'table')}>
                      <Table size={14} className="text-blue-300" />
                      <span className="truncate flex-1">{table.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button className="p-0.5 hover:text-white" title="Quick View"><Eye size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collections */}
              {schema?.collections && (
                <div>
                  <div className="px-2 text-xs font-semibold text-text-secondary uppercase mb-1">Collections ({schema.collections.length})</div>
                  {schema.collections.map(coll => (
                    <div key={coll.name} className="flex items-center gap-2 px-2 py-1.5 hover:bg-dark-hover rounded cursor-pointer text-sm group"
                      onClick={() => handleViewTable(coll.name, 'collection')}>
                      <List size={14} className="text-green-300" />
                      <span className="truncate flex-1">{coll.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button className="p-0.5 hover:text-white" title="Quick View"><Eye size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT Area */}
      <div className="flex-1 flex flex-col bg-dark-bg min-w-0 overflow-hidden">

        {/* TABS HEADER (Except for Connect) */}
        {activeTab !== 'connect' && (
          <div className="h-10 border-b border-dark-border bg-dark-header flex items-center px-2 gap-2">
            <button
              onClick={() => setActiveTab('query')}
              className={`px-3 py-1 text-xs font-medium rounded-t border-b-2 ${activeTab === 'query' ? 'border-blue-500 text-white bg-dark-surface' : 'border-transparent text-text-secondary hover:text-white'}`}
            >
              Query Editor
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-3 py-1 text-xs font-medium rounded-t border-b-2 ${activeTab === 'data' ? 'border-green-500 text-white bg-dark-surface' : 'border-transparent text-text-secondary hover:text-white'}`}
            >
              Data View {activeTable ? `(${activeTable})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1 text-xs font-medium rounded-t border-b-2 ${activeTab === 'schema' ? 'border-purple-500 text-white bg-dark-surface' : 'border-transparent text-text-secondary hover:text-white'}`}
            >
              Schema Visualizer
            </button>
          </div>
        )}

        {/* --- 1. CONNECT TAB --- */}
        {activeTab === 'connect' && (
          <div className="p-8 max-w-2xl mx-auto w-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Database size={24} className="text-blue-500" /> Connect to Database
            </h2>
            <div className="bg-dark-surface p-6 rounded-lg border border-dark-border space-y-4 shadow-xl">
              {/* Form Fields Same As Before - Simplified for brevity in this edit, actually need to keep them all */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Connection Name</label>
                  <input type="text" value={config.name} onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Database Type</label>
                  <select value={config.type} onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm focus:border-blue-500 outline-none">
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="mariadb">MariaDB</option>
                    <option value="sqlite">SQLite</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>
              </div>

              {config.type === 'sqlite' ? (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Database File Path</label>
                  <input type="text" value={config.file || ''} onChange={(e) => handleInputChange('file', e.target.value)}
                    placeholder="/path/to/db.sqlite" className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm font-mono" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Host</label>
                      <input type="text" value={config.host} onChange={(e) => handleInputChange('host', e.target.value)}
                        className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Port</label>
                      <input type="number" value={config.port} onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                        className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Username</label>
                      <input type="text" value={config.username} onChange={(e) => handleInputChange('username', e.target.value)}
                        className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
                      <input type="password" value={config.password} onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Database Name</label>
                    <input type="text" value={config.database} onChange={(e) => handleInputChange('database', e.target.value)}
                      className="w-full bg-dark-base border border-dark-border rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-sm flex items-start gap-2">
                  <X size={16} className="mt-0.5" /> {error}
                </div>
              )}

              <button onClick={handleConnect} disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2">
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Server size={16} />}
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        )}

        {/* --- 2. QUERY EDITOR --- */}
        {activeTab === 'query' && (
          <div className="flex flex-col h-full">
            <div className="h-10 border-b border-dark-border bg-dark-header px-4 flex items-center justify-end">
              <button onClick={handleRunQuery} disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium">
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} Run
              </button>
            </div>
            <textarea value={query} onChange={(e) => setQuery(e.target.value)}
              className="h-[40%] bg-dark-bg text-text-primary p-4 font-mono text-sm resize-none outline-none border-b border-dark-border"
              placeholder="SELECT * FROM..." spellCheck={false} />
            <div className="flex-1 overflow-auto bg-dark-bg p-4">
              <ResultTable results={results} error={error} />
            </div>
          </div>
        )}

        {/* --- 3. DATA VIEW --- */}
        {activeTab === 'data' && (
          <div className="flex flex-col h-full">
            <div className="h-10 border-b border-dark-border bg-dark-header px-4 flex items-center justify-between">
              <div className="text-sm font-bold flex items-center gap-2">
                {activeTable ? <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">{activeTable}</span> : 'Select a table'}
              </div>
              <div className="flex gap-2">
                {activeTable && (
                  <button onClick={openInsertModal} className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs border border-blue-600/30 transition-colors">
                    <Plus size={14} /> <span className="hidden sm:inline">Add Record</span>
                  </button>
                )}
                <button onClick={() => executeQuery(query)} className="p-1 hover:bg-dark-hover rounded" title="Refresh">
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-dark-bg p-4">
              <ResultTable results={results} error={error} emptyMessage="Select a table from the explorer to view data." />
            </div>
          </div>
        )}

        {/* --- 4. SCHEMA VISUALIZER --- */}
        {activeTab === 'schema' && (
          <div className="flex-1 overflow-auto bg-dark-bg relative">
            <div className="absolute inset-0 min-w-[800px] min-h-[600px] bg-dots"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}>
              {activeConnectionId && nodes.length > 0 ? (
                <svg width="100%" height="100%" className="overflow-visible">
                  {/* Lines (Edges) */}
                  {nodes.map(node => (
                    node.foreignKeys?.map((fk: any, i: number) => {
                      const target = nodes.find(n => n.name === fk.referencedTableName);
                      if (!target) return null;

                      // Smart Anchor Logic
                      const startRight = node.x < target.x; // if target is to the right, start from right

                      const startX = startRight ? node.x + 220 : node.x;
                      const startY = node.y + 40 + (i * 15); // Stagger start Y distinct per FK

                      const endRight = !startRight; // Target connects on opposite side
                      const endX = endRight ? target.x + 220 : target.x;
                      const endY = target.y + 40; // Target roughly top-ish

                      const cp1X = startRight ? startX + 80 : startX - 80;
                      const cp1Y = startY;
                      const cp2X = endRight ? endX + 80 : endX - 80;
                      const cp2Y = endY;

                      // Midpoint for label
                      const t = 0.5;
                      const midX = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * cp1X + 3 * (1 - t) * Math.pow(t, 2) * cp2X + Math.pow(t, 3) * endX;
                      const midY = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * cp1Y + 3 * (1 - t) * Math.pow(t, 2) * cp2Y + Math.pow(t, 3) * endY;

                      return (
                        <g key={`${node.name}-${fk.columnName}-${i}`}>
                          <path
                            d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`}
                            stroke="#4b5563"
                            strokeWidth="2"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                          />
                          <rect x={midX - 40} y={midY - 10} width="80" height="20" rx="4" fill="#1e1e1e" stroke="#333" />
                          <text x={midX} y={midY + 4} textAnchor="middle" fill="#9ca3af" fontSize="10px">
                            {fk.columnName} → {fk.referencedColumnName}
                          </text>
                        </g>
                      );
                    })
                  ))}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
                    </marker>
                    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#333" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#smallGrid)" fillOpacity="0.3" pointerEvents="none" />

                  {/* Nodes (Tables/Collections) */}
                  {nodes.map(node => (
                    <foreignObject key={node.name} x={node.x} y={node.y} width="220" height="220" className="overflow-visible">
                      <div
                        className={`w-[220px] bg-dark-surface border rounded-lg shadow-xl overflow-hidden cursor-move select-none transition-shadow ${draggingNode === node.name ? 'border-blue-500 shadow- blue-500/20 z-50' : 'border-dark-border'}`}
                        onMouseDown={(e) => handleMouseDown(e, node.name, node.x, node.y)}
                      >
                        <div className="bg-dark-header px-3 py-2 border-b border-dark-border font-bold text-xs flex items-center justify-between pointer-events-none">
                          <span className="truncate">{node.name}</span>
                          {node.foreignKeys ? <Table size={12} className="text-blue-400" /> : <List size={12} className="text-green-400" />}
                        </div>
                        <div className="max-h-[180px] overflow-y-auto p-2 space-y-1 pointer-events-none">
                          {node.columns?.slice(0, 10).map((col: any) => (
                            <div key={col.field} className="flex justify-between text-[10px] text-text-secondary">
                              <span className={col.primaryKey ? 'text-yellow-400 font-bold' : 'break-all'}>{col.field}</span>
                              <span className="text-gray-500 shrink-0 ml-2">{col.type}</span>
                            </div>
                          ))}
                          {node.columns && node.columns.length > 10 && <div className="text-[10px] text-gray-500 italic">...more</div>}
                        </div>
                      </div>
                    </foreignObject>
                  ))}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No schema loaded
                </div>
              )}
            </div>
          </div>
        )}

        {/* INSERT MODAL */}
        {isInsertModalOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-surface border border-dark-border rounded-lg shadow-2xl w-[500px] flex flex-col">
              <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between bg-dark-header">
                <span className="font-bold text-sm">Add to {activeTable}</span>
                <button onClick={() => setIsInsertModalOpen(false)} className="text-text-secondary hover:text-white"><X size={16} /></button>
              </div>
              <div className="p-4 flex-1">
                <p className="text-xs text-text-secondary mb-2">
                  {config.type === 'mongodb' ? 'Enter JSON document to insert:' : 'Enter SQL INSERT statement:'}
                </p>
                <textarea
                  value={insertData}
                  onChange={(e) => setInsertData(e.target.value)}
                  className="w-full h-[200px] bg-dark-bg border border-dark-border rounded p-3 font-mono text-sm outline-none focus:border-blue-500"
                  placeholder={config.type === 'mongodb' ? '{\n  "field": "value"\n}' : 'INSERT INTO table (col) VALUES (val);'}
                />
              </div>
              <div className="px-4 py-3 border-t border-dark-border bg-dark-header flex justify-end gap-2">
                <button onClick={() => setIsInsertModalOpen(false)} className="px-3 py-1.5 text-xs text-text-secondary hover:text-white">Cancel</button>
                <button onClick={handleInsert} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">
                  {isLoading ? 'Inserting...' : 'Insert'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// --- Component: Result Table ---
function ResultTable({ results, error, emptyMessage = "No results" }: { results: any[] | null, error: string | null, emptyMessage?: string }) {
  if (error) return <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-sm mb-4">Error: {error}</div>;
  if (!results) return <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50"><Table size={48} className="mb-2" /><p>{emptyMessage}</p></div>;
  if (results.length === 0) return <div className="text-text-secondary text-sm italic">Query returned no results.</div>;

  return (
    <div className="w-full overflow-auto border border-dark-border rounded">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-dark-surface sticky top-0">
          <tr>{Object.keys(results[0]).map(key => <th key={key} className="p-2 border-b border-dark-border font-medium text-text-secondary whitespace-nowrap">{key}</th>)}</tr>
        </thead>
        <tbody>
          {results.map((row, i) => (
            <tr key={i} className="hover:bg-dark-hover border-b border-dark-base">
              {Object.values(row).map((val: any, j) => (
                <td key={j} className="p-2 whitespace-nowrap text-text-primary">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
