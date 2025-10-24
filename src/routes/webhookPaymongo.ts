import { Router } from "express";
import { paymongo } from "@lib/paymongoClient";

const router = Router();

router.post("/webhook/paymongo", async (req, res) => {
  try {
    const event = req.body; // full payload from PayMongo

    console.log("Webhook event received:", event);

    // Example: handle successful payment
    if (event.data && event.data.attributes.type === "source.chargeable") {
      const sourceId = event.data.id;
      console.log("Source is chargeable:", sourceId);
      // You can mark as "ready to charge" or similar

      /* 
        TO DO: This is not working code at the moment but the 
        logic must be once the source is chargeable
        then proceed to charge the source
      */
      // const payment = await paymongo.post("/payments", {
      //   data: {
      //     attributes: {
      //       amount: event.data.attributes.amount,
      //       source: {
      //         id: sourceId,
      //         type: "source"
      //       },
      //       currency: "PHP"
      //     }
      //   }
      // });

      // console.log("Payment created:", payment.data.id);
    }

    if (event.data && event.data.attributes.type === "payment.paid") {
      const paymentId = event.data.id;
      const attributes = event.data.attributes;
      console.log("Payment successful:", paymentId, attributes);

      // Example: update database
      // await prisma.payment.update({
      //   where: { sourceId: attributes.source.id },
      //   data: { status: "PAID", transactionId: paymentId },
      // });
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Error handling webhook:", err);
    res.status(400).send("Error");
  }
});


export default router;