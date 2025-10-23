import { Context } from "@lib/context";
import { User } from "@lib/types";

export const resolvers = {
  Query: {
    _any: async (_any: any, args: {}, context: Context) => {
      return "";
    }
  },
  Mutation: {
    createPayment: async (_any: any, args: { method: string, amount: number }, context: Context) => {
        try {
          if (!context.user) {
            return {
              success: false,
              message: "Unauthorized"
            };
          };

          /*
            Payment options:
            - GCASH
            - PAYMAYA

            - BPI
            - BDO
            - METROBANK
            - LANDBANK
            - UNIONBANK
            
            - VISA
            - MASTERCARD
          */

          const user = context.user as User;
          const EWALLET = ["GCASH", "PAYMAYA"];
          const BANK = ["BPI", "BDO", "METROBANK", "LANDBANK", "UNIONBANK"];
          const CARD = ["VISA", "MASTERCARD"];
          
          const selectedMethod = args.method.toUpperCase();
          const paymentAmount = args.amount;

          return {
            success: true,
            message: "Payment created successfully"
          };

        } catch(err: any) {
          return {
            success: false,
            message: JSON.stringify(err) // Temporary stringify error
          };
        };
    },
  }
};