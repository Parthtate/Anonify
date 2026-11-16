import UserModel from '@/model/User';
import dbConnect from '@/lib/dbConnect';
import { Message } from '@/model/User';
import { isOffensive } from '@/lib/moderate.ts';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rateLimit';
import { messageSchema } from '@/schemas/messageSchema';

// Generous per-IP cap: a whole college or office can share one public IP, so the
// per-recipient cap below is what actually protects an inbox from flooding.
const PER_IP = { limit: 30, windowMs: 5 * 60 * 1000 };
const PER_RECIPIENT = { limit: 40, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  await dbConnect();
  const { username, content } = await request.json();

  // Public, unauthenticated endpoint — validate before touching the database.
  // A non-string username would reach findOne as a query operator.
  if (typeof username !== 'string') {
    return Response.json(
      { message: 'Invalid username', success: false },
      { status: 400 }
    );
  }

  const parsed = messageSchema.safeParse({ content });
  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0].message, success: false },
      { status: 400 }
    );
  }

  const byIp = await rateLimit(`send:ip:${clientIp(request)}`, PER_IP.limit, PER_IP.windowMs);
  if (!byIp.ok) {
    return tooManyRequests(
      'You are sending notes very quickly. Please wait a few minutes and try again.',
      byIp.retryAfterSeconds
    );
  }

  try {
    const user = await UserModel.findOne({ username }).exec();
    if (!user) {
      return Response.json(
        { message: 'User not found', success: false },
        { status: 404 }
      );
    }

    // Check if the user is accepting messages
    if (!user.isAcceptingMessages) {
      return Response.json(
        { message: 'User is not accepting messages', success: false },
        { status: 403 }
      );
    }

    const byRecipient = await rateLimit(
      `send:to:${user.username}`,
      PER_RECIPIENT.limit,
      PER_RECIPIENT.windowMs
    );
    if (!byRecipient.ok) {
      return tooManyRequests(
        `@${user.username} has received a lot of notes in the last hour. Try again later.`,
        byRecipient.retryAfterSeconds
      );
    }

    if (isOffensive(parsed.data.content)) {
      return Response.json(
        {
          message: 'Your message contains inappropriate content and cannot be sent.',
          success: false,
        },
        { status: 400 }
      );
    }

    const newMessage = { content: parsed.data.content, createdAt: new Date() };
    user.messages.push(newMessage as Message);
    await user.save();

    return Response.json(
      { message: 'Message sent successfully', success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding message:', error);
    return Response.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}