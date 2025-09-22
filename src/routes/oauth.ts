import { Router } from "express";
import passport from "passport";
import { oAuthLogin, oAuthCreate } from "@actions/oauth";

const router = Router();

router.get("/google", (req, res, next) => {
  const type = req.query.type;

  const middleware = passport.authenticate("google", {scope: ["email", "profile"], state: JSON.stringify(type)});

  middleware(req, res, next);
});

router.get("/facebook", (req, res, next) => {
  const type = req.query.type;

  const middleware = passport.authenticate("facebook", {scope: ["email"], state: JSON.stringify(type)});

  middleware(req, res, next);
});

router.get("/google/callback", passport.authenticate("google", {session: false}), (req: any, res) => { 
    const type = JSON.parse(req.query.state);
    const profile = req.user;
  
    if (type === "LOGIN") {
      oAuthLogin(req, res, profile);
    }

    if (type === "SIGNUP") {
      oAuthCreate(req, res, profile);
    }

});

// TO DO: Add callback for facebook
router.get("/facebook/callback", passport.authenticate("facebook", {session: false}), (req: any, res) => {
  const profile = req.user;
  res.json({ success: true, message: "You are logged in" });
});

export default router;