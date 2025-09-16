import { Context } from "@lib/context";
import { CreateAccountData } from "@lib/types";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

// TWILIO
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSID = process.env.TWILIO_SERVICE_SID!;
const client = twilio(accountSid, authToken);

export const resolvers = {
  Query: {
    sendMPIN: async (_: any, args: { phone: string }) => {
      try {
        // const verification = await client.verify.v2
        //   .services(serviceSID)
        //   .verifications.create({
        //     to: args.phone,
        //     channel: "sms",
        //   });

        // TO DO: This is temporary to prevent spam during development
        const verification = { status: "pending" }

        return {
          success: verification.status === "pending",
          message: "MPIN sent successfully",
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    verifyMPIN: async (_: any, args: { phone: string; code: string }) => {
      try {
        // const verification = await client.verify.v2
        //   .services(serviceSID)
        //   .verificationChecks.create({
        //     to: args.phone,
        //     code: args.code,
        //   });

        // TO DO: This is temporary to prevent spam during development
        const verification = { status: "approved" }

        return {
          success: verification.status === "approved",
          message: "MPIN verified successfully",
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
  },
  Mutation: {
    createAccount: async (_: any, args: { data: CreateAccountData }, context: Context) => {
      try {
        await context.prisma.account.create({
          data:  {...args.data }
        })

        return {
          success: true,
          message: "Account created successfully",
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        }
      }
    },
  },
};
