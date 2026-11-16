import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { rateLimit } from '@/lib/rateLimit';

// Caps password guessing. Keyed on the identifier rather than the IP so that a
// shared campus or office network cannot lock everyone out at once.
const SIGN_IN_ATTEMPTS = { limit: 10, windowMs: 15 * 60 * 1000 };

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      // Must match what the sign-in form posts: one field accepting either email or username.
      credentials: {
        identifier: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        const identifier = credentials?.identifier;
        const password = credentials?.password;
        if (typeof identifier !== 'string' || typeof password !== 'string') return null;

        await dbConnect();

        const attempts = await rateLimit(
          `signin:${identifier.toLowerCase()}`,
          SIGN_IN_ATTEMPTS.limit,
          SIGN_IN_ATTEMPTS.windowMs
        );
        if (!attempts.ok) {
          throw new Error('Too many sign-in attempts. Please wait 15 minutes and try again.');
        }

        const user = await UserModel.findOne({
          $or: [{ email: identifier }, { username: identifier }],
        });

        // Deliberately identical for "no such account" and "wrong password", so the
        // form cannot be used to discover which usernames or emails are registered.
        const genericFailure = 'That username or password is not right.';
        if (!user) throw new Error(genericFailure);
        if (!user.isVerified) {
          throw new Error('Please verify your email before signing in.');
        }
        if (!(await bcrypt.compare(password, user.password))) {
          throw new Error(genericFailure);
        }
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString(); // Convert ObjectId to string
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
};
