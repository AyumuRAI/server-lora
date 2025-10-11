import { Context } from "@lib/context";
import { User, CashInMethodType } from "@lib/types";
import { format } from "date-fns";
import { GraphQLJSON } from "graphql-type-json"

export const resolvers = {
  // Apply custom scalar
  JSON: GraphQLJSON,

  Query: {
    getWalletBalance: async (_:any, args: {}, context: Context) => {
      try {
          if (!context.user) {
            return {
              success: false,
              message: "Unauthorized"
            };
          };

          const user = context.user as User;

          const account = await context.prismaReplica.account.findUnique({
            where: {
              id: user.id
            },
            include: {
              wallets: true
            }
          })

          return {
            success: true,
            message: "Wallet balance fetched successfully",
            balance: account?.wallets[0].balance 
          }

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        };
      }
    },
    getWalletTransactions: async (_:any, args: {}, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        };

        const user = context.user as User;

        const transactions = await context.prismaReplica.wallets.findUnique({
          where: {
            accountId: user.id
          },
          include: {
            transactions: true
          }
        });

        const formattedWalletTransactions = transactions?.transactions.map((transaction) => {
          return {
            id: transaction.id,
            type: transaction.type.replace("_", " "),
            amount: transaction.amount,
            source: transaction.method,
            date: format(transaction.createdAt, "MMMM, dd hh:mm a"),
            status: "Completed"
          }
        });

        return {
          success:true,
          message: "Wallet transactions fetched successfully",
          transactions: formattedWalletTransactions
        };

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        };
      };
    }
  },
  Mutation: {
    walletCashIn: async (_:any, args: { amount: number, method: CashInMethodType }, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        };

        const user = context.user as User;

        await context.prisma.$transaction([
          context.prisma.wallets.update({
            where: {
              accountId: user.id
            },
            data: {
              balance: {
                increment: args.amount
              },
              transactions: {
                create: [
                  {
                    type: "CASH_IN",
                    amount: args.amount,
                    method: args.method
                  }
                ]
              }
            }
          }),

          context.prisma.notifications.create({
            data: {
              accountId: user.id,
              title: "Cash In Successful",
              message: `Php ${args.amount.toLocaleString("en-PH",{ currency: "PHP", maximumFractionDigits: 2 })} has been added to your wallet via ${args.method}.`
            }
          })
        ]);
        
        return {
          success: true,
          message: "Wallet cashed in successfully"
        }

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        }
      }
    },
    walletPayment: async (_:any, args: { loanId: number }, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          }
        };

        const user = context.user as User;

        const account = await context.prismaReplica.account.findUnique({
          where: {
            id: user.id,
          },
          include: {
            wallets: true,
            loans: {
              where: {
                id: args.loanId
              }
            }
          }
        });

        if (!account) {
          return {
            success: false,
            message: "Account not found"
          };
        };

        const walletBalance = parseFloat(account.wallets[0].balance.toString());
        const monthlyPayment = parseFloat(account.loans[0].amount.toString()) / account.loans[0].terms;
        const loanRemainingBalance = parseFloat(account.loans[0].remainingBalance.toString()).toFixed(2)

        // Check if wallet balance is less than loan monthly amount
        if ( walletBalance < monthlyPayment) {
          return {
            success: false,
            message: "Wallet balance is less than current loan amount"
          };
        };

        await context.prisma.$transaction(async (tx) => {
          await tx.wallets.update({
            where: {
              accountId: user.id
            },
            data: {
              balance: {
                decrement: monthlyPayment
              }
            }
          });

          await tx.loans.update({
            where: {
              id: args.loanId
            },
            data: {
              remainingBalance: {
                decrement: monthlyPayment
              }
            }
          });

          // create loan transaction history
          await tx.loanTransactions.create({
            data: {
              loanId: args.loanId,
              type: "PAYMENT",
              amount: monthlyPayment,
              method: "LORA_WALLET", // This is temporary
              status: "COMPLETED"
            }
          });

          // Create a notification after payment
          await tx.notifications.create({
            data: {
              accountId: user.id,
              title: "Payment Received",
              message: `Your payment of Php ${monthlyPayment.toFixed(2)} has been processed`
            }
          });

          // If remaining balance is equals to monthly payment, close loan
          if (loanRemainingBalance === monthlyPayment.toFixed(2)) {
            await tx.loans.update({
              where: {
                id: args.loanId
              },
              data: {
                status: "COMPLETED"
              }
            })
          };
        });

        return {
          success: true,
          message: "Wallet payment successful"
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message
        };
      }
    }
  }
}