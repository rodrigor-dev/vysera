import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("rytech2026", 12);
  const user = await prisma.user.upsert({
    where: { email: "rodrigo@admin.com" },
    update: { role: "admin", passwordHash: hash },
    create: {
      email: "rodrigo@admin.com",
      name: "Rodrigo",
      passwordHash: hash,
      role: "admin",
    },
  });
  console.log("Admin user created:", user.email, "role:", user.role);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
