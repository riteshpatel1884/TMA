// // lib/emails/sendEmail.js
// // Install: npm install resend

// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// /**
//  * Send an email via Resend.
//  * @param {Object} options
//  * @param {string} options.to - Recipient email
//  * @param {string} options.subject - Email subject
//  * @param {string} options.html - HTML body
//  * @returns {Promise<{success: boolean, id?: string, error?: string}>}
//  */
// export async function sendEmail({ to, subject, html }) {
//   if (!process.env.RESEND_API_KEY) {
//     console.warn("[sendEmail] RESEND_API_KEY not set — skipping email.");
//     return { success: false, error: "RESEND_API_KEY not configured" };
//   }

//   try {
//     const data = await resend.emails.send({
//       from: process.env.EMAIL_FROM ?? "LeaderLab <noreply@leaderlab.in>",
//       to,
//       subject,
//       html,
//     });

//     return { success: true, id: data.id };
//   } catch (err) {
//     console.error("[sendEmail] Resend error:", err);
//     return { success: false, error: err.message };
//   }
// }



// lib/emails/sendEmail.js
import { Resend } from "resend";

/**
 * Send an email via Resend.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[sendEmail] RESEND_API_KEY not set — skipping email.");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    // Instantiate inside the function — never at module level
    // This prevents build-time crashes when env vars aren't available
    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "LeaderLab <noreply@leaderlab.in>",
      to,
      subject,
      html,
    });

    return { success: true, id: data.id };
  } catch (err) {
    console.error("[sendEmail] Resend error:", err);
    return { success: false, error: err.message };
  }
}