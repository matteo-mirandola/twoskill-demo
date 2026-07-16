import nodemailer from "nodemailer";

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendReportEmail(to: string, pdf: Buffer): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? `2Skill <${process.env.SMTP_USER}>`,
    to,
    subject: "Your 2Skill AI Skills Assessment Report",
    text: [
      "Hi,",
      "",
      "Thanks for completing the 2Skill assessment. Your personal results report is attached as a PDF.",
      "",
      "It covers your overall result, a task-by-task analysis, and concrete suggestions on what to work on next.",
      "",
      "— The 2Skill team",
    ].join("\n"),
    attachments: [
      {
        filename: "2skill-assessment-report.pdf",
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });
}
