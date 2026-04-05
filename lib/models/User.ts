import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  password: string
  firstName: string
  lastName: string
  selectedTrack: string | null
  stats: {
    projectsCompleted: number
    skillsEarned: number
    hoursInvested: number
    totalProgress: number
  }
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    selectedTrack: { type: String, default: null },
    stats: {
      projectsCompleted: { type: Number, default: 0 },
      skillsEarned: { type: Number, default: 0 },
      hoursInvested: { type: Number, default: 0 },
      totalProgress: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
export default User
