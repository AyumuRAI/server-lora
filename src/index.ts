import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import jwt from "jsonwebtoken";

// Prisma, Apollo, GraphQL
import { ApolloServer } from "@apollo/server";
import { typeDefs, resolvers } from "./graphql/modules";
import { expressMiddleware } from "@as-integrations/express5"; // Using Apollo with Express

// Libraries
import { Context } from "./lib/context";
import { configurePassport } from "./lib/passport";

// Routes
import OAuthRoute from "./routes/oauth";

// Middlewares
import { contextMiddleware } from "@lib/middleware"

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
});

const startServer = async () => {
  await server.start();

  // Apply global middleware
  app.use(contextMiddleware);
  
  // Passport oAuth
  configurePassport();
  app.use(passport.initialize());
  app.use("/auth", OAuthRoute);

  app.use(express.json());
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
    })
  );

  app.use("/graphql", expressMiddleware(server, {
    context: async ({ req }: { req: any }): Promise<Context> => {
      const { user, prisma, prismaReplica } = req.context;

      return { 
        user,
        prisma,
        prismaReplica
      }
    }
  }));

  // Create token for testing ONLY | delete THIS in production
  // This is for queries like graphql playground Authorization header
  app.post("/createToken", (req, res) => {
    const temp = {
      sample: "sample",
    };

    try {
      const token = jwt.sign(temp, process.env.JWT_SECRET!);
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
