import mongoose, { Schema, models, model } from "mongoose";

export type UserRole = "admin" | "watchman" | "resident";

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "watchman", "resident"], required: true },
  building: { type: String, default: "" },
  flat: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default models.User || model("User", UserSchema);
