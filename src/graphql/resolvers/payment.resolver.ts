import { Context } from "@lib/context";
import { User, Card } from "@lib/types";
import { paymongo } from "@lib/paymongoClient";

export const resolvers = {
  Query: {
    _any: async (_any: any, args: {}, context: Context) => {
      return "";
    }
  },
  Mutation: {
    createPayment: async (_any: any, args: { method: string, amount: number, card: Card }, context: Context) => {
        try {
          // if (!context.user) {
          //   return {
          //     success: false,
          //     message: "Unauthorized"
          //   };
          // };

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

          // const user = context.user as User;
          const EWALLET = ["gcash", "paymaya"];
          const BANK = ["bpi", "bdo", "metrobank", "landbank", "unionbank"];
          const CARD = ["visa", "mastercard"];
          
          const selectedMethod = args.method.toLowerCase();
          const paymentAmount = args.amount * 100; // Convert to centavos for paymongo

          // EWallet
          if (EWALLET.includes(selectedMethod)) {
            const source = await paymongo.post("/sources", {
              data: {
                attributes: {
                  type: selectedMethod,
                  amount: paymentAmount,
                  currency: "PHP",
                  redirect: {
                    // example redirect url only
                    success: "https://google.com", 
                    failed: "https://google.com"
                  }
                }
              }
            });

            const response = source.data.data;
            const checkoutUrl = response.attributes.checkout_url;
            const type = "EWALLET";
            const STATUS= "PENDING";

            console.log(response);
          };

          // Card
          if (CARD.includes(selectedMethod)) {
            if (!args.card) {
              return {
                success: false,
                message: "Card is required"
              };
            };

            const paymentIntent = await paymongo.post("/payment_intents", {
              data: {
                attributes: {
                  amount: paymentAmount,
                  currency: "PHP",
                  payment_method_allowed: ["card"],
                  payment_method_options: {
                    card: {
                      request_three_d_secure: "automatic"
                    }
                  }
                }
              }
            });

            const response = paymentIntent.data.data;
            const clientKey = response.attributes.client_key;
            const intentId = response.id;
            const type = "CARD";
            const status = "REQUIRES_PAYMENT_METHOD";

            // Next Step
            // Create a payment method
            const paymentMethod = await paymongo.post("/payment_methods", {
              data: {
                attributes: {
                  details: {
                    /*
                      Format for card:
                      card_number: "4343434343434345", string
                      exp_month: 12, number
                      exp_year: 25, number
                      cvc: "123" string
                    */

                    card_number: args.card.card_number,
                    exp_month: args.card.exp_month,
                    exp_year: args.card.exp_year,
                    cvc: args.card.cvc
                  },
                  type: "card"
                }
              }
            });

            const responsePaymentMethod = paymentMethod.data.data;
            const paymentMethodId = responsePaymentMethod.id;


            // Next Step To Charge User
            const paymentIntentAttach = await paymongo.post(`/payment_intents/${intentId}/attach`, {
              data: {
                attributes: {
                  payment_method: paymentMethodId,
                  return_url: "https:/google.com" // Example redirect url
                }
              }
            });

            const responsePaymentIntentAttach = paymentIntentAttach.data.data;
            const statusAttach = responsePaymentIntentAttach.attributes.status;

            console.log(response);
            console.log(responsePaymentMethod);
            console.log(responsePaymentIntentAttach);
          };

          // Banks
          if (BANK.includes(selectedMethod)) {
            const source = await paymongo.post("/sources", {
              data: {
                attributes: {
                  type: "grab_pay",
                  amount: paymentAmount,
                  currency: "PHP",
                  redirect: {
                    // example redirect url only
                    success: "https://google.com",
                    failed: "https://google.com"
                  }
                }
              }
            });

            const response = source.data.data;
            const checkoutUrl = response.attributes.checkout_url;
            const type = "BANK";
            const STATUS= "PENDING";

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
    },
  }
};