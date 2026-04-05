import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { getGeminiModel } from "@/lib/gemini"
import Message from "@/lib/models/Message"
import User from "@/lib/models/User"

/** POST /api/ai/chat  { message: string } */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 })

    await connectDB()

    const user = await User.findById(session.user.id).select("firstName selectedTrack")
    const firstName = user?.firstName || "Intern"

    // Fetch recent conversation history (last 20 messages)
    const history = await Message.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
    history.reverse()

    // Build Gemini chat history
    // gemini-pro does NOT support systemInstruction param — embed as first fake exchange
    const systemContext = `You are Alex, an enthusiastic and knowledgeable AI internship manager at ProjExpert. You are guiding ${firstName} through a Full Stack Web Development internship. Your responsibilities: assign tasks, explain concepts clearly, review code, provide career advice, and motivate them. Be concise (under 180 words), friendly, and practical. When asked about tasks, refer to the ones assigned. Help them solve coding problems step-by-step.`

    const geminiHistory: { role: string; parts: { text: string }[] }[] = [
      {
        role: "user",
        parts: [{ text: systemContext }],
      },
      {
        role: "model",
        parts: [
          {
            text: `Understood! I'm Alex, your AI Internship Manager at ProjExpert. I'm here to guide ${firstName} through the Full Stack Web Development program — assigning tasks, explaining concepts, reviewing code, and helping with career growth. Let's build something amazing together! 🚀`,
          },
        ],
      },
    ]

    // Add real conversation history
    history.forEach((m) => {
      geminiHistory.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    })

    const model = getGeminiModel()
    const chat = model.startChat({ history: geminiHistory })
    const result = await chat.sendMessage(message)
    const reply = result.response.text()

    // Persist both messages
    await Message.insertMany([
      { userId: session.user.id, role: "user", content: message },
      { userId: session.user.id, role: "assistant", content: reply },
    ])

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error("[AI CHAT]", err.message || err)
    return NextResponse.json({ error: "Failed to get AI response: " + (err.message || "Unknown error") }, { status: 500 })
  }
}

/** GET /api/ai/chat - fetch conversation history */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const messages = await Message.find({ userId: session.user.id })
    .sort({ createdAt: 1 })
    .limit(50)
    .lean()

  return NextResponse.json({ messages })
}
