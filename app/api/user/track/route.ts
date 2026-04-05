import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

/** POST /api/user/track  { track: "web-dev" } */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { track } = await req.json()
  if (!track) return NextResponse.json({ error: "Track is required" }, { status: 400 })

  await connectDB()
  const user = await User.findByIdAndUpdate(
    session.user.id,
    { $set: { selectedTrack: track } },
    { new: true }
  ).select("-password")

  return NextResponse.json({ selectedTrack: user?.selectedTrack })
}
