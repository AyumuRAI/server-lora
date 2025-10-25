import { Router } from "express";
import { Prisma } from "@prisma/client";

const router = Router();

router.post("/webhook/paymongo", async (req: any, res) => {
  try {
    const event = req.body; // full payload from PayMongo

    // Example: handle successful payment
    if (event.data && event.data.attributes.type === "source.chargeable") {
        console.log("Source chargeable");
    };

    if (event.data && event.data.attributes.type === "payment.paid") {
        // const paymentId = event.data.id;
        const attributes = event.data.attributes;
        // console.log("Payment successful:", attributes);

        // Includes userId and loanId
        const metadata = attributes.data.attributes.metadata
        const context = req.context;
        const loanId = parseInt(metadata.loanId);

        // Get account of the user
        const account = await context.prismaReplica.account.findUnique({
          where: {
            id: metadata.userId
          },
          include: {
            loans: {
              where: {
                id: loanId
              }
            }
          }
        });

        const monthlyPayment = parseFloat(account.loans[0].amount.toString()) / account.loans[0].terms;
        const loanRemainingBalance = parseFloat(account.loans[0].remainingBalance.toString()).toFixed(2);
        
        // Add notification, loan transaction and update loan balance of the user
        await context.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.loans.update({
            where: {
              id: loanId
            },
            data: {
              remainingBalance: {
                decrement: monthlyPayment
              }
            }
          });

          // Create loan transaction history
          await tx.loanTransactions.create({
            data: {
              loanId: loanId,
              type: "PAYMENT",
              amount: monthlyPayment,
              method: "LORA_WALLET", // This is temporary
              status: "COMPLETED",
            }
          });

          // Create notification after payment
          await tx.notifications.create({
            data: {
              accountId: metadata.userId,
              title: "Payment Received",
              message: `Your payment of Php ${monthlyPayment.toFixed(2)} has been processed`,
            }
          });

          // If remaining balance is equals to monthly payment, close loan
          if (loanRemainingBalance === monthlyPayment.toFixed(2)) {
            await tx.loans.update({
              where: {
                id: loanId
              },
              data: {
                status: "COMPLETED"
              }
            })
          };
        });

        console.log("Payment successful");
    };

    res.status(200).send("Webhook received");
  } catch (err) {
    // console.error("Error handling webhook:", err);
    res.status(400).send("Error");
  }
});

export default router;