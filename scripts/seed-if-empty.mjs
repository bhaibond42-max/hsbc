import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();
try {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`Database already has ${count} user(s); skipping seed.`);
    process.exit(0);
  }
  console.log("Empty database; running prisma db seed…");
  execSync("npx prisma db seed", { stdio: "inherit" });
} finally {
  await prisma.$disconnect();
}
