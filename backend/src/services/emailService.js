const nodemailer = require('nodemailer');

const getTransporter = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host || !user || !pass) {
        console.warn('Email disabled: missing SMTP configuration.');
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });
};

const getFromAddress = () => {
    return process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@eduauth.local';
};

const sendEmail = async ({ to, subject, text, html }) => {
    const transporter = getTransporter();
    if (!transporter) {
        return { skipped: true };
    }

    return transporter.sendMail({
        from: getFromAddress(),
        to,
        subject,
        text,
        html
    });
};

const sendAccountApprovedEmail = async ({ to, role, name }) => {
    if (!to) {
        return { skipped: true };
    }

    const safeName = name ? ` ${name}` : '';
    const subject = 'Your EduAuth account is approved';
    const text = `Hello${safeName}, your ${role} account has been approved. You can now log in to EduAuth Registry.`;
    const html = `<p>Hello${safeName},</p>
<p>Your <strong>${role}</strong> account has been approved. You can now log in to EduAuth Registry.</p>`;

    return sendEmail({ to, subject, text, html });
};

const sendCertificateIssuedEmail = async ({
    to,
    studentName,
    credentialName,
    issuerName,
    certificateHash
}) => {
    if (!to) {
        return { skipped: true };
    }

    const appUrl = (process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const verifyUrl = `${appUrl}/verify/${certificateHash}`;
    const subject = 'Your EduAuth certificate is available';
    const text = `Hello ${studentName || 'Student'}, your certificate "${credentialName}" from ${issuerName} is now available. Verify link: ${verifyUrl}`;
    const html = `<p>Hello ${studentName || 'Student'},</p>
<p>Your certificate "<strong>${credentialName}</strong>" from <strong>${issuerName}</strong> is now available.</p>
<p>Verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`;

    return sendEmail({ to, subject, text, html });
};

const sendInstitutionAccessEmail = async ({ to, institutionName, canIssue }) => {
    if (!to) {
        return { skipped: true };
    }

    const statusText = canIssue ? 'enabled' : 'disabled';
    const subject = `EduAuth certificate issuing ${statusText}`;
    const text = `Hello ${institutionName || 'Institution'}, your certificate issuing access has been ${statusText} by the authority.`;
    const html = `<p>Hello ${institutionName || 'Institution'},</p>
<p>Your certificate issuing access has been <strong>${statusText}</strong> by the authority.</p>`;

    return sendEmail({ to, subject, text, html });
};

const sendProfileRequestReceivedEmail = async ({ to, studentName }) => {
    if (!to) {
        return { skipped: true };
    }

    const subject = 'We received your profile update request';
    const text = `Hello ${studentName || 'Student'}, your profile update request has been received and is pending review by the authority.`;
    const html = `<p>Hello ${studentName || 'Student'},</p>
<p>Your profile update request has been received and is pending review by the authority.</p>`;

    return sendEmail({ to, subject, text, html });
};

const sendProfileRequestDecisionEmail = async ({ to, studentName, status, comment }) => {
    if (!to) {
        return { skipped: true };
    }

    const normalizedStatus = status === 'approved' ? 'approved' : 'rejected';
    const subject = `Your profile update request was ${normalizedStatus}`;
    const text = `Hello ${studentName || 'Student'}, your profile update request was ${normalizedStatus}.${comment ? ` Comment: ${comment}` : ''}`;
    const html = `<p>Hello ${studentName || 'Student'},</p>
<p>Your profile update request was <strong>${normalizedStatus}</strong>.</p>
${comment ? `<p>Comment: ${comment}</p>` : ''}`;

    return sendEmail({ to, subject, text, html });
};

module.exports = {
    sendEmail,
    sendAccountApprovedEmail,
    sendCertificateIssuedEmail,
    sendInstitutionAccessEmail,
    sendProfileRequestReceivedEmail,
    sendProfileRequestDecisionEmail
};
