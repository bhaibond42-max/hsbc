import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const emails = await prisma.$executeRawUnsafe(
    "UPDATE users SET email = replace(email, '@hsbc.demo', '@hsbcuk.co.uk')",
  );
  const refs = await prisma.$executeRawUnsafe(
    "UPDATE transactions SET reference = replace(reference, 'DEMO-', 'HBUK')",
  );
  const notes = await prisma.$executeRawUnsafe(
    "UPDATE notifications SET title = 'Welcome to HSBC UK', body = 'Your accounts are ready.' WHERE title ILIKE '%demo%'",
  );
  const audits = await prisma.$executeRawUnsafe(
    "UPDATE audit_logs SET actor_email = replace(actor_email, '@hsbc.demo', '@hsbcuk.co.uk')",
  );
  console.log({ emails, refs, notes, audits });
}

main().finally(async () => {
  await prisma.$disconnect();
});
