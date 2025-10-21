import { PaymentRequest, PaymentMethod } from "xendit-node";

const secretKey = process.env.XENDIT_SECRET_KEY || " ";

const xenditPaymentRequestClient = new PaymentRequest({
  secretKey
});

const xenditPaymentMethodClient = new PaymentMethod({
  secretKey
});

export { xenditPaymentRequestClient, xenditPaymentMethodClient };