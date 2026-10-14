import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (typeof email !== "string" || typeof password !== "string") return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim(), active: true });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "ઈમેઇલ અથવા પાસવર્ડ ખોટો છે / Invalid email or password" }, { status: 401 });
    await createSession({ userId: String(user._id), name: user.name, email: user.email, role: user.role, building: user.building, flat: user.flat });
    return NextResponse.json({ user: { id: String(user._id), name: user.name, email: user.email, role: user.role, building: user.building, flat: user.flat } });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Login service unavailable" }, { status: 500 }); }
}
