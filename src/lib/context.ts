import { PrismaClient } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

export interface Context {
  user: string | null | JwtPayload;
  prisma: PrismaClient;
}
