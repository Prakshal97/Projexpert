import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITask extends Document {
  userId: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed"
  dueDate: string
  estimatedTime: string
  skills: string[]
  difficulty: number
  track: string
  createdAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    dueDate: { type: String },
    estimatedTime: { type: String },
    skills: [{ type: String }],
    difficulty: { type: Number, default: 3 },
    track: { type: String, required: true },
  },
  { timestamps: true }
)

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema)
export default Task
