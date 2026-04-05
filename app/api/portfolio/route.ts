import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import FileModel from "@/lib/models/File"

/** GET /api/portfolio - get user's reviewed files as portfolio items */
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()

  // Portfolio = files that have been reviewed (have a score)
  const files = await FileModel.find({
    userId: session.user.id,
    status: "reviewed",
    score: { $exists: true },
  })
    .sort({ createdAt: -1 })
    .select("-content")
    .lean()

  return NextResponse.json({ items: files })
}
