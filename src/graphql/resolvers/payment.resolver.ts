import { PaymentRequestParameters, PaymentRequest } from "xendit-node/payment_request/models";
import { xenditPaymentRequestClient, xenditPaymentMethodClient } from "@lib/xenditClient";
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

          // EWallet
          if (EWALLET.includes(selectedMethod)) {
            const data: PaymentRequestParameters = {
              "amount" : paymentAmount,
              "paymentMethod" : {
                "ewallet" : {
                  "channelProperties" : {
                    "successReturnUrl" : "https://google.com",
                    "failureReturnUrl" : "https://google.com"
                  },
                  "channelCode" : selectedMethod as "GCASH" | "PAYMAYA"
                },
                "reusability" : "ONE_TIME_USE",
                "type" : "EWALLET"
              },
              "currency" : "PHP",
              "referenceId" : "example-ref-1234"
            };

            const response: PaymentRequest = await xenditPaymentRequestClient.createPaymentRequest({
              data
            });

            console.log(response);
          };

          if (BANK.includes(selectedMethod)) {
            // Check if payment method id exists
            const paymentMethod = await context.prismaReplica.paymentMethods.findFirst({
              where: {
                accountId: user.id,
                channelCode: selectedMethod
              }
            });

            if (!paymentMethod) {
              return {
                success: false,
                message: "Payment method not found"
              };
            };

            const data: PaymentRequestParameters = {
              "amount" : 1500,
              "metadata" : {
                "sku" : "example-sku-1234"
              },
              "paymentMethodId" : "pm-9685a196-81e9-4c73-8d62-97df5aab2762",
              "currency" : "PHP",
              "referenceId" : "example-ref-1234"
            };

            const response: PaymentRequest = await xenditPaymentRequestClient.createPaymentRequest({
              data
            });

            console.log(response);
          };

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
    }
  }
};