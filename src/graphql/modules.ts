import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";

const typesArray = loadFilesSync(path.join(__dirname, "./typeDefs"), {
  extensions: ["graphql"],
});

const resolversArray = loadFilesSync(path.join(__dirname, "./resolvers"));

const typeDefs = mergeTypeDefs(typesArray);
const resolvers = mergeResolvers(resolversArray);

export { typeDefs, resolvers };
