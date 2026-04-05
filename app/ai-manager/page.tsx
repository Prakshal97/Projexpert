"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Brain, MessageSquare, CheckCircle, Clock, AlertCircle, Star, ArrowLeft,
  Send, Calendar, Target, Lightbulb, TrendingUp, Loader2, Code,
} from "lucide-react"
import Link from "next/link"

interface Task {
  _id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed"
  dueDate: string
  estimatedTime: string
  skills: string[]
  difficulty: number
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export default function AIManagerPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
            // First time - show welcome greeting
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: `Hello! I'm Alex, your AI Manager here at ProjExpert. I'm excited to guide your virtual internship journey. I've prepared some real-world tasks tailored to your track. Simply ask me anything — about your tasks, tech concepts, career advice, or code reviews. Ready to get started? 🚀`,
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

  // Load tasks
  useEffect(() => {
    async function loadTasks() {
      setTasksLoading(true)
      try {
        const res = await fetch("/api/ai/tasks")
        if (res.ok) {
          const data = await res.json()
          setTasks(data.tasks || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setTasksLoading(false)
      }
    }
    loadTasks()
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
        content: data.reply || "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I had trouble connecting. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleStatusUpdate = async (taskId: string, status: Task["status"]) => {
    if (status === "completed") {
      try {
        const fileRes = await fetch("/api/files/list")
        if (fileRes.ok) {
          const fileData = await fileRes.json()
          const hasPassingUpload = fileData.files?.some((f: any) => f.status === "reviewed" && f.score >= 70)
          
          if (!hasPassingUpload) {
            alert("To complete this task, you must first write code in the IDE, submit it, and receive an AI Review score of at least 70.")
            return
          }
        }
      } catch (err) {
        console.error("Validation error:", err)
      }
    }

    try {
      await fetch("/api/ai/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      })
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)))
      setSelectedTask((prev) => (prev?._id === taskId ? { ...prev, status } : prev))
    } catch (err) {
      console.error(err)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "in-progress": return <Clock className="w-4 h-4 text-yellow-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length

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
                <Brain className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">AI Manager</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Active Session
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>Alex — Your AI Manager</CardTitle>
                    <CardDescription>Powered by Gemini AI · Here to guide your learning</CardDescription>
                  </div>
                  <div className="ml-auto">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4 pb-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Alex is typing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="flex space-x-2 mt-4">
                  <Textarea
                    placeholder="Ask your AI manager anything..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={isSending}
                  />
                  <Button onClick={handleSendMessage} size="sm" className="self-end" disabled={isSending || !newMessage.trim()}>
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Panel */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tasks Completed</span>
                    <span className="font-medium">{completedCount}/{tasks.length}</span>
                  </div>
                  <Progress value={tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{tasks.length}</div>
                    <div className="text-xs text-muted-foreground">Tasks Assigned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">{completedCount}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Assigned Tasks
                </CardTitle>
                <CardDescription>AI-generated tasks for your track</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Generating your tasks...</span>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <Card
                          key={task._id}
                          className={`cursor-pointer transition-all hover:shadow-md ${selectedTask?._id === task._id ? "ring-2 ring-primary" : ""}`}
                          onClick={() => setSelectedTask(task)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm">{task.title}</h4>
                              {getStatusIcon(task.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                                <span className="text-xs capitalize">{task.priority}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < task.difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {task.dueDate}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {task.estimatedTime}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.skills?.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                              {(task.skills?.length || 0) > 2 && (
                                <Badge variant="secondary" className="text-xs">+{task.skills.length - 2}</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-accent" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => { setNewMessage("Can you give me a new task?"); }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request New Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => { setNewMessage("Can you review my progress and give me feedback?"); }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Get Progress Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => { setNewMessage("What career tips do you have for me?"); }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Career Advice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedTask.title}</CardTitle>
                  <CardDescription className="mt-2">{selectedTask.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>×</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Task Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant="outline" className={`${getPriorityColor(selectedTask.priority)} text-white`}>
                        {selectedTask.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="capitalize">{selectedTask.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{selectedTask.dueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span>{selectedTask.estimatedTime}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Skills You'll Learn</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.skills?.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                {selectedTask.status === "pending" && (
                  <Button className="flex-1" onClick={() => handleStatusUpdate(selectedTask._id, "in-progress")}>
                    Start Task
                  </Button>
                )}
                {selectedTask.status === "in-progress" && (
                  <div className="flex flex-col space-y-2 w-full flex-1">
                    <Link href="/ide" className="w-full">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Code className="w-4 h-4 mr-2" />
                        Go to IDE
                      </Button>
                    </Link>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(selectedTask._id, "completed")}>
                      Mark Complete ✓
                    </Button>
                  </div>
                )}
                {selectedTask.status === "completed" && (
                  <Button className="flex-1" variant="outline" disabled>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Completed
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedTask(null)
                    setNewMessage(`Can you help me with the task: "${selectedTask.title}"?`)
                  }}
                >
                  Ask AI for Help
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
