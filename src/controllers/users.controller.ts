import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/users.model';
import Token from '../models/token.model';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/email.util';

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, username, email, password } = req.body;
      const userExists = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      //salt for bcrypt
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      // now let's create the new user
      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        username,
      });

      //save new user into the database
      await user.save();

      // if user's account is created successfully,
      // create a token that will be used to activate the account
      if (user) {
        const token = await Token.create({
          userId: user._id,
          token: crypto.randomBytes(32).toString('hex'),
        });
        //token and user id is created so now send the mail
        // for confirmation
        const activationLink = `${user._id}/verify/${token.token}`;
        sendVerificationEmail(user.email, activationLink);
      }
      return res.status(201).json({
        message: 'User created successfully',
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: `internal server error ${err.message}` });
    }
  }

  // user verification method here
  async verify(req: Request, res: Response) {
    try {
      // get the token and id from the link
      //sent to user email during registration
      const { token, id } = req.params;
      //find the user in the db
      const user = await User.findById(id);
      // if user is not found link is incorrect
      if (!user) {
        return res.status(404).json({ message: 'Invalid Link' });
      }
      //find token. if token is not found link is incorrect
      const oldToken = await Token.findOne({ token: token, userId: id });
      if (!oldToken) {
        const token = await Token.create({
          userId: user._id,
          token: crypto.randomBytes(32).toString('hex'),
        });
        //token and user id is created so now send the mail
        // for confirmation
        const activationLink = `${user._id}/verify/${token.token}`;
        sendVerificationEmail(user.email, activationLink);
        return res
          .status(404)
          .json({ message: 'Link has expired check email for new link' });
      }
      // confirm user has been verified
      await User.findByIdAndUpdate(id, {
        verified: true,
      });
      await Token.findByIdAndDelete(oldToken._id);
      return res.status(200).json({
        message: 'User verified successfully',
      });
    } catch (err: any) {
      return res.status(500).json({ message: `internal server error ` });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { login, password } = req.body;
      const user = await User.findOne({
        $or: [{ username: login }, { email: login }],
      });
      // if user is not found,
      if (!user) {
        return res
          .status(401)
          .json({ message: 'Wrong username password combination' });
      }
      // try to match the password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: 'Wrong username password combination' });
      }
      // if the password is correct,
      // create a token
      const accessToken = jwt.sign(
        {
          email: user.email,
          username: user.username,
          userId: user._id,
        },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: '10m',
        }
      );

      const refreshToken = jwt.sign(
        {
          email: user.email,
          username: user.username,
          userId: user._id,
        },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: '1d',
        }
      );
      // save refresh token to the user
      user.refreshToken = refreshToken;
      user.save();
      //send refresh token as http only
      // to prevent hacking with javascript
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        accessToken: accessToken,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
        email: user.email,
        username: user.username,
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: `Internal server error: ${err.message}` });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (email) {
        const user = await User.findOne({ email });
        if (user) {
          // console.log(user);
          const token = await Token.create({
            token: crypto.randomBytes(32).toString('hex'),
            userId: user._id,
          });
          //console.log(token);
          const activationLink = `${token.token}`;
          sendVerificationEmail(user.email, activationLink);
          await User.findByIdAndUpdate(user._id, {
            resetPassword: token.token,
          });
          return res
            .status(200)
            .json({ message: 'Reset Password Link sent to your email' });
        } else {
          return res.status(404).json({ message: 'User not found' });
        }
      } else {
        return res
          .status(400)
          .json({ message: 'Email not found use a valid email' });
      }
    } catch (err) {
      return res.status(500).json({ message: `Internal server error` });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      const { token } = req.params;
      const user = await User.findOne({ resetPassword: token });
      if (user) {
        await User.updateOne({
          password: await bcrypt.hash(password, 12),
          resetPasswordToken: null,
        });
        await Token.deleteOne({ token: token });
        await User.findByIdAndUpdate(user._id, {
          resetPassword: '',
        });
        res.json({ message: 'Password reset successful' });
      } else {
        console.log('user not found');
        res.status(400).json({
          error: 'Password reset link expired. Please reset password again',
        });
      }
    } catch (err: any) {
      return res.status(500).json({ message: `Internal server error` });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // delete access token from client side
      const cookies = req.cookies;
      if (!cookies) return res.sendStatus(204); // no content
      const refreshToken = cookies.jwt;
      // check the db to see if the refresh token exists
      const foundUser = await User.findOne({ refreshToken });
      if (!foundUser) {
        res.clearCookie('jwt', {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        });
        return res.sendStatus(204); // no content
      }
      // if user is found
      // delete the refreshToken from the database
      foundUser.refreshToken = '';
      await foundUser.save();
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      return res.sendStatus(204); // no content
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: `Internal Server Error ${err.message}` });
    }
  }
}
export default AuthController;
