import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    _empty: () => "",
  },
  Mutation: {
    _empty: () => "",
  },
};
