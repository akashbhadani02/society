import mongoose, { Schema, models, model } from "mongoose";

const VisitorSchema = new Schema({
  visitorName: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  purpose: { type: String, required: true, trim: true, maxlength: 300 },
  building: { type: String, required: true, trim: true },
  flat: { type: String, required: true, trim: true },
  residentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "entered", "exited"], default: "pending" },
  decisionBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  decisionAt: { type: Date, default: null },
  entryAt: { type: Date, default: null },
  exitAt: { type: Date, default: null }
}, { timestamps: true });

VisitorSchema.index({ building: 1, flat: 1, createdAt: -1 });
VisitorSchema.index({ residentId: 1, status: 1, createdAt: -1 });

export default models.Visitor || model("Visitor", VisitorSchema);
