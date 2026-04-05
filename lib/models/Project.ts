import mongoose, { Schema, Document, Model } from "mongoose"

export interface IProject extends Document {
  userId: string
  title: string
  description: string
  status: "active" | "completed" | "review"
  progress: number
  dueDate: string
  technologies: string[]
  type: "individual" | "team"
  score?: number
  lastActivity: string
  createdAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["active", "completed", "review"], default: "active" },
    progress: { type: Number, default: 0 },
    dueDate: { type: String },
    technologies: [{ type: String }],
    type: { type: String, enum: ["individual", "team"], default: "individual" },
    score: { type: Number },
    lastActivity: { type: String, default: "Just now" },
  },
  { timestamps: true }
)

const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema)
export default Project
