import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { sendPasswordResetEmail } from '@/helpers/sendPasswordResetEmail';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rateLimit';
import { forgotPasswordSchema } from '@/schemas/resetPasswordSchema';

const PER_IP = { limit: 5, windowMs: 60 * 60 * 1000 };
const PER_EMAIL = { limit: 3, windowMs: 60 * 60 * 1000 };
const TOKEN_TTL_MS = 60 * 60 * 1000;

// Identical response whether or not the address exists, so this endpoint cannot be
// used to find out who has an account.
const ALWAYS = {
  success: true,
  message: 'If that email has an inbox, a reset link is on its way.',
};

export async function POST(request: Request) {
  await dbConnect();

  const parsed = forgotPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { success: false, message: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const email = parsed.data.email.toLowerCase();

  const byIp = await rateLimit(`forgot:ip:${clientIp(request)}`, PER_IP.limit, PER_IP.windowMs);
  if (!byIp.ok) {
    return tooManyRequests('Too many reset requests. Please try again later.', byIp.retryAfterSeconds);
  }
  const byEmail = await rateLimit(`forgot:email:${email}`, PER_EMAIL.limit, PER_EMAIL.windowMs);
  if (!byEmail.ok) {
    return tooManyRequests(
      'A reset link was already sent recently. Check your inbox, including spam.',
      byEmail.retryAfterSeconds
    );
  }

  try {
    const user = await UserModel.findOne({ email, isVerified: true });
    if (user) {
      // The raw token goes only into the email; the database keeps a hash of it.
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.resetTokenExpiry = new Date(Date.now() + TOKEN_TTL_MS);
      await user.save();

      const sent = await sendPasswordResetEmail(user.email, user.username, token);
      if (!sent.success) {
        return Response.json(
          { success: false, message: 'Could not send the reset email. Please try again.' },
          { status: 500 }
        );
      }
    }
    return Response.json(ALWAYS, { status: 200 });
  } catch (error) {
    console.error('Error starting password reset:', error);
    return Response.json(
      { success: false, message: 'Could not start the reset. Please try again.' },
      { status: 500 }
    );
  }
}
