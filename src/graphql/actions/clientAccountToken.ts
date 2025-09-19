import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

const createToken = (args: { id: string, role: string }): string => {
  try {
    const token = jwt.sign(args, JWT_SECRET, {
      expiresIn: "30d",
    });

    return token;

  } catch (err: any) {
    console.log(err.message);
    throw err
  }
};

const createTokenPhone = (args: { phone: string }): string => {
  try {
    const token = jwt.sign(args, JWT_SECRET, {
      expiresIn: "30d"
    });

    return token;

  } catch (err: any) {
    console.log(err.message);
    throw err
  }
};

export { createToken, createTokenPhone };