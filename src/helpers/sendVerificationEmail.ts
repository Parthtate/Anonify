import { render } from '@react-email/render';
import VerificationEmail from '../../emails/VerificationEmail';
import { ApiResponse } from '@/types/ApiResponse';

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  // Email clients run no JavaScript, so a one-tap link is the only real alternative
  // to typing the code by hand. Needs an absolute URL.
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  const verifyUrl = baseUrl
    ? `${baseUrl}/verify/${encodeURIComponent(username)}?code=${encodeURIComponent(verifyCode)}`
    : undefined;

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
        subject: 'Anonify — Your Verification Code',
        htmlContent: render(VerificationEmail({ username, otp: verifyCode, verifyUrl })),
      }),
    });

    if (!response.ok) {
      // Provider details stay in the server log; the caller is an unauthenticated sign-up.
      console.error('Brevo API error:', response.status, await response.text());
      return { success: false, message: 'Could not send verification email.' };
    }

    return { success: true, message: 'Verification email sent successfully.' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, message: 'Could not send verification email.' };
  }
}
