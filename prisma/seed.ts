import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9, 15, 0, 0);
  return date;
}

async function main() {
  await prisma.scheduledPayment.deleteMany();
  await prisma.payee.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.adminAction.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const userPassword = await hash("User@12345", 12);
  const balancePin = await hash("1234", 12);
  const adminPassword = await hash("Admin@12345", 12);

  await prisma.user.create({
    data: {
      fullName: "Nora Hale",
      email: "admin@hsbcuk.co.uk",
      phone: "+44 7700 900100",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const people: { name: string; email: string; phone: string; status: "ACTIVE" | "SUSPENDED" | "LOCKED" }[] = [
    { name: "Suresh", email: "user@hsbcuk.co.uk", phone: "+44 7700 900123", status: "ACTIVE" },
  ];

  for (const [index, person] of people.entries()) {
    const user = await prisma.user.create({
      data: {
        fullName: person.name,
        email: person.email,
        phone: person.phone,
        dateOfBirth: new Date("1990-05-15T00:00:00.000Z"),
        addressLine: "42 Maple Street",
        city: "Birmingham",
        postcode: "B15 2TT",
        occupation: "Software engineer",
        nationality: "British",
        maritalStatus: "Married",
        employerName: "Midland Tech Solutions Ltd",
        jobTitle: "Senior Analyst",
        workEmail: "suresh.k@midlandtech.example",
        workPhone: "+44 121 496 0123",
        workAddressLine: "5 Brindleyplace",
        workCity: "Birmingham",
        workPostcode: "B1 2HL",
        employmentStatus: "Employed full-time",
        passwordHash: userPassword,
        balancePinHash: balancePin,
        hideBalances: true,
        role: "USER",
        status: person.status,
        lastLoginAt: person.status === "ACTIVE" ? daysAgo(index) : null,
        createdAt: daysAgo(120 - index * 7),
      },
    });
    const accountNumber = index === 0 ? "10004821" : String(20000010 + index);
    await prisma.account.create({
      data: {
        userId: user.id,
        name: "Savings Account",
        accountNumber,
        sortCode: "001122",
        accountType: "SAVINGS",
        cardLast4: String(4100 + index),
        createdAt: daysAgo(120 - index * 7),
      },
    });

  }

  console.log("Seeded HSBC UK staff admin@hsbcuk.co.uk and customer Suresh at user@hsbcuk.co.uk.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
