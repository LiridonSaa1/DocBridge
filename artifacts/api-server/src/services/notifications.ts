/**
 * Notifications Service
 * Handles in-app notifications and stubs for email/SMS.
 */

import { db, notificationsTable } from "@workspace/db";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {}
) {
  const [notification] = await db
    .insert(notificationsTable)
    .values({ userId, type, title, body, metadata })
    .returning();
  return notification;
}

// FUTURE: Send email via SendGrid / Mailgun
export async function sendEmail(
  _to: string,
  _subject: string,
  _body: string
): Promise<void> {
  // Stub — replace with email provider SDK
}

// FUTURE: Send SMS OTP via Twilio / Vonage
export async function sendSmsOtp(
  _phone: string,
  _otp: string
): Promise<void> {
  // Stub — replace with SMS provider SDK
}

// FUTURE: Push notification via Firebase Cloud Messaging
export async function sendPushNotification(
  _deviceToken: string,
  _title: string,
  _body: string
): Promise<void> {
  // Stub — replace with FCM SDK
}
