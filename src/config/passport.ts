import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.CALLBACK_URL,  
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await UserModel.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        const email = profile.emails?.[0].value;
        user = await UserModel.findOne({ email });

        if (user) {
          user.googleId = profile.id;
          if(profile.photos?.[0].value) user.avatar = profile.photos[0].value;
          await user.save();
          return done(null, user);
        }

        const newUser = await UserModel.create({
          fullName: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos?.[0].value,
          role: ["user"], 
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);
