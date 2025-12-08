
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendReminderEmail = async (
  to,
  subject,
  todoText,
  reminderDate
) => {
  // Delay de 30s înainte de trimitere email
  await new Promise((resolve) => setTimeout(resolve, 30000));

  const msg = {
    to,
    from: {
      email: "no-reply@mylistapp.com",
      name: "My List App"
    },
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
            ⏰ Reminder set for: <strong>${new Date(reminderDate).toLocaleString("ro-RO")}</strong>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated reminder from My List App
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent via SendGrid to:", to);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending email via SendGrid:", error);
    // Nu blochează execuția, doar loghează
    return { success: false, error: error.message };
  }
};
