import axios from "axios";

// Secret Key
const secretKey = process.env.PAYMONGO_SECRET_KEY || " ";
const encodedSecretKey = Buffer.from(secretKey).toString("base64");

// Public Key
const publickKey = process.env.PAYMONGO_PUBLIC_KEY || " ";
const encodedPublicKey = Buffer.from(publickKey).toString("base64");

const paymongo = axios.create({
  baseURL: "https://api.paymongo.com/v1",
  headers: {
    Authorization: `Basic ${encodedSecretKey}`,
  },
});

export { paymongo };