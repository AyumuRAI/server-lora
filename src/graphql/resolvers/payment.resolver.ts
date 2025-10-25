import { Context } from "@lib/context";
import { User, Card, BillingInfo } from "@lib/types";
import { paymongo } from "@lib/paymongoClient";
import { GraphQLJSON } from "graphql-type-json";

export const resolvers = {
  // Apply custom scalar
  JSON: GraphQLJSON,

  Query: {
    _any: async (_any: any, args: {}, context: Context) => {
      return "";
    }
  },
  Mutation: {
    createPayment: async (_any: any, args: { method: string, amount: number, card?: Card | null, billing?: BillingInfo | null, loanId: number }, context: Context) => {
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
          const EWALLET = ["gcash", "paymaya"];
          const BANK = ["bpi", "bdo", "metrobank", "landbank", "unionbank"];
          const CARD = ["visa", "mastercard"];
          // const DOB = ["bpi", "unionbank"];
          const DOB = ["test_bank_one", "test_bank_two"]; // FOR TESTING; ONE = BPI, TWO = UNIONBANK
          const BRANKAS = ["bdo", "metrobank", "landbank"];
          
          const selectedMethod = args.method.toLowerCase();
          const paymentAmount = args.amount * 100; // Convert to centavos for paymongo

          // Check if PAYMONGO is in sandbox mode
          const isSandbox = process.env.PAYMONGO_MODE! === "sandbox" ? true : false;

          let paymentIntentData: any;
          let paymentMethodData;
          let nextActionUrls = null;
          let status = "Pending";

          // EWallet
          if (EWALLET.includes(selectedMethod)) {
            paymentIntentData = {
              data: {
                attributes: {
                  amount: paymentAmount,
                  currency: "PHP",
                  payment_method_allowed: ["gcash", "paymaya"]
                }
              }
            };

            paymentMethodData = {
              data: {
                attributes: {
                  type: selectedMethod
                }
              }
            };
          };

          // Card
          if (CARD.includes(selectedMethod)) {
            if (!args.card) {
              return {
                success: false,
                message: "Card is required"
              };
            };

            // Current yeat
            const currentYear = parseInt(new Date().getFullYear().toString().slice(2));

            if (args.card.exp_month < 1 || args.card.exp_month > 12 || args.card.exp_year < currentYear) {
              return {
                success: false,
                message: "Invalid expiration date"
              };
            };

            paymentIntentData = {
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
            };

            paymentMethodData = {
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
            };

            if (isSandbox) {
              // Defaults to VISA in sandbox, any card number in testing mode will NOT work
              paymentMethodData.data.attributes.details.card_number = "4343434343434345";
            };
          };

          // Banks
          if (BANK.includes(selectedMethod)) {
            paymentIntentData = {
              data: {
                attributes: {
                  amount: paymentAmount,
                  currency: "PHP",
                  payment_method_allowed: ["dob"]
                }
              }
            };

            paymentMethodData = {
              data: {
                attributes: {
                  type: "dob",
                  details: {
                    bank_code: selectedMethod
                  }
                }
              }
            };

            if(BRANKAS.includes(selectedMethod) && isSandbox) {
              /*
                This will defaults to BPI in sandbox mode for non BPI and UNIONBANK
                Reason: only test_bank_one and test_bank_two are available
                for paymongo api sandbox, if you use the real bank codes, it will throw an error
                due to not being allowed to use it on sandbox mode, unless you configure your
                paymongo api account to allow real bank codes.
              */
              paymentMethodData.data.attributes.details.bank_code = "test_bank_one";
            };

            if (BRANKAS.includes(selectedMethod) && !isSandbox) {
              paymentIntentData.data.attributes.payment_method_allowed = ["brankas"];
              paymentMethodData.data.attributes.type = "brankas";
            };

            if (["bpi", "unionbank"].includes(selectedMethod)) {
              paymentMethodData.data.attributes.details.bank_code = `${selectedMethod === "bpi" ? DOB[0] : DOB[1]}`;
            };
          };

          // Add custom metadata
          paymentIntentData.data.attributes.metadata = {
            userId: user.id,
            loanId: args.loanId.toString()
          };

          // Main Operation
          const paymentIntent = await paymongo.post("/payment_intents", paymentIntentData);
          const intentId = paymentIntent.data.data.id;

          const paymentMethod = await paymongo.post("/payment_methods", paymentMethodData);
          const paymentMethodId = paymentMethod.data.data.id;

          const paymentIntentAttach = await paymongo.post(`/payment_intents/${intentId}/attach`, {
            data: {
              attributes: {
                payment_method: paymentMethodId,
                return_url: "https://google.com" // Example only
              }
            }
          });

          // For EWallet and Banks only
          if (BANK.includes(selectedMethod) || EWALLET.includes(selectedMethod)) {
            nextActionUrls = paymentIntentAttach.data.data.attributes.next_action;
          } else {
            // For Cards
            status = paymentIntentAttach.data.data.attributes.status;
          };

          return {
            success: true,
            message: "Payment created successfully",
            nextActionUrls,
            status
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