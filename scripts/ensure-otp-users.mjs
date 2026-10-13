import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const OTP_USERS = [
  {
    email: "raja@hsbcuk.co.uk",
    fullName: "Raja",
    phone: "+919176253212",
    password: "User@12345",
  },
];

try {
  const passwordHash = await hash("User@12345", 12);
  const balancePinHash = await hash("1234", 12);
  const loginPinHash = await hash("123456", 12);

  for (const spec of OTP_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: spec.email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { phone: spec.phone, fullName: spec.fullName, loginPinHash },
      });
      console.log(`Updated OTP user ${spec.email}`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        fullName: spec.fullName,
        email: spec.email,
        phone: spec.phone,
        passwordHash,
        balancePinHash,
        loginPinHash,
        hideBalances: true,
        role: "USER",
        status: "ACTIVE",
      },
    });
    await prisma.account.create({
      data: {
        userId: user.id,
        name: "Savings Account",
        accountNumber: "10004999",
        sortCode: "001122",
        accountType: "SAVINGS",
        cardLast4: "3212",
      },
    });
    console.log(`Created OTP user ${spec.email}`);
  }
} finally {
  await prisma.$disconnect();
}
