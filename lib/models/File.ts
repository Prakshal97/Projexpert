import mongoose, { Schema, Document, Model } from "mongoose"

export interface IFile extends Document {
  userId: string
  name: string
  type: string
  size: number
  content: string // text content for AI review
  status: "analyzing" | "reviewed" | "pending"
  score?: number
  feedback?: {
    overall: string
    strengths: string[]
    improvements: string[]
    suggestions: string[]
  }
  createdAt: Date
}

const FileSchema = new Schema<IFile>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    content: { type: String, default: "" },
    status: { type: String, enum: ["analyzing", "reviewed", "pending"], default: "pending" },
    score: { type: Number },
    feedback: {
      overall: { type: String },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      suggestions: [{ type: String }],
    },
  },
  { timestamps: true }
)

const File: Model<IFile> = mongoose.models.File || mongoose.model<IFile>("File", FileSchema)
export default File
