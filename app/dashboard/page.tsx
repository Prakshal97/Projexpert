"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Code, Clock, CheckCircle, Star, Upload, MessageSquare,
  Users, Target, Briefcase, LogOut, Loader2, ArrowRight,
  CheckCircle2, Lock, PlayCircle, Trophy
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { INTERNSHIP_TASKS } from "@/lib/data/tasks"

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [stats, setStats] = useState({ totalProgress: 0, projectsCompleted: 0, skillsEarned: 0, hoursInvested: 0 })
  const [loading, setLoading] = useState(true)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("completed_tasks")
      if (stored) {
        setCompletedTasks(JSON.parse(stored))
      }
    }
  }, [])

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const data = await res.json()
          setIsEnrolled(!!data.selectedTrack)
          setStats(data.stats || stats)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await fetch("/api/user/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: "web-dev" }),
      })
      setIsEnrolled(true)
      // Go straight to AI manager after enrollment
      setTimeout(() => router.push("/ai-manager"), 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setEnrolling(false)
    }
  }

  const firstName = session?.user?.firstName || session?.user?.name?.split(" ")[0] || "there"
  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("") || "?"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ProjExpert</span>
            </div>
            <div className="flex items-center space-x-3">
              {isEnrolled && (
                <Link href="/ai-manager">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    AI Manager
                  </Button>
                </Link>
              )}
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your profile...
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2">
                {isEnrolled ? `Welcome back, ${firstName}! 👋` : `Hello, ${firstName}! 👋`}
              </h1>
              <p className="text-muted-foreground text-lg">
                {isEnrolled
                  ? "You're enrolled in the Full Stack Web Development internship."
                  : "Ready to start your virtual internship? See below to get started."}
              </p>
            </>
          )}
        </div>

        {/* Stats (show only after enrolled) */}
        {isEnrolled && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Total Progress", value: `${stats.totalProgress}%`, icon: Target, color: "text-primary" },
              { label: "Tasks Completed", value: stats.projectsCompleted, icon: CheckCircle, color: "text-green-500" },
              { label: "Skills Earned", value: stats.skillsEarned, icon: Star, color: "text-yellow-500" },
              { label: "Hours Invested", value: `${stats.hoursInvested}h`, icon: Clock, color: "text-blue-500" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                    <s.icon className={`w-8 h-8 ${s.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Active Track Progress & Tasks */}
        {isEnrolled ? (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold mb-4">Your Engineering Tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {INTERNSHIP_TASKS.map((baseTask) => {
                const isCompleted = completedTasks.includes(baseTask.id)
                const task = {
                  ...baseTask,
                  status: isCompleted ? "completed" : baseTask.status,
                  progress: isCompleted ? 100 : baseTask.progress
                }
                
                return (
                <Card key={task.id} className={`flex flex-col ${task.status === "in-progress" ? "ring-2 ring-primary border-primary" : task.status === "locked" ? "opacity-60 bg-muted/30" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant={task.status === "completed" ? "default" : task.status === "in-progress" ? "secondary" : "outline"} className={task.status === "completed" ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                        {task.status === "locked" ? <Lock className="w-3 h-3 mr-1" /> : task.status === "completed" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <PlayCircle className="w-3 h-3 mr-1" />}
                        {task.status === "completed" ? "Done" : task.status === "in-progress" ? "In Progress" : task.status === "available" ? "Available" : "Locked"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{task.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5 shadow-none bg-border/50" />
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    {task.status !== "locked" ? (
                      <Link href={`/ide?taskId=${task.id}`}>
                        <Button className="w-full" variant={task.status === "completed" ? "outline" : "default"}>
                          {task.status === "completed" ? "Review Code" : "Open in IDE"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full" variant="secondary" disabled>Locked</Button>
                    )}
                  </div>
                </Card>
              )})}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Available Internship Track</h2>

            <Card className="max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Code className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Full Stack Web Development</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Build complete web applications from frontend to backend
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">What You'll Learn</h4>
                    {["HTML, CSS & JavaScript", "React & Next.js", "Node.js & Express", "MongoDB & Databases", "REST APIs & Authentication", "Deployment & DevOps"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Details</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Duration", value: "8 Weeks" },
                        { label: "Projects", value: "12 Real Projects" },
                        { label: "AI Mentor", value: "Alex (AI Manager)" },
                        { label: "IDE", value: "Built-in Code Editor" },
                        { label: "Certificate", value: "On Completion" },
                      ].map((d) => (
                        <div key={d.label} className="flex justify-between">
                          <span className="text-muted-foreground">{d.label}</span>
                          <span className="font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full text-base"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enrolling you...
                    </>
                  ) : (
                    <>
                      Enroll Now — Start Learning
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions (only when enrolled) */}
        {isEnrolled && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  AI Manager
                </CardTitle>
                <CardDescription>Chat with Alex, get task assignments, and ask for help</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ai-manager">
                  <Button className="w-full">
                    Open AI Manager
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2 text-blue-500" />
                  Online IDE
                </CardTitle>
                <CardDescription>Write, test, and submit code directly in your browser</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ide">
                  <Button variant="outline" className="w-full bg-transparent">
                    Open IDE Editor
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-green-500" />
                  File Review
                </CardTitle>
                <CardDescription>Upload your work for instant AI-powered code review</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/file-review">
                  <Button variant="outline" className="w-full bg-transparent">
                    Upload & Get Feedback
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>View your badges, skills, and hard-earned certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/achievements">
                  <Button variant="outline" className="w-full bg-transparent">
                    View Portfolio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
