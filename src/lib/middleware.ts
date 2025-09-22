import { PrismaClient } from "@prisma/client";
import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Main Database for write
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
  }
}
});

// Replica Database for read-only
const prismaReplica = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_REPLICA,
  }
}
});

const contextMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization || "";
  let user = null;

  try {
    user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch (err) {
    user = null;
  }

  req.context = {
    user,
    prisma,
    prismaReplica,
  };

  next();
};

export { contextMiddleware };
