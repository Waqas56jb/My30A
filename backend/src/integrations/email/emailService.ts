import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { query } from '../../config/db.js';

let transporter: nodemailer.Transporter | null = null;
let verified = false;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export async function verifyEmail(): Promise<boolean> {
  try {
    await getTransporter().verify();
    verified = true;
    return true;
  } catch (error) {
    verified = false;
    logger.warn({ err: error }, 'SMTP verify failed');
    return false;
  }
}

export function emailVerified() {
  return verified;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  template: string;
  html: string;
  text: string;
}) {
  try {
    const info = await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    await query(
      `insert into email_log (recipient, subject, template, status, provider_message_id, sent_at)
       values ($1,$2,$3,'sent',$4, now())`,
      [input.to, input.subject, input.template, info.messageId ?? null],
    );
    return { ok: true as const };
  } catch (error) {
    const message = String((error as Error).message);
    logger.error({ err: error, template: input.template }, 'email send failed');
    await query(
      `insert into email_log (recipient, subject, template, status, error)
       values ($1,$2,$3,'failed',$4)`,
      [input.to, input.subject, input.template, message],
    );
    return { ok: false as const, error: message };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function branded(title: string, body: string) {
  const html = `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f6f1e8;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e6dcc8">
    <p style="color:#2b7d7a;letter-spacing:.12em;text-transform:uppercase;font-size:12px;margin:0 0 8px">My30A Host</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;color:#17332f">${escapeHtml(title)}</h1>
    <div style="color:#334;line-height:1.6">${body}</div>
    <p style="margin-top:28px;color:#887;font-size:12px">This is an official message from My30A Host.</p>
  </div></body></html>`;
  const text = `${title}\n\n${body.replace(/<[^>]+>/g, '')}\n\nMy30A Host`;
  return { html, text };
}

export async function sendOfficial(to: string, subject: string, template: string, title: string, body: string) {
  const { html, text } = branded(title, body);
  return sendEmail({ to, subject, template, html, text });
}
