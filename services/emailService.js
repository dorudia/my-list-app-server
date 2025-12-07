import nodemailer from "nodemailer";

// Configurare transporter pentru Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verificare configurare la pornire
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ SMTP Server ready to send emails");
  }
});

// Trimite email de reminder
export const sendReminderEmail = async (
  to,
  subject,
  todoText,
  reminderDate
) => {
  try {
    const mailOptions = {
      from: `"My List App" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject || "🔔 Reminder: Task Due",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a2e; margin-bottom: 20px;">📋 Task Reminder</h2>
            <div style="background-color: #e6f4fe; padding: 15px; border-left: 4px solid #2d8bbe; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px; color: #333;">
                <strong>${todoText}</strong>
              </p>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              ⏰ Reminder set for: <strong>${new Date(
                reminderDate
              ).toLocaleString("ro-RO")}</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated reminder from My List App
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("   Message ID:", info.messageId);
    console.log("   Response:", info.response);
    console.log("   Accepted:", info.accepted);
    console.log("   Rejected:", info.rejected);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:");
    console.error("   Error message:", error.message);
    console.error("   Error code:", error.code);
    console.error("   Full error:", error);
    return { success: false, error: error.message };
  }
};
