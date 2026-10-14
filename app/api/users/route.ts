import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { requireApiSession } from "@/lib/auth";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET(req:NextRequest) {
  const session=await requireApiSession(req);
  if(!session) return NextResponse.json({error:"Login required"},{status:401});
  if(session.role!=="admin") return NextResponse.json({error:"Admin only"},{status:403});
  try {
    await connectDB();
    const users=await User.find({active:true}).select("name email role building flat").sort({building:1,flat:1}).lean();
    return NextResponse.json({users:users.map(u=>({...u,id:String(u._id),_id:undefined}))});
  } catch(e) { console.error(e); return NextResponse.json({error:"Could not load users"},{status:500}); }
}

export async function POST(req:NextRequest) {
  const session=await requireApiSession(req);
  if(!session) return NextResponse.json({error:"Login required"},{status:401});
  if(session.role!=="admin") return NextResponse.json({error:"Only admins can create accounts"},{status:403});
  try {
    const b=await req.json();
    const name=String(b.name||"").trim(), email=String(b.email||"").trim().toLowerCase(), password=String(b.password||"");
    const role=String(b.role||"resident"), building=String(b.building||"").trim(), flat=String(b.flat||"").trim();
    if(!name||!email||password.length<10||!["admin","watchman","resident"].includes(role)) return NextResponse.json({error:"Name, valid email, allowed role and password of at least 10 characters are required"},{status:400});
    if(role==="resident"&&(!building||!flat)) return NextResponse.json({error:"Residents must have a building and flat number"},{status:400});
    await connectDB();
    const hash=await bcrypt.hash(password,12);
    const user=await User.create({name,email,passwordHash:hash,role,building,flat});
    return NextResponse.json({user:{id:String(user._id),name:user.name,email:user.email,role:user.role,building:user.building,flat:user.flat}},{status:201});
  } catch(e:any) {
    if(e?.code===11000) return NextResponse.json({error:"This email already has an account"},{status:409});
    console.error(e); return NextResponse.json({error:"Could not create user"},{status:500});
  }
}
