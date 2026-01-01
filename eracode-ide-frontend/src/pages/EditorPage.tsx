import { useRef, useEffect } from 'react';

import type { editor } from 'monaco-editor';
import type { OnMount, OnChange } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import { X, File, ChevronRight } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';

export default function EditorPage() {
  const { openFiles, activeFileId, closeFile, setActiveFile, updateFileContent } = useEditorStore();
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const currentFile = openFiles.find((file) => file.id === activeFileId);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined && currentFile) {
      updateFileContent(currentFile.id, value);
    }
  };

  const switchToFile = (fileId: string) => {
    setActiveFile(fileId);
  };

  const handleCloseFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeFile(fileId);
  };

  const getBreadcrumbs = () => {
    if (!currentFile) return [];
    return currentFile.path.split('/');
  };

  // Focus editor when switching files
  useEffect(() => {
    if (editorRef.current && currentFile) {
      editorRef.current.focus();
    }
  }, [currentFile?.id]);

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* File Tabs */}
      <div className="flex items-center h-[35px] bg-[#252526] border-b border-[#3e3e42] overflow-x-auto">
        {openFiles.length > 0 ? (
          openFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => switchToFile(file.id)}
              className={`group flex items-center gap-2 px-3 h-full cursor-pointer border-r border-[#3e3e42] hover:bg-[#2a2d2e] transition-colors ${
                file.id === activeFileId
                  ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]'
                  : 'bg-[#252526] text-[#969696]'
              }`}
            >
              <File size={14} className="shrink-0" />
              <span className="text-[13px] whitespace-nowrap select-none">
                {file.name}
              </span>
              {file.isDirty && (
                <span className="text-white text-xs ml-0.5">●</span>
              )}
              <button
                onClick={(e) => handleCloseFile(file.id, e)}
                className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-[#3e3e42] rounded p-0.5 transition-all"
                aria-label={`Close ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-[13px] text-[#969696]">
            No files open
          </div>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      {currentFile && (
        <div className="flex items-center h-[22px] px-4 bg-[#1e1e1e] border-b border-[#3e3e42] text-[#cccccc] text-xs select-none">
          {getBreadcrumbs().map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight size={12} className="mx-1 text-[#6e6e6e]" />
              )}
              <span
                className={`hover:text-white cursor-pointer transition-colors ${
                  index === getBreadcrumbs().length - 1
                    ? 'font-semibold text-white'
                    : ''
                }`}
              >
                {crumb}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        {currentFile ? (
          <Editor
            height="100%"
            theme="vs-dark"
            path={currentFile.path}
            language={currentFile.language}
            value={currentFile.content}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'off',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              padding: { top: 10 },
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#969696]">
            <div className="text-center">
              <File size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">No file open</p>
              <p className="text-sm text-[#6e6e6e] mt-2">
                Click a file in Explorer to start editing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
