import type * as Prisma from "@prisma/client";
type Word = {
  meanings: Prisma.Meaning[];
} & Prisma.Word;
