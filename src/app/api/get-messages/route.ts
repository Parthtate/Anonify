import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import mongoose from 'mongoose';
import { User } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';

// Never prerendered: this handler needs a live database and the caller's session.
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const _user: User = session?.user;

  if (!session || !_user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  // Cursor: only notes strictly older than this timestamp are returned.
  const beforeParam = searchParams.get('before');
  const before = beforeParam ? new Date(beforeParam) : null;
  if (before && Number.isNaN(before.getTime())) {
    return Response.json(
      { success: false, message: 'Invalid cursor' },
      { status: 400 }
    );
  }

  try {
    // Filter, sort and slice inside the database so only one batch leaves the server.
    const [result] = await UserModel.aggregate<{
      total: number;
      remaining: number;
      messages: unknown[];
    }>([
      { $match: { _id: new mongoose.Types.ObjectId(_user._id) } },
      {
        $project: {
          total: { $size: '$messages' },
          older: before
            ? {
                $filter: {
                  input: '$messages',
                  as: 'm',
                  cond: { $lt: ['$$m.createdAt', before] },
                },
              }
            : '$messages',
        },
      },
      {
        $project: {
          total: 1,
          remaining: { $size: '$older' },
          messages: {
            $slice: [{ $sortArray: { input: '$older', sortBy: { createdAt: -1 } } }, limit],
          },
        },
      },
    ]);

    if (!result) {
      return Response.json(
        { message: 'User not found', success: false },
        { status: 404 }
      );
    }

    return Response.json(
      { messages: result.messages, total: result.total, hasMore: result.remaining > limit },
      { status: 200 }
    );
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return Response.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
