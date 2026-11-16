import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { User } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';

export async function DELETE() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const _user: User = session?.user;

  if (!session || !_user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Returns the pre-update document so the response can say how many notes went.
    const previous = await UserModel.findByIdAndUpdate(
      _user._id,
      { $set: { messages: [] } },
      { new: false, projection: { messages: 1 } }
    );

    if (!previous) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, message: 'All notes deleted', deleted: previous.messages.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting all messages:', error);
    return Response.json(
      { success: false, message: 'Error deleting messages' },
      { status: 500 }
    );
  }
}
