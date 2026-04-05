"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload, FileText, Code, ImageIcon, File, CheckCircle, AlertTriangle, Info,
  ArrowLeft, Trash2, Brain, Star, Clock, Zap, Loader2, RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface UploadedFile {
  _id: string
  name: string
  type: string
  size: number
  status: "analyzing" | "reviewed" | "pending"
  score?: number
  createdAt: string
  feedback?: {
    overall: string
    strengths: string[]
    improvements: string[]
    suggestions: string[]
  }
}

export default function FileReviewPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files/list")
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFiles()
    // Poll for analyzing files every 5 seconds
    const interval = setInterval(() => {
      setFiles((prev) => {
        if (prev.some((f) => f.status === "analyzing")) {
          loadFiles()
        }
        return prev
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [loadFiles])

  // Keep selectedFile in sync with files list
  useEffect(() => {
    if (selectedFile) {
      const updated = files.find((f) => f._id === selectedFile._id)
      if (updated) setSelectedFile(updated)
    }
  }, [files])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files)
  }, [])

  const handleFiles = async (fileList: FileList) => {
    const file = fileList[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    // Fake progress animation while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85))
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/files/upload", { method: "POST", body: formData })
      clearInterval(progressInterval)

      if (res.ok) {
        setUploadProgress(100)
        const data = await res.json()
        setFiles((prev) => [data.file, ...prev])
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
      } else {
        throw new Error("Upload failed")
      }
    } catch (err) {
      clearInterval(progressInterval)
      setIsUploading(false)
      setUploadProgress(0)
      console.error(err)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await fetch(`/api/files/list?id=${fileId}`, { method: "DELETE" })
      setFiles((prev) => prev.filter((f) => f._id !== fileId))
      if (selectedFile?._id === fileId) setSelectedFile(null)
    } catch (err) {
      console.error(err)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="w-5 h-5" />
    if (type.includes("javascript") || type.includes("typescript")) return <Code className="w-5 h-5" />
    if (type.includes("html") || type.includes("css")) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reviewed": return "text-green-500"
      case "analyzing": return "text-yellow-500"
      default: return "text-gray-500"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Upload className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">File Review</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-accent/10 text-accent">AI-Powered Analysis</Badge>
              <Button variant="ghost" size="sm" onClick={loadFiles}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload + File List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Work</CardTitle>
                <CardDescription>Upload code, HTML, CSS, JS, or any text file for instant AI-powered feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
                  <p className="text-muted-foreground mb-4">Supports HTML, CSS, JavaScript, Python, TypeScript, and more</p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    accept=".html,.css,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.sql,.md,.txt,.json"
                  />
                  <label htmlFor="file-upload">
                    <Button className="cursor-pointer" disabled={isUploading} asChild>
                      <span>{isUploading ? "Uploading..." : "Choose Files"}</span>
                    </Button>
                  </label>
                </div>

                {isUploading && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Uploading & sending to AI...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Files ({files.length})</CardTitle>
                <CardDescription>Click a file to see detailed AI feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading files...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No files yet. Upload your first file above!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div
                        key={file._id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedFile?._id === file._id ? "bg-primary/5 border-primary" : ""
                        }`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-muted-foreground">{getFileIcon(file.type)}</div>
                          <div>
                            <h4 className="font-medium">{file.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} · {formatDate(file.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {file.score != null && (
                            <div className={`font-bold ${getScoreColor(file.score)}`}>{file.score}/100</div>
                          )}
                          <Badge variant="outline" className={`${getStatusColor(file.status)} border-current`}>
                            {file.status === "analyzing" && <Clock className="w-3 h-3 mr-1 animate-pulse" />}
                            {file.status === "reviewed" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {file.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(file._id) }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Review Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-primary" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  {selectedFile ? `Feedback for ${selectedFile.name}` : "Select a file to see feedback"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Click a file from the list to view its AI-powered analysis
                  </div>
                ) : selectedFile.status === "analyzing" ? (
                  <div className="flex items-center justify-center py-8 gap-2 flex-col">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Gemini AI is reviewing your file...</span>
                    <span className="text-xs text-muted-foreground">This takes ~10-15 seconds</span>
                  </div>
                ) : selectedFile.feedback ? (
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="strengths">Strengths</TabsTrigger>
                      <TabsTrigger value="improve">Improve</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Overall Score</span>
                        <div className="flex items-center space-x-2">
                          <div className={`text-2xl font-bold ${getScoreColor(selectedFile.score!)}`}>
                            {selectedFile.score}
                          </div>
                          <div className="text-sm text-muted-foreground">/100</div>
                        </div>
                      </div>
                      <Progress value={selectedFile.score} className="h-2" />
                      <p className="text-sm text-muted-foreground">{selectedFile.feedback.overall}</p>
                    </TabsContent>

                    <TabsContent value="strengths" className="space-y-3">
                      {selectedFile.feedback.strengths.map((s, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{s}</p>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="improve" className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Areas for Improvement</h4>
                        {selectedFile.feedback.improvements.map((item, i) => (
                          <div key={i} className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Suggestions</h4>
                        {selectedFile.feedback.suggestions.map((s, i) => (
                          <div key={i} className="flex items-start space-x-2">
                            <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{s}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No feedback available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
