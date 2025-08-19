import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Falta RESEND_API_KEY en .env");
}

export const resend = new Resend(process.env.RESEND_API_KEY);
export const EMAIL_FROM = process.env.EMAIL_FROM || "MVP Invest <noreply@example.com>";

