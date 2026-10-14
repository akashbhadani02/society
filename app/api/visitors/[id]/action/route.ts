import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireApiSession } from "@/lib/auth";
import Visitor from "@/models/Visitor";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireApiSession(req);
  if (!session) return NextResponse.json({error:"Login required"},{status:401});
  if (!mongoose.isValidObjectId(ctx.params.id)) return NextResponse.json({error:"Invalid visitor id"},{status:400});
  try {
    const { action } = await req.json();
    await connectDB();
    const visitor = await Visitor.findById(ctx.params.id);
    if (!visitor) return NextResponse.json({error:"Visitor not found"},{status:404});
    if (session.role==="resident") {
      if (String(visitor.residentId)!==session.userId) return NextResponse.json({error:"You can only decide for visitors to your own flat"},{status:403});
      if (visitor.status!=="pending") return NextResponse.json({error:"Only pending requests can be approved or rejected"},{status:409});
      if (action==="approve") visitor.status="approved";
      else if (action==="reject") visitor.status="rejected";
      else return NextResponse.json({error:"Invalid resident action"},{status:400});
      visitor.decisionBy=new mongoose.Types.ObjectId(session.userId);
      visitor.decisionAt=new Date();
    } else if (session.role==="watchman" || session.role==="admin") {
      if (session.role==="watchman" && session.building && visitor.building!==session.building) return NextResponse.json({error:"Not assigned to this building"},{status:403});
      if (action==="enter") {
        if (visitor.status!=="approved") return NextResponse.json({error:"Entry denied: resident approval is required"},{status:403});
        visitor.status="entered"; visitor.entryAt=new Date();
      } else if (action==="exit") {
        if (visitor.status!=="entered") return NextResponse.json({error:"Only visitors marked inside can exit"},{status:409});
        visitor.status="exited"; visitor.exitAt=new Date();
      } else return NextResponse.json({error:"Invalid guard action"},{status:400});
    } else return NextResponse.json({error:"Forbidden"},{status:403});
    await visitor.save();
    return NextResponse.json({visitor});
  } catch(e) { console.error(e); return NextResponse.json({error:"Could not update visitor status"},{status:500}); }
}
