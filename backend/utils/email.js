const nodemailer = require("nodemailer");

const getTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error("Email service is not configured");
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
};

const sendVerificationEmail = async ({ email, name, code }) => {
    const transporter = getTransporter();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
        from,
        to: email,
        subject: "SmartSpend Verification Code",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2>Verify your SmartSpend account</h2>
                <p>Hi ${name || "there"},</p>
                <p>Your verification code is:</p>
                <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
                <p>This code expires in 5 minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
        `,
    });
};

const sendPasswordResetEmail = async ({ email, name, code }) => {
    const transporter = getTransporter();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
        from,
        to: email,
        subject: "Reset your SmartSpend password",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2>Reset your SmartSpend password</h2>
                <p>Hi ${name || "there"},</p>
                <p>Use this code to reset your password:</p>
                <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
                <p>This code expires in 10 minutes.</p>
                <p>If you did not request this, you can safely ignore this email.</p>
            </div>
        `,
    });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
