import { Context } from "@lib/context";
import { CreateAccountData, CreateAccountDataAdmin } from "@lib/types";
import dotenv from "dotenv";
import twilio from "twilio";
import { createToken, createTokenPhone } from "@actions/clientAccountToken";

dotenv.config();

// TWILIO
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSID = process.env.TWILIO_SERVICE_SID!;
const client = twilio(accountSid, authToken);

export const resolvers = {
  Query: {
    sendMPIN: async (_: any, args: { phone: string }, context: Context) => {
      try {
        const isExist = await context.prismaReplica.account.findUnique({
          where: {
            phone: args.phone,
          },
        })

        if (isExist) {
          return {
            success: false,
            message: "Account already exist",
          };
        }

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

        // Create a token specific to phone number to save in client's cookies
        const token = createTokenPhone({ phone: args.phone });

        return {
          success: true,
          message: "MPIN verified successfully",
          token
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    extractPhoneFromToken: async(_:any, args: {}, context: Context) => {
      let token = context.user

      if (token && typeof token === "object") {

        return {
          success: true,
          message: "Token decoded successfully",
          phone: token.phone
        }
      }

      return {
        success: false,
        message: "Invalid token"
      }
    }
  },
  Mutation: {
    // Create account for mobile clients
    createAccount: async (_: any, args: { data: CreateAccountData }, context: Context) => {
      try {
        const account = await context.prisma.account.create({
          data:  {...args.data }
        })

        const token = createToken({
          id: account.id,
          role: account.role
        })

        return {
          success: true,
          message: "Account created successfully",
          token
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        }
      }
    },
    // Login account for mobile clients
    loginAccount: async (_: any, args: { phone?: string, pinCode?: string }, context: Context ) => {
      try {
        // Is token exist and valid
        if (context.user) {
          return {
            success: true,
            message: "Login successful",
          };
        }

        const account = await context.prismaReplica.account.findUnique({
          where: {
            phone: args.phone
          }
        })

        if (!account) {
          return {
            success: false,
            message: "Account not found",
          };
        }

        if (account.pinCode !== args.pinCode) {
          return {
            success: false,
            message: "Invalid PIN",
          };
        }

        const token = createToken({
          id: account.id,
          role: account.role
        })

        return {
          success: true,
          message: "Login successful",
          token
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        }
      }
    },
    createAccountWeb: async (_:any, args: { data: CreateAccountDataAdmin }, context: Context) => {
      try {
        const account = await context.prisma.account.create({
          data:  {...args.data }
        })

        const token = createToken({
          id: account.id,
          role: account.role
        })

        return {
          success: true,
          message: "Account created successfully",
          token
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message
        }
      }
    },
    loginAccountWeb: async (_:any, args: { email?: string, password?: string }, context: Context) => {
      try {
        // Is token exist and valid
        if (context.user) {
          return {
            success: true,
            message: "Login successful",
          };
        }

        const account = await context.prismaReplica.account.findUnique({
          where: {
            email: args.email
          }
        })

        if (!account) {
          return {
            success: false,
            message: "Account not found",
          };
        }

        // Check password
        // TO DO: Use bcrypt
        if (account.password !== args.password) {
          return {
            success: false,
            message: "Invalid password",
          };
        }

        const token = createToken({
          id: account.id,
          role: account.role
        })

        return {
          success: true,
          message: "Login successful",
          token
        }

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        }
      }
    }
  },
};
