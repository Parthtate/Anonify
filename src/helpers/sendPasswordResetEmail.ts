import { render } from '@react-email/render';
import PasswordResetEmail from '../../emails/PasswordResetEmail';
import { ApiResponse } from '@/types/ApiResponse';

export async function sendPasswordResetEmail(
  email: string,
  username: string,
  token: string
): Promise<ApiResponse> {
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    console.error('NEXTAUTH_URL is not set; cannot build a reset link.');
    return { success: false, message: 'Could not send the reset email.' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY ?? '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Anonify', email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject: 'Anonify — Reset your password',
        htmlContent: render(
          PasswordResetEmail({
            username,
            resetUrl: `${baseUrl}/reset-password/${encodeURIComponent(token)}`,
          })
        ),
      }),
    });

    if (!response.ok) {
      console.error('Brevo API error:', response.status, await response.text());
      return { success: false, message: 'Could not send the reset email.' };
    }

    return { success: true, message: 'Reset email sent.' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Could not send the reset email.' };
  }
}
