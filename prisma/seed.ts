import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const branches = [
  "Diploma in Electronics Engineering",
  "Diploma in Mechanical Engineering",
  "Diploma in Die and Mould Making",
  "Diploma in Mechatronics",
];

async function main() {
  for (const name of branches) {
    const branch = await prisma.branch.create({
      data: {
        name,
        capacity: 100, // Default capacity
        semesters: {
          create: Array.from({ length: 8 }, (_, i) => ({ level: i + 1 })),
        },
      },
      include: {
        semesters: true,
      },
    });

    console.log(`Branch ${branch.name} with 8 semesters seeded successfully`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });