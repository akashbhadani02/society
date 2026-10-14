import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireApiSession } from "@/lib/auth";
import User from "@/models/User";
import Visitor from "@/models/Visitor";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await requireApiSession(req);
  if (!session) return NextResponse.json({ error:"Login required" }, {status:401});
  try {
    await connectDB();
    let filter: any = {};
    if (session.role === "resident") filter.residentId = session.userId;
    if (session.role === "watchman" && session.building) filter.building = session.building;
    const visitors = await Visitor.find(filter).sort({createdAt:-1}).limit(500).lean();
    const today = new Date(); today.setHours(0,0,0,0);
    const all = await Visitor.find(filter).lean();
    const todayVisitors = all.filter(v=>new Date(v.createdAt) >= today);
    const [residents,watchmen] = session.role === "admin" ? await Promise.all([User.countDocuments({role:"resident",active:true}),User.countDocuments({role:"watchman",active:true})]) : [0,0];
    const buildings = session.role === "admin" ? new Set(all.map(v=>v.building)).size : 0;
    return NextResponse.json({ visitors, stats: { total:todayVisitors.length, pending:all.filter(v=>v.status==="pending").length, approved:all.filter(v=>v.status==="approved").length, entered:all.filter(v=>v.status==="entered").length, residents, watchmen, buildings } });
  } catch(e) { console.error(e); return NextResponse.json({error:"Could not load visitors"},{status:500}); }
}

export async function POST(req: NextRequest) {
  const session = await requireApiSession(req);
  if (!session) return NextResponse.json({error:"Login required"},{status:401});
  if (!["admin","watchman"].includes(session.role)) return NextResponse.json({error:"Only watchmen or admins can register visitors"},{status:403});
  try {
    const body = await req.json();
    const visitorName = String(body.visitorName||"").trim();
    const phone = String(body.phone||"").trim();
    const purpose = String(body.purpose||"").trim();
    const building = String(body.building||"").trim();
    const flat = String(body.flat||"").trim();
    if (!visitorName || !phone || !purpose || !building || !flat) return NextResponse.json({error:"All visitor fields are required"},{status:400});
    if (visitorName.length>100 || phone.length>20 || purpose.length>300) return NextResponse.json({error:"Input too long"},{status:400});
    if (session.role==="watchman" && session.building && session.building!==building) return NextResponse.json({error:"You can only register visitors for your assigned building"},{status:403});
    await connectDB();
    const resident = await User.findOne({role:"resident",building,flat,active:true});
    if (!resident) return NextResponse.json({error:"No active resident account found for this building and flat"},{status:404});
    const visitor = await Visitor.create({visitorName,phone,purpose,building,flat,residentId:resident._id,createdBy:session.userId,status:"pending"});
    return NextResponse.json({visitor},{status:201});
  } catch(e) { console.error(e); return NextResponse.json({error:"Could not register visitor"},{status:500}); }
}
