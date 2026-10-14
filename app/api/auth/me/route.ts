import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  return NextResponse.json({ user: { id:user.userId, name:user.name, email:user.email, role:user.role, building:user.building, flat:user.flat } });
}
