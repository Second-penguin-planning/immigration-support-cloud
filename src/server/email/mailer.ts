import { createTransport } from 'nodemailer';
import { logger } from '@/lib/logger';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.EMAIL_SERVER_HOST);
}

function createSmtpTransport() {
  return createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

/**
 * メール送信。SMTP設定(EMAIL_SERVER_HOST等)があれば実際に送信し、
 * 未設定の開発環境ではログに内容を出力するだけに留める(devフォールバック)。
 */
export async function sendMail(input: SendMailInput): Promise<void> {
  if (!isSmtpConfigured()) {
    logger.info('メール送信(dev fallback: 実際には送信していません)', {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return;
  }

  const transport = createSmtpTransport();
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
