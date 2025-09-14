import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Prisma, Apollo, GraphQL
import { ApolloServer } from "@apollo/server";
import { typeDefs, resolvers } from "./graphql/modules";
import { expressMiddleware } from "@as-integrations/express5"; // Using Apollo with Express
import { PrismaClient } from "@prisma/client";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const PORT = process.env.PORT || 5000;

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
});

const startServer = async () => {
  await server.start();

  app.use(
    cors({
      origin: "*",
    })
  );
  app.use(express.json());

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || "";

        try {
          jwt.verify(token, JWT_SECRET);

          return new PrismaClient();
        } catch (err) {
          throw err;
        }
      },
    })
  );

  // Create token for testing ONLY | delete THIS in production
  // This is for queries like graphql playground Authorization header
  app.post("/createToken", (req, res) => {
    const temp = {
      sample: "sample",
    };

    try {
      const token = jwt.sign(temp, JWT_SECRET);
      res.send(token);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}\nGraphQL running on http://localhost:${PORT}/graphql`
    );
  });
};

startServer();
