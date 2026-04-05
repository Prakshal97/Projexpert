import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import FileModel from "@/lib/models/File"

/** GET /api/achievements - computed achievements from user data */
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const userId = session.user.id

  const [user, completedProjects, completedTasks, reviewedFiles] = await Promise.all([
    User.findById(userId).select("stats firstName selectedTrack").lean(),
    Project.find({ userId, status: "completed" }).lean(),
    Task.find({ userId, status: "completed" }).lean(),
    FileModel.find({ userId, status: "reviewed" }).lean(),
  ])

  const skills = Array.from(new Set(completedTasks.flatMap((t: any) => t.skills || [])))
  const avgScore =
    reviewedFiles.length > 0
      ? Math.round(reviewedFiles.reduce((acc, f: any) => acc + (f.score || 0), 0) / reviewedFiles.length)
      : 0

  // Skill progress based on what files/tasks have been done
  const skillProgress = [
    { skill: "Problem Solving", progress: Math.min(completedTasks.length * 20, 100) },
    { skill: "Code Quality", progress: avgScore || 0 },
    { skill: "Project Delivery", progress: Math.min(completedProjects.length * 33, 100) },
    { skill: "Communication", progress: Math.min(completedTasks.length * 15, 100) },
  ]

  // Generate achievement badges
  const achievements = []
  if (completedTasks.length >= 1) achievements.push({ title: "First Task Complete", type: "Badge", date: new Date().toISOString().split("T")[0] })
  if (completedProjects.length >= 1) achievements.push({ title: "Project Builder", type: "Certificate", date: new Date().toISOString().split("T")[0] })
  if (reviewedFiles.length >= 1) achievements.push({ title: "Code Reviewer", type: "Badge", date: new Date().toISOString().split("T")[0] })
  if (avgScore >= 80) achievements.push({ title: "Quality Champion", type: "Certificate", date: new Date().toISOString().split("T")[0] })
  if (completedTasks.length >= 3) achievements.push({ title: "Dedicated Intern", type: "Certificate", date: new Date().toISOString().split("T")[0] })

  return NextResponse.json({
    stats: {
      projectsCompleted: completedProjects.length,
      tasksCompleted: completedTasks.length,
      filesReviewed: reviewedFiles.length,
      averageScore: avgScore,
      skillsEarned: skills.length,
    },
    skillProgress,
    achievements,
    completedProjects,
  })
}
