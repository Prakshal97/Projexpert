import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Project from "@/lib/models/Project"

/** GET /api/projects - list user projects */
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const projects = await Project.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ projects })
}

/** POST /api/projects - create a new project */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, description, technologies, type, dueDate } = body

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })

  await connectDB()
  const project = await Project.create({
    userId: session.user.id,
    title,
    description: description || "",
    technologies: technologies || [],
    type: type || "individual",
    dueDate: dueDate || "",
    status: "active",
    progress: 0,
    lastActivity: "Just now",
  })

  // Update user stats
  return NextResponse.json({ project }, { status: 201 })
}

/** PATCH /api/projects - update project */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, ...updates } = await req.json()

  await connectDB()
  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId: session.user.id },
    { $set: { ...updates, lastActivity: "Just now" } },
    { new: true }
  )

  return NextResponse.json({ project })
}
