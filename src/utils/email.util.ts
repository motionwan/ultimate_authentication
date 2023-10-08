import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs'; // Import EJS

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'benjamin100ist@gmail.com', // Replace with your Gmail email address
    pass: 'uegp hudu mslb ttzo', // Replace with your app password for SMTP access
  },
});

export const sendVerificationEmail = (to: string, activationLink: string) => {
  try {
    // Get the path to the HTML template file
    const templatePath = path.join(__dirname, 'email', 'email.template.ejs');

    // Render the EJS template
    ejs.renderFile(templatePath, { activationLink }, (error, htmlContent) => {
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
        } else {
          console.log('Email sent:', info.response);
        }
      });
    });
  } catch (error) {
    console.error('Email sending error:', error);
  }
};
