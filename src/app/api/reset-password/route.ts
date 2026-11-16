import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rateLimit';
import { resetPasswordSchema } from '@/schemas/resetPasswordSchema';

const PER_IP = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  await dbConnect();

  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success || typeof body.token !== 'string' || !body.token) {
    return Response.json(
      { success: false, message: parsed.success ? 'Missing reset token' : parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Caps guessing at the token itself.
  const byIp = await rateLimit(`reset:ip:${clientIp(request)}`, PER_IP.limit, PER_IP.windowMs);
  if (!byIp.ok) {
    return tooManyRequests('Too many attempts. Please try again later.', byIp.retryAfterSeconds);
  }

  try {
    const resetTokenHash = crypto.createHash('sha256').update(body.token).digest('hex');
    const user = await UserModel.findOne({
      resetTokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: 'This reset link is invalid or has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(parsed.data.password, 10);
    // Single use: clearing these invalidates the link immediately.
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return Response.json(
      { success: true, message: 'Password updated. You can sign in now.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return Response.json(
      { success: false, message: 'Could not reset the password. Please try again.' },
      { status: 500 }
    );
  }
}
