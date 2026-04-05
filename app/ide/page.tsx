"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Code, Save, Upload, ArrowLeft, Trash2, File, X, CheckCircle, Loader2, Play, TerminalSquare, LayoutDashboard, ChevronRight, ChevronDown, FolderClosed, FolderOpen, Plus, Brain, Send
} from "lucide-react"
import Link from "next/link"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface EditorFile {
  id: string
  name: string
  content: string
  language: string
  saved: boolean
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const STARTER_FILES: EditorFile[] = [
  {
    id: "html-1",
    name: "src/index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Project</title>
</head>
<body>
  <h1>Hello, ProjExpert!</h1>
  <p>Edit this file and click "Go Live" to preview instantly.</p>
</body>
</html>`,
    language: "html",
    saved: true,
  },
  {
    id: "css-1",
    name: "src/styles/app.css",
    content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  background: #0d1117;
  color: #c9d1d9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

h1 {
  color: #58a6ff;
  margin-bottom: 1rem;
}

p {
  color: #8b949e;
}`,
    language: "css",
    saved: true,
  },
  {
    id: "js-1",
    name: "src/js/main.js",
    content: `document.addEventListener('DOMContentLoaded', () => {
  console.log('IDE environment loaded successfully!');
  
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.addEventListener('click', () => {
      console.log('Header clicked! Changing color...');
      h1.style.color = '#' + Math.floor(Math.random()*16777215).toString(16);
    });
  }
});`,
    language: "javascript",
    saved: true,
  },
]

const LANG_MAP: Record<string, string> = {
  html: "html",
  htm: "html",
  css: "css",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  json: "json",
  md: "markdown"
}

export default function IDEPage() {
  const [files, setFiles] = useState<EditorFile[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ide_files")
      if (saved) return JSON.parse(saved)
    }
    return STARTER_FILES
  })
  
  const [activeFileId, setActiveFileId] = useState(files[0]?.id || "")
  const [logs, setLogs] = useState<{ id: string, text: string, type: 'info'|'error'|'success' }[]>([
    { id: '1', text: '[System] Project environment initialized.', type: 'info' }
  ])
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  
  // Folders UI state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/styles', 'src/js']))
  const [newFilePath, setNewFilePath] = useState("")
  const [showNewFile, setShowNewFile] = useState(false)
  
  // Right Panel State
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<"preview" | "chat">("preview")
  const [previewKey, setPreviewKey] = useState(0) // Used to force reload iframe
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeFile = files.find((f) => f.id === activeFileId) || files[0]

  useEffect(() => {
    // Listen for console logs from the iframe preview
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'IDE_LOG') {
        setLogs(prev => [...prev, { id: Date.now().toString(), text: `[Browser] ${e.data.data}`, type: 'info' }])
      } else if (e.data?.type === 'IDE_ERROR') {
        setLogs(prev => [...prev, { id: Date.now().toString(), text: `[Browser Error] ${e.data.data}`, type: 'error' }])
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/ai/chat")
        if (res.ok) {
          const data = await res.json()
          if (data.messages?.length > 0) {
            setMessages(
              data.messages.map((m: any) => ({
                id: m._id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }))
            )
          } else {
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: `Hello! I'm Alex. I can help you with your code right here in the IDE. Let me know if you get stuck on an active file!`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ])
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadHistory()
  }, [])

  // Auto scroll chat
  useEffect(() => {
    if (rightPanelTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, rightPanelTab])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return
    const text = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Connection error.", timestamp: "Now" }
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleEditorChange = useCallback((value: string | undefined) => {
    setFiles((prev) => prev.map((f) => (f.id === activeFileId ? { ...f, content: value ?? "", saved: false } : f)))
  }, [activeFileId])

  const saveFile = () => {
    setFiles((prev) => {
      const updated = prev.map((f) => (f.id === activeFileId ? { ...f, saved: true } : f))
      localStorage.setItem("ide_files", JSON.stringify(updated))
      return updated
    })
    setLogs(prev => [...prev, { id: Date.now().toString(), text: `[Editor] Saved ${activeFile?.name}`, type: 'success' }])
    
    // Auto-update preview on save if it's open
    if (showRightPanel && rightPanelTab === "preview") {
      setPreviewKey(k => k + 1)
    }
  }

  const submitFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (!file) return

    setSubmitting(fileId)
    setLogs(prev => [...prev, { id: Date.now().toString(), text: `[AI Agent] Analyzing ${file.name} for code quality...`, type: 'info' }])
    
    try {
      const blob = new Blob([file.content], { type: "text/plain" })
      const formData = new FormData()
      formData.append("file", blob, file.name)

      const res = await fetch("/api/files/upload", { method: "POST", body: formData })
      if (res.ok) {
        setSubmitted((prev) => new Set([...prev, fileId]))
        setLogs(prev => [...prev, { id: Date.now().toString(), text: `[AI Agent] Success! ${file.name} submitted for review. View the File Review panel to see results.`, type: 'success' }])
      } else {
        setLogs(prev => [...prev, { id: Date.now().toString(), text: `[AI Agent] Upload failed for ${file.name}.`, type: 'error' }])
      }
    } catch {
      setLogs(prev => [...prev, { id: Date.now().toString(), text: `[Network] Connection error while submitting.`, type: 'error' }])
    } finally {
      setSubmitting(null)
    }
  }

  const addNewFile = () => {
    if (!newFilePath.trim()) return
    let path = newFilePath.trim()
    // ensure no leading slashes
    if (path.startsWith('/')) path = path.substring(1)
    
    const ext = path.split(".").pop()?.toLowerCase() || "txt"
    const language = LANG_MAP[ext] || "plaintext"
    const isComponent = ext === "jsx" || ext === "tsx"
    
    const initialContent = isComponent 
      ? `export default function Component() {\n  return (\n    <div>\n      New Component\n    </div>\n  )\n}`
      : `// ${path}\n`

    const newFile: EditorFile = {
      id: Date.now().toString(),
      name: path,
      content: initialContent,
      language,
      saved: true,
    }
    
    setFiles((prev) => {
        const next = [...prev, newFile]
        localStorage.setItem("ide_files", JSON.stringify(next))
        return next
    })
    
    // Auto-expand new folder path
    const parts = path.split('/')
    if(parts.length > 1) {
        const foldersToExpand: string[] = []
        let current = ""
        for(let i=0; i<parts.length-1; i++) {
            current += (current ? '/' : '') + parts[i]
            foldersToExpand.push(current)
        }
        setExpandedFolders(prev => new Set([...prev, ...foldersToExpand]))
    }

    setActiveFileId(newFile.id)
    setNewFilePath("")
    setShowNewFile(false)
    setLogs(prev => [...prev, { id: Date.now().toString(), text: `[Editor] Created file ${path}`, type: 'success' }])
  }

  const deleteFile = (fileId: string) => {
    if (files.length === 1) {
      setLogs(prev => [...prev, { id: Date.now().toString(), text: "[Editor] Cannot delete the last file.", type: "error" }])
      return
    }
    const file = files.find(f => f.id === fileId)
    const newFiles = files.filter((f) => f.id !== fileId)
    setFiles(newFiles)
    localStorage.setItem("ide_files", JSON.stringify(newFiles))
    if (activeFileId === fileId) setActiveFileId(newFiles[0].id)
    setLogs(prev => [...prev, { id: Date.now().toString(), text: `[Editor] Deleted ${file?.name}`, type: 'info' }])
  }

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase()
    if (ext === "html") return <span className="text-orange-500 font-bold text-[10px]">HTML</span>
    if (ext === "css") return <span className="text-blue-400 font-bold text-[10px]">CSS</span>
    if (ext === "js" || ext === "jsx") return <span className="text-yellow-400 font-bold text-[10px]">JS</span>
    if (ext === "ts" || ext === "tsx") return <span className="text-blue-500 font-bold text-[10px]">TS</span>
    if (ext === "py") return <span className="text-green-400 font-bold text-[10px]">PY</span>
    if (ext === "json") return <span className="text-green-300 font-bold text-[10px]">{'{ }'}</span>
    if (ext === "md") return <span className="text-gray-300 font-bold text-[10px]">MD</span>
    return <File className="w-3 h-3 text-gray-400" />
  }

  // File tree rendering logic
  const fileTree = () => {
    const root: any = { files: [], dirs: {} }
    
    files.forEach(file => {
      const parts = file.name.split('/')
      let current = root
      let pathSoFar = ""
      
      for (let i = 0; i < parts.length - 1; i++) {
        pathSoFar += (pathSoFar ? '/' : '') + parts[i]
        if (!current.dirs[parts[i]]) {
          current.dirs[parts[i]] = { files: [], dirs: {}, path: pathSoFar, name: parts[i] }
        }
        current = current.dirs[parts[i]]
      }
      current.files.push(file)
    })

    const toggleFolder = (path: string) => {
      setExpandedFolders(prev => {
        const next = new Set(prev)
        if (next.has(path)) next.delete(path)
        else next.add(path)
        return next
      })
    }

    const renderNode = (node: any, depth = 0) => {
      return (
        <div key={node.path || 'root'} className="w-full">
          {Object.values(node.dirs).map((dir: any) => (
            <div key={dir.path} className="w-full">
              <div 
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-[#30363d]/50 cursor-pointer text-gray-300 text-sm select-none"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => toggleFolder(dir.path)}
              >
                {expandedFolders.has(dir.path) ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <FolderClosed className="w-4 h-4 text-blue-400" />}
                <span className="truncate">{dir.name}</span>
              </div>
              {expandedFolders.has(dir.path) && renderNode(dir, depth + 1)}
            </div>
          ))}
          {node.files.map((file: EditorFile) => (
            <div
              key={file.id}
              className={`flex items-center justify-between py-1.5 px-2 group cursor-pointer text-sm ${
                activeFileId === file.id ? "bg-[#30363d]/70 text-white" : "text-gray-400 hover:bg-[#30363d]/30 hover:text-gray-200"
              }`}
              style={{ paddingLeft: `${depth * 12 + 16}px` }}
              onClick={() => setActiveFileId(file.id)}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {getFileIcon(file.name)}
                <span className="truncate leading-none">{file.name.split('/').pop()}</span>
                {!file.saved && <span className="text-yellow-400 text-[10px]">●</span>}
                {submitted.has(file.id) && <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />}
              </div>
              {files.length > 1 && (
                <button
                  className="h-4 w-4 shrink-0 p-0 mr-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 focus:opacity-100 flex items-center justify-center rounded"
                  onClick={(e) => { e.stopPropagation(); deleteFile(file.id) }}
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )
    }

    return renderNode(root)
  }

  // Compiler logic for Go Live
  const getPreviewHtml = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html') && f.name.includes('index')) || files.find(f => f.name.endsWith('.html'))
    let finalCode = htmlFile ? htmlFile.content : "<!DOCTYPE html><html><body style='background:#fff;color:#ef4444;font-family:sans-serif;padding:2rem;'><h1>No HTML file found!</h1><p>Create an index.html file to see the live preview.</p></body></html>"

    const cssFiles = files.filter(f => f.name.endsWith('.css'))
    const cssContent = cssFiles.map(f => `<style>${f.content}</style>`).join('\n')

    const jsFiles = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.jsx'))
    
    // Inject console overrides to pass messages to parent terminal
    const injectedConsole = `
    <script>
      const originalLog = console.log;
      console.log = function(...args) {
        window.parent.postMessage({ type: 'IDE_LOG', data: args.join(' ') }, '*');
        originalLog.apply(console, args);
      };
      const originalError = console.error;
      console.error = function(...args) {
        window.parent.postMessage({ type: 'IDE_ERROR', data: args.join(' ') }, '*');
        originalError.apply(console, args);
      };
      window.onerror = function(msg, url, line) {
        window.parent.postMessage({ type: 'IDE_ERROR', data: msg + ' at line ' + line }, '*');
      };
    </script>
    `

    const jsContent = jsFiles.map(f => `<script>${f.content}</script>`).join('\n')

    if (finalCode.includes('</head>')) {
      finalCode = finalCode.replace('</head>', `${cssContent}\n</head>`)
    } else {
      finalCode = `${cssContent}\n${finalCode}`
    }

    if (finalCode.includes('</body>')) {
      finalCode = finalCode.replace('</body>', `${injectedConsole}\n${jsContent}\n</body>`)
    } else {
      finalCode = `${finalCode}\n${injectedConsole}\n${jsContent}`
    }

    return finalCode
  }

  return (
    <div className="h-screen w-full bg-[#0d1117] text-gray-300 flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <div className="h-14 border-b border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-white hover:bg-[#30363d]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit IDE
            </Button>
          </Link>
          <div className="flex items-center space-x-2 border-l border-[#30363d] pl-4">
            <div className="w-7 h-7 bg-blue-600/20 border border-blue-500/50 rounded flex items-center justify-center">
              <Code className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-semibold text-white tracking-wide text-sm">ProjExpert Antigravity IDE</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-gray-400 hover:text-white hover:bg-[#30363d]"
            onClick={saveFile}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Code
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className={`h-8 border-[#30363d] ${showRightPanel && rightPanelTab === 'preview' ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 hover:bg-amber-500/20 hover:text-amber-300' : 'bg-transparent text-gray-300 hover:text-white hover:bg-[#30363d]'}`}
            onClick={() => {
              setShowRightPanel(true)
              setRightPanelTab("preview")
              setPreviewKey(k => k + 1)
              setLogs(prev => [...prev, { id: Date.now().toString(), text: `[Preview] Reloading output environment...`, type: 'info' }])
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            {showRightPanel && rightPanelTab === 'preview' ? "Reload Preview" : "Go Live"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className={`h-8 border-[#30363d] ${showRightPanel && rightPanelTab === 'chat' ? 'bg-purple-500/10 text-purple-400 border-purple-500/50 hover:bg-purple-500/20 hover:text-purple-300' : 'bg-transparent text-gray-300 hover:text-white hover:bg-[#30363d]'}`}
            onClick={() => {
              setShowRightPanel(true)
              setRightPanelTab("chat")
            }}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          
          <Button
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-none"
            onClick={() => submitFile(activeFileId)}
            disabled={submitting === activeFileId}
          >
            {submitting === activeFileId ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : submitted.has(activeFileId) ? (
               <CheckCircle className="w-4 h-4 mr-2 text-white" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {submitted.has(activeFileId) ? "Submitted" : "Submit AI Review"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="ide-layout-horizontal-v2">
          
          {/* LEFT: File Explorer */}
          <Panel defaultSize={18} minSize={12} maxSize={30} className="bg-[#161b22] flex flex-col border-r border-[#30363d]">
            <div className="px-3 h-10 flex items-center justify-between shadow-sm z-10 shrink-0 border-b border-[#30363d]">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Explorer</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-[#30363d]" onClick={() => setShowNewFile(true)}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            {showNewFile && (
              <div className="px-3 py-2 bg-[#0d1117] border-b border-[#30363d]">
                <form onSubmit={(e) => { e.preventDefault(); addNewFile(); }}>
                  <input
                    autoFocus
                    className="w-full bg-[#0d1117] text-white text-[13px] px-2 py-1 rounded border border-blue-500 outline-none"
                    placeholder="e.g. src/utils.js"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    onBlur={() => { if(!newFilePath) setShowNewFile(false) }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { setShowNewFile(false); setNewFilePath("") }
                    }}
                  />
                </form>
              </div>
            )}
            
            <ScrollArea className="flex-1 w-full bg-[#161b22] py-2">
              {fileTree()}
            </ScrollArea>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-500/50 transition-colors cursor-col-resize z-50 focus:outline-none flex flex-col justify-center">
             <div className="w-[1px] h-4 bg-gray-500/50 rounded-full mx-auto" />
          </PanelResizeHandle>

          {/* MIDDLE: Editor + Terminal */}
          <Panel defaultSize={showRightPanel ? 52 : 82} minSize={30} className="flex flex-col bg-[#0d1117]">
            <PanelGroup direction="vertical" autoSaveId="ide-layout-vertical-v2">
              
              <Panel defaultSize={75} minSize={40} className="flex flex-col relative w-full h-full">
                {/* Editor Tabs */}
                <div className="flex bg-[#161b22] h-10 shrink-0 overflow-x-auto overflow-y-hidden border-b border-[#30363d]">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-2 px-4 border-r border-[#30363d] cursor-pointer min-w-fit flex-shrink-0 ${
                        activeFileId === file.id
                          ? "bg-[#0d1117] text-white border-t-[3px] border-t-blue-500 border-b border-b-[#0d1117]"
                          : "text-gray-400 hover:bg-[#30363d]/50 border-t-[3px] border-t-transparent border-b border-b-[#30363d]"
                      }`}
                      onClick={() => setActiveFileId(file.id)}
                    >
                      {getFileIcon(file.name)}
                      <span className="text-[13px]">{file.name.split('/').pop()}</span>
                      {!file.saved && <span className="text-yellow-400 text-[10px]">●</span>}
                    </div>
                  ))}
                </div>

                {/* Editor Surface */}
                <div className="flex-1 relative w-full">
                  <div className="absolute inset-0 pt-2">
                    <MonacoEditor
                      language={activeFile?.language || "javascript"}
                      value={activeFile?.content || ""}
                      onChange={handleEditorChange}
                      theme="vs-dark"
                      options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        minimap: { enabled: false },
                        wordWrap: "on",
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        padding: { top: 8 },
                        renderLineHighlight: "all",
                        bracketPairColorization: { enabled: true },
                      }}
                      loading={<div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-6 h-6" /></div>}
                    />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-[#30363d] hover:bg-blue-500/50 transition-colors cursor-row-resize z-50 focus:outline-none flex justify-center items-center">
                 <div className="h-[1px] w-4 bg-gray-500/50 rounded-full" />
              </PanelResizeHandle>

              {/* Terminal Panel */}
              <Panel defaultSize={25} minSize={15} className="bg-[#010409] flex flex-col relative z-10 w-full">
                <div className="h-9 px-4 flex items-center shrink-0 border-b border-[#30363d] bg-[#161b22]">
                  <TerminalSquare className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Terminal</span>
                  <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px] uppercase text-gray-500 hover:text-white" onClick={() => setLogs([])}>
                    Clear
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-3 font-mono text-[13px] overflow-auto">
                  <div className="space-y-1.5 pb-4 break-all">
                    {logs.map(log => (
                      <div key={log.id} className={`flex gap-2 leading-relaxed ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' : 'text-gray-300'
                      }`}>
                        <span className="text-gray-600 select-none flex-shrink-0">❯</span>
                        <span className="whitespace-pre-wrap">{log.text}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <div className="text-gray-600 italic">No output...</div>}
                  </div>
                </ScrollArea>
              </Panel>

            </PanelGroup>
          </Panel>

          {/* RIGHT: Live Preview & Chat */}
          {showRightPanel && (
            <>
              <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-amber-500/50 transition-colors cursor-col-resize z-50 focus:outline-none flex flex-col justify-center">
                <div className="w-[1px] h-4 bg-gray-500/50 rounded-full mx-auto" />
              </PanelResizeHandle>
              <Panel defaultSize={30} minSize={20} className="bg-[#0d1117] flex flex-col border-l border-[#30363d] w-full">
                <div className="h-10 bg-[#161b22] border-b border-[#30363d] flex items-center px-2 justify-between shrink-0 overflow-x-auto overflow-y-hidden">
                  <div className="flex items-center h-full">
                    <button
                      className={`h-full px-4 flex items-center text-xs font-semibold uppercase tracking-wider border-b-[3px] transition-colors ${rightPanelTab === 'preview' ? 'border-amber-400 text-amber-400 bg-[#0d1117]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                      onClick={() => setRightPanelTab('preview')}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Preview
                    </button>
                    <button
                      className={`h-full px-4 flex items-center text-xs font-semibold uppercase tracking-wider border-b-[3px] transition-colors ${rightPanelTab === 'chat' ? 'border-purple-400 text-purple-400 bg-[#0d1117]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                      onClick={() => setRightPanelTab('chat')}
                    >
                      <Brain className="w-3.5 h-3.5 mr-1.5" /> AI Chat
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-gray-400 hover:text-white ml-2" onClick={() => setShowRightPanel(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 relative bg-[#0d1117] w-full h-full overflow-hidden">
                  {rightPanelTab === 'preview' ? (
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      title="Live Preview"
                      sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
                      srcDoc={getPreviewHtml()}
                      className="absolute inset-0 w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col w-full h-full">
                      <ScrollArea className="flex-1 p-4 w-full h-full">
                        <div className="space-y-4 pb-2">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-lg p-3 ${
                                  message.role === "user"
                                    ? "bg-purple-600 text-white"
                                    : "bg-[#161b22] text-gray-300 border border-[#30363d]"
                                }`}
                              >
                                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                <p className={`text-[10px] mt-1.5 opacity-60 text-right`}>
                                  {message.timestamp}
                                </p>
                              </div>
                            </div>
                          ))}
                          {isSending && (
                            <div className="flex justify-start">
                              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                <span className="text-[13px] text-gray-400">Alex is typing...</span>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      
                      <div className="p-3 border-t border-[#30363d] bg-[#161b22] shrink-0">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Ask Alex for help with your code..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-[#0d1117] border-[#30363d] text-[13px] text-white focus-visible:ring-1 focus-visible:ring-purple-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            disabled={isSending}
                          />
                          <Button 
                            onClick={handleSendMessage} 
                            disabled={isSending || !newMessage.trim()}
                            className="bg-purple-600 hover:bg-purple-700 text-white self-end shrink-0 w-10 h-10 p-0"
                          >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </>
          )}

        </PanelGroup>
      </div>
    </div>
  )
}
