import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";

const configurePassport = async () => {
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.BACKEND_URL + "/auth/google/callback"
    },

    async (_accessToken, _refreshToken, profile, done) => {
      done(null, profile);
    }
  )
  )

  // TO DO: Add Facebook oAuth
  // passport.use(
  //   new FacebookStrategy({
  //     clientID: process.env.FACEBOOK_CLIENT_ID!,
  //     clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  //     callbackURL: process.env.BACKEND_URL + "/auth/facebook/callback",
  //     profileFields: ["id", "displayName", "emails", "picture.type(large)"],
  //   },

  //   async (_accessToken, _refreshToken, profile, done) => {
  //     done(null, profile);
  //   }
  // )
  // )
};

export { configurePassport };
