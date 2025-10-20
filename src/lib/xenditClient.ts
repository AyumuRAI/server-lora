import { PaymentRequest } from "xendit-node";
import dotenv from "dotenv";

dotenv.config();

const xenditPaymentRequestClient = new PaymentRequest({
  secretKey: process.env.XENDIT_SECRET_KEY || " ",
});

export { xenditPaymentRequestClient };