const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI first.");
  const rl = readline.createInterface({ input, output });
  const name = await rl.question("Admin full name: ");
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  const password = await rl.question("Admin password (min 12 chars): ");
  rl.close();
  if (!name.trim() || !email.includes("@") || password.length < 12) throw new Error("Enter a name, valid email, and password with at least 12 characters.");
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.collection("users");
  const exists = await users.findOne({ email });
  if (exists) throw new Error("An account with that email already exists.");
  await users.insertOne({ name:name.trim(), email, passwordHash:await bcrypt.hash(password,12), role:"admin", building:"", flat:"", active:true, createdAt:new Date(), updatedAt:new Date() });
  console.log("Admin created. Sign in to SocietySetu and create watchman/resident accounts.");
  await mongoose.disconnect();
}
main().catch(e=>{ console.error(e.message); process.exit(1); });
