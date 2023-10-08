"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_model_1 = __importDefault(require("../models/users.model"));
const token_model_1 = __importDefault(require("../models/token.model"));
const crypto_1 = __importDefault(require("crypto"));
const email_util_1 = require("../utils/email.util");
class AuthController {
    async register(req, res) {
        try {
            const { firstName, lastName, username, email, password } = req.body;
            const userExists = await users_model_1.default.findOne({
                $or: [{ username }, { email }],
            });
            if (userExists) {
                return res.status(400).json({ message: 'User already exists' });
            }
            //salt for bcrypt
            const salt = await bcrypt_1.default.genSalt(12);
            const hashedPassword = await bcrypt_1.default.hash(password, salt);
            // now let's create the new user
            const user = new users_model_1.default({
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
                const token = await token_model_1.default.create({
                    userId: user._id,
                    token: crypto_1.default.randomBytes(32).toString('hex'),
                });
                //token and user id is created so now send the mail
                // for confirmation
                const activationLink = `${user._id}/verify/${token.token}`;
                (0, email_util_1.sendVerificationEmail)(user.email, activationLink);
            }
            return res.status(201).json({
                message: 'User created successfully',
            });
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: `internal server error ${err.message}` });
        }
    }
    // user verification method here
    async verify(req, res) {
        try {
            // get the token and id from the link
            //sent to user email during registration
            const { token, id } = req.params;
            //find the user in the db
            const user = await users_model_1.default.findById(id);
            // if user is not found link is incorrect
            if (!user) {
                return res.status(404).json({ message: 'Invalid Link' });
            }
            //find token. if token is not found link is incorrect
            const oldToken = await token_model_1.default.findOne({ token: token, userId: id });
            if (!oldToken) {
                const token = await token_model_1.default.create({
                    userId: user._id,
                    token: crypto_1.default.randomBytes(32).toString('hex'),
                });
                //token and user id is created so now send the mail
                // for confirmation
                const activationLink = `${user._id}/verify/${token.token}`;
                (0, email_util_1.sendVerificationEmail)(user.email, activationLink);
                return res
                    .status(404)
                    .json({ message: 'Link has expired check email for new link' });
            }
            // confirm user has been verified
            await users_model_1.default.findByIdAndUpdate(id, {
                verified: true,
            });
            await token_model_1.default.findByIdAndDelete(oldToken._id);
            return res.status(200).json({
                message: 'User verified successfully',
            });
        }
        catch (err) {
            return res.status(500).json({ message: `internal server error ` });
        }
    }
    async login(req, res) {
        try {
            const { login, password } = req.body;
            const user = await users_model_1.default.findOne({
                $or: [{ username: login }, { email: login }],
            });
            // if user is not found,
            if (!user) {
                return res
                    .status(401)
                    .json({ message: 'Wrong username password combination' });
            }
            // try to match the password in the database
            const isMatch = await bcrypt_1.default.compare(password, user.password);
            if (!isMatch) {
                return res
                    .status(401)
                    .json({ message: 'Wrong username password combination' });
            }
            // if the password is correct,
            // create a token
            const accessToken = jsonwebtoken_1.default.sign({
                email: user.email,
                username: user.username,
                userId: user._id,
            }, process.env.ACCESS_TOKEN, {
                expiresIn: '10m',
            });
            const refreshToken = jsonwebtoken_1.default.sign({
                email: user.email,
                username: user.username,
                userId: user._id,
            }, process.env.REFRESH_TOKEN, {
                expiresIn: '1d',
            });
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
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: `Internal server error: ${err.message}` });
        }
    }
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (email) {
                const user = await users_model_1.default.findOne({ email });
                if (user) {
                    // console.log(user);
                    const token = await token_model_1.default.create({
                        token: crypto_1.default.randomBytes(32).toString('hex'),
                        userId: user._id,
                    });
                    //console.log(token);
                    const activationLink = `${token.token}`;
                    (0, email_util_1.sendVerificationEmail)(user.email, activationLink);
                    await users_model_1.default.findByIdAndUpdate(user._id, {
                        resetPassword: token.token,
                    });
                    return res
                        .status(200)
                        .json({ message: 'Reset Password Link sent to your email' });
                }
                else {
                    return res.status(404).json({ message: 'User not found' });
                }
            }
            else {
                return res
                    .status(400)
                    .json({ message: 'Email not found use a valid email' });
            }
        }
        catch (err) {
            return res.status(500).json({ message: `Internal server error` });
        }
    }
    async resetPassword(req, res) {
        try {
            const { password } = req.body;
            const { token } = req.params;
            const user = await users_model_1.default.findOne({ resetPassword: token });
            if (user) {
                await users_model_1.default.updateOne({
                    password: await bcrypt_1.default.hash(password, 12),
                    resetPasswordToken: null,
                });
                await token_model_1.default.deleteOne({ token: token });
                await users_model_1.default.findByIdAndUpdate(user._id, {
                    resetPassword: '',
                });
                res.json({ message: 'Password reset successful' });
            }
            else {
                console.log('user not found');
                res.status(400).json({
                    error: 'Password reset link expired. Please reset password again',
                });
            }
        }
        catch (err) {
            return res.status(500).json({ message: `Internal server error` });
        }
    }
    async logout(req, res) {
        try {
            // delete access token from client side
            const cookies = req.cookies;
            if (!cookies)
                return res.sendStatus(204); // no content
            const refreshToken = cookies.jwt;
            // check the db to see if the refresh token exists
            const foundUser = await users_model_1.default.findOne({ refreshToken });
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
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: `Internal Server Error ${err.message}` });
        }
    }
}
exports.default = AuthController;
