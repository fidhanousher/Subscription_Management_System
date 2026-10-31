import { prisma } from "./prisma";

export async function nextNumber(prefix: "SUB" | "INV" | "QOT") {
  const row = await prisma.sequence.upsert({
    where: { name: prefix },
    create: { name: prefix, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${String(row.value).padStart(5, "0")}`;
}
