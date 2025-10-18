const Xendit = require("xendit-node") as any;

const x = new Xendit ({
  secretKey: process.env.XENDIT_SECRET_KEY
});

export const { EWallet, VirtualAcc, Card } = x;