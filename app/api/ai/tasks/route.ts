import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { getGeminiModel } from "@/lib/gemini"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"

/** GET /api/ai/tasks - get tasks; auto-generate via Gemini if user has none */
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const user = await User.findById(session.user.id).select("firstName selectedTrack")
  const track = user?.selectedTrack || "web-dev"
  const firstName = user?.firstName || "Intern"

  let tasks = await Task.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean()

  if (tasks.length === 0) {
    const model = getGeminiModel()
    const today = new Date()
    const due1 = new Date(today); due1.setDate(today.getDate() + 7)
    const due2 = new Date(today); due2.setDate(today.getDate() + 14)
    const due3 = new Date(today); due3.setDate(today.getDate() + 21)
    const fmt = (d: Date) => d.toISOString().split("T")[0]

    const prompt = `Generate a JSON array of exactly 3 Full Stack Web Development internship tasks for ${firstName}.
Return ONLY valid JSON, no markdown, no explanation. Format:
[
  {"title":"Task 1 Title","description":"2-3 sentence practical description of what to build or do","priority":"high","dueDate":"${fmt(due1)}","estimatedTime":"4-6 hours","skills":["HTML","CSS","JavaScript"],"difficulty":2},
  {"title":"Task 2 Title","description":"2-3 sentence practical description","priority":"medium","dueDate":"${fmt(due2)}","estimatedTime":"6-8 hours","skills":["React","Node.js"],"difficulty":3},
  {"title":"Task 3 Title","description":"2-3 sentence practical description","priority":"medium","dueDate":"${fmt(due3)}","estimatedTime":"8-12 hours","skills":["MongoDB","Express","REST API"],"difficulty":4}
]
Make tasks progressively harder, practical, and specific to web development (HTML/CSS/JS/React/Node/MongoDB).`

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0])
        const toInsert = generated.map((t: any) => ({
          ...t,
          userId: session.user.id,
          track: "web-dev",
          status: "pending",
        }))
        const inserted = await Task.insertMany(toInsert)
        tasks = inserted.map((t) => t.toObject())
      }
    } catch (err: any) {
      console.error("[TASK GENERATION]", err.message || err)
      // Return empty tasks - user can still chat with Alex to get tasks
    }
  }

  return NextResponse.json({ tasks })
}

/** POST /api/ai/tasks - generate fresh tasks (re-generate) */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Delete existing tasks and regenerate
  await connectDB()
  await Task.deleteMany({ userId: session.user.id })

  // Now call GET logic by redirecting
  return GET()
}

/** PATCH /api/ai/tasks  { taskId, status } */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { taskId, status } = await req.json()
  await connectDB()

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId: session.user.id },
    { $set: { status } },
    { new: true }
  )

  if (status === "completed") {
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { "stats.projectsCompleted": 1, "stats.skillsEarned": 1, "stats.hoursInvested": 8 },
    })
  }

  return NextResponse.json({ task })
}
