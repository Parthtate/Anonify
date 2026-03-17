import { resend } from "@/lib/resend";
import VerificationEmail from "../../emails/VerificationEmail";
import { ApiResponse } from '@/types/ApiResponse';

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Anonify <onboarding@resend.dev>',
      to: email,
      subject: 'Anonify — Your Verification Code',
      react: VerificationEmail({ username, otp: verifyCode }),
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, message: `Email error: ${error.message}` };
    }

    console.log('Verification email sent, id:', data?.id);
    return { success: true, message: 'Verification email sent successfully.' };
  } catch (emailError: any) {
    console.error('Error sending verification email:', emailError);
    return {
      success: false,
      message: `Failed to send verification email: ${emailError?.message ?? JSON.stringify(emailError)}`,
    };
  }
}


