"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, Medal, Star, CheckCircle2, TrendingUp, Code2, 
  Layers, Zap, Clock, ArrowLeft, Download, ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { INTERNSHIP_TASKS } from "@/lib/data/tasks"

export default function AchievementsPage() {
  const { data: session } = useSession()
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [stats, setStats] = useState({ averageScore: 0, totalHours: 0 })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("completed_tasks")
      if (stored) {
        const tasks = JSON.parse(stored)
        setCompletedTasks(tasks)
        // Mock calculating average score & hours based on completed tasks
        setStats({
          averageScore: tasks.length > 0 ? 85 + Math.floor(Math.random() * 10) : 0,
          totalHours: tasks.length * 2.5
        })
      }
    }
  }, [])

  const badges = [
    { id: "b1", title: "First Commit", icon: <Code2 className="w-6 h-6 text-blue-500" />, unlocked: completedTasks.length >= 1 },
    { id: "b2", title: "CSS Wizard", icon: <Layers className="w-6 h-6 text-pink-500" />, unlocked: completedTasks.includes("task-1") },
    { id: "b3", title: "Logic Master", icon: <Zap className="w-6 h-6 text-yellow-500" />, unlocked: completedTasks.includes("task-2") },
    { id: "b4", title: "API Explorer", icon: <TrendingUp className="w-6 h-6 text-green-500" />, unlocked: completedTasks.includes("task-3") },
    { id: "b5", title: "Database Architect", icon: <ShieldCheck className="w-6 h-6 text-purple-500" />, unlocked: completedTasks.includes("task-4") },
    { id: "b6", title: "Overachiever", icon: <Star className="w-6 h-6 text-orange-500" />, unlocked: completedTasks.length >= 3 },
  ]

  const firstName = session?.user?.firstName || session?.user?.name?.split(" ")[0] || "Intern"

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
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-xl font-bold">Portfolio & Achievements</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Overview Stats */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-card to-card border-none shadow-md ring-1 ring-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Tasks Completed</p>
                    <p className="text-3xl font-bold mt-1">{completedTasks.length} <span className="text-sm font-normal text-muted-foreground">/ {INTERNSHIP_TASKS.length}</span></p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card border-none shadow-md ring-1 ring-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Avg AI Score</p>
                    <p className="text-3xl font-bold mt-1">{stats.averageScore ? `${stats.averageScore}%` : "—"}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card border-none shadow-md ring-1 ring-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Badges Earned</p>
                    <p className="text-3xl font-bold mt-1">{badges.filter(b => b.unlocked).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <Medal className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card border-none shadow-md ring-1 ring-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Hours Simulated</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalHours}h</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Badges Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Badges & Honors</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
                {badges.map((badge) => (
                  <div key={badge.id} className={`flex flex-col items-center justify-center text-center p-4 rounded-xl transition-all ${badge.unlocked ? "bg-accent/10 border border-accent/20" : "bg-muted/30 opacity-50 grayscale"}`}>
                    <div className="w-14 h-14 bg-background rounded-full shadow-sm flex items-center justify-center mb-3">
                      {badge.icon}
                    </div>
                    <span className="text-sm font-semibold tracking-wide">{badge.title}</span>
                    <span className="text-xs text-muted-foreground mt-1">{badge.unlocked ? "Unlocked" : "Locked"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completed Projects & Certificates */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Portfolio & Certificates</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verified Skills</CardTitle>
                <CardDescription>AI-verified technical capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-blue-400">Frontend Fundamentals</span>
                      {completedTasks.length > 0 ? "100%" : "0%"}
                    </div>
                    <Progress value={completedTasks.length > 0 ? 100 : 0} className="h-2 bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-yellow-400">JavaScript Logic</span>
                      {completedTasks.includes("task-2") ? "100%" : "0%"}
                    </div>
                    <Progress value={completedTasks.includes("task-2") ? 100 : 0} className="h-2 bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-green-400">Code Optimization</span>
                      {stats.averageScore ? `${stats.averageScore}%` : "0%"}
                    </div>
                    <Progress value={stats.averageScore} className="h-2 bg-muted/50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificates Generated</CardTitle>
                <CardDescription>Official credentials from ProjExpert</CardDescription>
              </CardHeader>
              <CardContent>
                {completedTasks.length > 0 ? (
                  <div className="space-y-4">
                    {INTERNSHIP_TASKS.filter(t => completedTasks.includes(t.id)).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center">
                            <Award className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-none mb-1">{task.title}</p>
                            <p className="text-xs text-muted-foreground">Score: {85 + Math.floor(Math.random() * 10)}/100</p>
                          </div>
                        </div>
                        <Link href={`/certificate?name=${firstName}&project=${encodeURIComponent(task.title)}&score=90`}>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Download className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border">
                    <Award className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Complete tasks in the IDE to earn certificates.</p>
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

function Award(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}
