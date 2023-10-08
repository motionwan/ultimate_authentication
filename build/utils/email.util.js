"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs")); // Import EJS
const transporter = nodemailer_1.default.createTransport({
    service: 'Gmail',
    auth: {
        user: 'benjamin100ist@gmail.com',
        pass: 'uegp hudu mslb ttzo', // Replace with your app password for SMTP access
    },
});
const sendVerificationEmail = (to, activationLink) => {
    try {
        // Get the path to the HTML template file
        const templatePath = path_1.default.join(__dirname, 'email', 'email.template.ejs');
        // Render the EJS template
        ejs_1.default.renderFile(templatePath, { activationLink }, (error, htmlContent) => {
            if (error) {
                console.error('EJS rendering error:', error);
                return;
            }
            const mailOptions = {
                from: 'your@gmail.com',
                to,
                subject: 'Account Verification',
                html: htmlContent, // Set the email content as HTML
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email sending error:', error);
                }
                else {
                    console.log('Email sent:', info.response);
                }
            });
        });
    }
    catch (error) {
        console.error('Email sending error:', error);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
