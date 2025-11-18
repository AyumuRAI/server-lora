import { Context } from "@lib/context";
import { User, CashInMethodType } from "@lib/types";
import { format } from "date-fns";
import { GraphQLJSON } from "graphql-type-json"
import { randomUUID } from "crypto";

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

        const counterpartyIds = Array.from(
          new Set(
            (transactions?.transactions || [])
              .map((transaction) => transaction.recipientAccountId)
              .filter((id): id is string => Boolean(id))
          )
        );

        let counterpartyMap: Record<string, { name: string; phone?: string | null }> = {};

        if (counterpartyIds.length > 0) {
          const counterparties = await context.prismaReplica.account.findMany({
            where: {
              id: {
                in: counterpartyIds
              }
            },
            select: {
              id: true,
              fname: true,
              lname: true,
              phone: true
            }
          });

          counterpartyMap = counterparties.reduce<Record<string, { name: string; phone?: string | null }>>((acc, account) => {
            acc[account.id] = {
              name: `${account.fname} ${account.lname}`.trim(),
              phone: account.phone
            };
            return acc;
          }, {});
        }

        const formattedWalletTransactions = transactions?.transactions.map((transaction) => {
          const counterparty = transaction.recipientAccountId ? counterpartyMap[transaction.recipientAccountId] : undefined;
          return {
            id: transaction.id,
            type: transaction.type.replace(/_/g, " "),
            amount: parseFloat(transaction.amount.toString()),
            source: transaction.method,
            date: format(transaction.createdAt, "MMMM, dd hh:mm a"),
            status: "Completed",
            note: transaction.note,
            referenceNumber: transaction.referenceNumber,
            counterparty: counterparty?.name,
            counterpartyPhone: counterparty?.phone
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
                    method: args.method,
                    referenceNumber: randomUUID()
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

        const prismaTransaction = await context.prisma.$transaction(async (tx) => {
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
          const transaction = await tx.loanTransactions.create({
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

          return transaction;
        });

        return {
          success: true,
          message: "Wallet payment successful",
          transactionId: prismaTransaction.id,
          referenceNumber: prismaTransaction.referenceNumber
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message
        };
      }
    },
    walletTransfer: async (_: any, args: { recipientPhone: string; amount: number; method?: string | null; note?: string | null }, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        }

        const { recipientPhone, amount, method, note } = args;

        if (!recipientPhone || amount === undefined) {
          return {
            success: false,
            message: "Recipient phone and amount are required"
          };
        }

        if (amount <= 0) {
          return {
            success: false,
            message: "Amount must be greater than zero"
          };
        }

        const user = context.user as User;
        const sanitizedPhone = recipientPhone.replace(/\s+/g, "");
        const normalizedPhilippinesPhone = sanitizedPhone.startsWith("+")
          ? sanitizedPhone
          : sanitizedPhone.startsWith("0")
            ? `+63${sanitizedPhone.substring(1)}`
            : `+63${sanitizedPhone}`;

        const senderAccount = await context.prismaReplica.account.findUnique({
          where: {
            id: user.id
          },
          include: {
            wallets: true
          }
        });

        if (!senderAccount || senderAccount.wallets.length === 0) {
          return {
            success: false,
            message: "Sender wallet not found"
          };
        }

        const recipientAccount = await context.prismaReplica.account.findFirst({
          where: {
            OR: [
              { phone: sanitizedPhone },
              { phone: normalizedPhilippinesPhone }
            ]
          },
          include: {
            wallets: true
          }
        });

        if (!recipientAccount || recipientAccount.wallets.length === 0) {
          return {
            success: false,
            message: "Recipient not found"
          };
        }

        if (recipientAccount.id === senderAccount.id) {
          return {
            success: false,
            message: "You cannot transfer to your own account"
          };
        }

        const senderWallet = senderAccount.wallets[0];
        const recipientWallet = recipientAccount.wallets[0];
        const senderBalance = parseFloat(senderWallet.balance.toString());

        if (senderBalance < amount) {
          return {
            success: false,
            message: "Insufficient wallet balance"
          };
        }

        const allowedMethods = ["GCASH", "PAYMAYA", "DEBIT_CARD", "CREDIT_CARD", "OVER_THE_COUNTER", "LORA_WALLET"];
        const resolvedMethod = method && allowedMethods.includes(method.toUpperCase())
          ? method.toUpperCase()
          : "LORA_WALLET";

        const referenceNumber = randomUUID();
        const pesoFormatter = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP"
        });

        const senderTransaction = await context.prisma.$transaction(async (tx) => {
          await tx.wallets.update({
            where: {
              id: senderWallet.id
            },
            data: {
              balance: {
                decrement: amount
              }
            }
          });

          await tx.wallets.update({
            where: {
              id: recipientWallet.id
            },
            data: {
              balance: {
                increment: amount
              }
            }
          });

          const debit = await tx.walletTransactions.create({
            data: {
              walletId: senderWallet.id,
              type: "TRANSFER_OUT",
              amount,
              method: resolvedMethod as CashInMethodType,
              note: note || null,
              recipientAccountId: recipientAccount.id,
              referenceNumber
            }
          });

          await tx.walletTransactions.create({
            data: {
              walletId: recipientWallet.id,
              type: "TRANSFER_IN",
              amount,
              method: resolvedMethod as CashInMethodType,
              note: note || null,
              recipientAccountId: senderAccount.id,
              referenceNumber
            }
          });

          await tx.notifications.createMany({
            data: [
              {
                accountId: senderAccount.id,
                title: "Transfer Sent",
                message: `You sent ${pesoFormatter.format(amount)} to ${recipientAccount.fname} ${recipientAccount.lname}`
              },
              {
                accountId: recipientAccount.id,
                title: "Transfer Received",
                message: `You received ${pesoFormatter.format(amount)} from ${senderAccount.fname} ${senderAccount.lname}`
              }
            ]
          });

          return debit;
        });

        return {
          success: true,
          message: "Transfer completed successfully",
          transactionId: senderTransaction.id,
          referenceNumber
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