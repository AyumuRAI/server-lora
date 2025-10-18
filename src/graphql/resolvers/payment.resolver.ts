import { EWallet, VirtualAcc } from "@lib/xenditClient";
import { Context } from "@lib/context";

export const resolvers = {
  Query: {
    _any: async (_any: any, args: {}, context: Context) => {
      return "";
    }
  },
  Mutation: {
    _any: async (_any: any, args: {}, context: Context) => {
      return "";
    }
  }
};