import { createToken } from "@actions/clientAccountToken";
import { Response } from "express";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const oAuthLogin = async (req: any, res: Response, profile: any) => {
  try {
      const account = await req.context.prismaReplica.account.findUnique({
        where: {
          email: profile.emails[0].value
        }
      })

      if (!account) {
        return res.redirect(CLIENT_URL + "/oauth/callback");
      }

      const token = createToken({
        id: account.id,
        role: account.role
      })

      return res.redirect(CLIENT_URL + "/oauth/callback?token=" + token);
    } catch (err) {
      return res.redirect(CLIENT_URL + "/oauth/callback");
  }
}

const oAuthCreate = async (req: any, res: Response, profile: any) => {
  try {
      const account = await req.context.prisma.account.create({
        data: {
          email: profile.emails[0].value,
          fname: profile.name.givenName,
          lname: profile.name.familyName,
          role: "AGENT"
        }
      })

      const token = createToken({
        id: account.id,
        role: account.role
      })

      return res.redirect(CLIENT_URL + "/oauth/callback?token=" + token);
    } catch (err) {
      return res.redirect(CLIENT_URL + "/oauth/callback");
  }
}

export { oAuthLogin, oAuthCreate }