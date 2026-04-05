import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { getGeminiModel } from "@/lib/gemini"
import FileModel from "@/lib/models/File"

/** POST /api/files/upload - upload file, trigger AI review */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    // Read file text content
    const content = await file.text()

    await connectDB()

    // Create file record with "analyzing" status
    const fileDoc = await FileModel.create({
      userId: session.user.id,
      name: file.name,
      type: file.type || "text/plain",
      size: file.size,
      content: content.slice(0, 50000), // cap at 50k chars
      status: "analyzing",
    })

    // Trigger AI review asynchronously (don't await - return immediately)
    reviewFileWithAI(fileDoc._id.toString(), file.name, content).catch(console.error)

    return NextResponse.json({ file: { ...fileDoc.toObject(), content: undefined } }, { status: 201 })
  } catch (err) {
    console.error("[FILE UPLOAD]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

async function reviewFileWithAI(fileId: string, fileName: string, content: string) {
  const model = getGeminiModel()
  const truncated = content.slice(0, 8000)

  const prompt = `You are a senior software engineer reviewing intern work. Analyze this file: "${fileName}"

FILE CONTENT:
\`\`\`
${truncated}
\`\`\`

Provide a code review. Return ONLY valid JSON with this structure:
{
  "score": <number 0-100>,
  "overall": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}
Be specific and constructive. If file is not code, review it as a document/design.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")

    const review = JSON.parse(jsonMatch[0])

    await FileModel.findByIdAndUpdate(fileId, {
      status: "reviewed",
      score: review.score,
      feedback: {
        overall: review.overall,
        strengths: review.strengths,
        improvements: review.improvements,
        suggestions: review.suggestions,
      },
    })
  } catch (err) {
    console.error("[AI REVIEW]", err)
    await FileModel.findByIdAndUpdate(fileId, { status: "pending" })
  }
}
