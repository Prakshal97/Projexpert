"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users, Code, GitBranch, MessageSquare, Calendar, Star, ArrowLeft,
  Plus, Eye, Share, Award, TrendingUp, Target, Briefcase, Loader2, X,
} from "lucide-react"
import Link from "next/link"

interface Project {
  _id: string
  title: string
  description: string
  status: "active" | "completed" | "review"
  progress: number
  dueDate: string
  technologies: string[]
  type: "individual" | "team"
  lastActivity: string
}

interface Achievement {
  title: string
  date: string
  type: string
}

interface SkillProgress {
  skill: string
  progress: number
}

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([])
  const [stats, setStats] = useState({ projectsCompleted: 0, tasksCompleted: 0, averageScore: 0 })
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState("projects")
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectForm, setNewProjectForm] = useState({ title: "", description: "", technologies: "", dueDate: "", type: "individual" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [projRes, achRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/achievements"),
      ])

      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(data.projects || [])
        if (data.projects?.length > 0) setSelectedProject(data.projects[0])
      }

      if (achRes.ok) {
        const data = await achRes.json()
        setAchievements(data.achievements || [])
        setSkillProgress(data.skillProgress || [])
        setStats(data.stats || stats)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectForm.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProjectForm,
          technologies: newProjectForm.technologies.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setProjects((prev) => [data.project, ...prev])
        setShowNewProject(false)
        setNewProjectForm({ title: "", description: "", technologies: "", dueDate: "", type: "individual" })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleProgressUpdate = async (projectId: string, progress: number) => {
    const newStatus = progress === 100 ? "completed" : progress > 0 ? "active" : "active"
    try {
      await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, progress, status: newStatus }),
      })
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, progress, status: newStatus, lastActivity: "Just now" } : p))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "completed": return "bg-blue-500"
      case "review": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading workspace...
        </div>
      </div>
    )
  }

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
                <Briefcase className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">Workspace</span>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowNewProject(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Project</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewProject(false)}><X className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="proj-title">Project Title *</Label>
                <Input id="proj-title" placeholder="e.g. E-commerce Platform" value={newProjectForm.title} onChange={(e) => setNewProjectForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="proj-desc">Description</Label>
                <Input id="proj-desc" placeholder="What are you building?" value={newProjectForm.description} onChange={(e) => setNewProjectForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="proj-tech">Technologies (comma-separated)</Label>
                <Input id="proj-tech" placeholder="React, Node.js, MongoDB" value={newProjectForm.technologies} onChange={(e) => setNewProjectForm((p) => ({ ...p, technologies: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="proj-due">Due Date</Label>
                <Input id="proj-due" type="date" value={newProjectForm.dueDate} onChange={(e) => setNewProjectForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreateProject} disabled={saving || !newProjectForm.title.trim()}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Project"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="projects">Active Projects</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects">
            {projects.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="mb-4">Start by creating your first project!</p>
                <Button onClick={() => setShowNewProject(true)}>
                  <Plus className="w-4 h-4 mr-2" />New Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project List */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Projects</CardTitle>
                      <CardDescription>{projects.length} project{projects.length !== 1 ? "s" : ""}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {projects.map((project) => (
                        <Card
                          key={project._id}
                          className={`cursor-pointer transition-all hover:shadow-md ${selectedProject?._id === project._id ? "ring-2 ring-primary" : ""}`}
                          onClick={() => setSelectedProject(project)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm">{project.title}</h4>
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${getStatusColor(project.status)}`}></div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} className="h-1" />
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {project.dueDate || "No deadline"}
                              </div>
                              <Badge variant="outline" className="text-xs">{project.type}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Project Detail */}
                <div className="lg:col-span-2">
                  {selectedProject && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{selectedProject.title}</CardTitle>
                            <CardDescription className="mt-2">{selectedProject.description}</CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(selectedProject.status)} text-white`}>
                            {selectedProject.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-3">Update Progress</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Completion</span>
                              <span className="font-medium">{selectedProject.progress}%</span>
                            </div>
                            <Progress value={selectedProject.progress} className="h-2" />
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {[0, 25, 50, 75, 100].map((pct) => (
                                <Button
                                  key={pct}
                                  size="sm"
                                  variant={selectedProject.progress === pct ? "default" : "outline"}
                                  onClick={() => handleProgressUpdate(selectedProject._id, pct)}
                                >
                                  {pct}%
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Due Date:</span>
                              <span>{selectedProject.dueDate || "Not set"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Activity:</span>
                              <span>{selectedProject.lastActivity}</span>
                            </div>
                          </div>
                        </div>

                        {selectedProject.technologies.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">Technologies</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedProject.technologies.map((tech) => (
                                <Badge key={tech} variant="secondary">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Link href="/ai-manager" className="flex-1">
                            <Button className="w-full">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Ask AI Manager
                            </Button>
                          </Link>
                          <Link href="/file-review" className="flex-1">
                            <Button variant="outline" className="w-full bg-transparent">
                              <Eye className="w-4 h-4 mr-2" />
                              Upload & Review
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">{stats.projectsCompleted}</div>
                  <div className="text-sm text-muted-foreground">Projects Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-accent" />
                  </div>
                  <div className="text-3xl font-bold text-accent mb-2">{stats.averageScore || 0}</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">{achievements.length}</div>
                  <div className="text-sm text-muted-foreground">Badges Earned</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earned Badges</CardTitle>
                  <CardDescription>Your accomplishments so far</CardDescription>
                </CardHeader>
                <CardContent>
                  {achievements.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Complete tasks and projects to earn your first badge!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {achievements.map((a, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Award className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{a.title}</div>
                            <div className="text-sm text-muted-foreground">{a.date}</div>
                          </div>
                          <Badge variant="outline">{a.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Progress</CardTitle>
                  <CardDescription>Tracked from your real activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {skillProgress.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{item.skill}</span>
                          <span className="font-medium">{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    ))}
                    {skillProgress.length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Complete tasks to track your skill growth!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
