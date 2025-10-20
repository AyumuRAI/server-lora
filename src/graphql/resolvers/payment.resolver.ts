import { PaymentRequestParameters, PaymentRequest } from "xendit-node/payment_request/models";
import { xenditPaymentRequestClient } from "@lib/xenditClient";
import { Context } from "@lib/context";

export const resolvers = {
  Query: {
    _any: async (_any: any, args: {}, context: Context) => {
      return "";
    }
  },
  Mutation: {
    createPayment: async (_any: any, args: { method: string, amount: number }, context: Context) => {
        try {
          
          const selectedMethod = args.method.toUpperCase();
          const paymentAmount = args.amount;

          // EWallet
          if (["GCASH", "PAYMAYA"].includes(selectedMethod)) {
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

          return {
            success: true,
            message: "Payment created successfully"
          };

        } catch(err: any) {
          return {
            success: false,
            message: JSON.stringify(err)
          };
        };
    }
  }
};