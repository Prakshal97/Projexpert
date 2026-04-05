import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import FileModel from "@/lib/models/File"

/** GET /api/files/list - list all user files */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const files = await FileModel.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .select("-content") // don't send content back
    .lean()

  return NextResponse.json({ files })
}

/** DELETE /api/files/list?id=xxx */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "File ID required" }, { status: 400 })

  await connectDB()
  await FileModel.findOneAndDelete({ _id: id, userId: session.user.id })

  return NextResponse.json({ message: "Deleted" })
}
