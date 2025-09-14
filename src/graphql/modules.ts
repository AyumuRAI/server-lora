import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesArray = loadFilesSync(path.join(__dirname, "./typeDefs"), {
  extensions: ["graphql"],
  requireMethod: async (path: string) => import(path),
});

const resolversArray = loadFilesSync(path.join(__dirname, "./resolvers"), {
  requireMethod: async (path: string) => import(path),
});

const typeDefs = mergeTypeDefs(typesArray);
const resolvers = mergeResolvers(resolversArray);

export { typeDefs, resolvers };
