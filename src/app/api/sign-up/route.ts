import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/helpers/sendVerificationEmail';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rateLimit';

// This endpoint sends mail to any address given to it, so it is capped per address
// as well as per IP: otherwise it can be used to spam a stranger and burn the
// provider's daily quota, blocking real sign-ups.
const PER_IP = { limit: 5, windowMs: 60 * 60 * 1000 };
const PER_EMAIL = { limit: 3, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password } = await request.json();

    const byIp = await rateLimit(`signup:ip:${clientIp(request)}`, PER_IP.limit, PER_IP.windowMs);
    if (!byIp.ok) {
      return tooManyRequests(
        'Too many sign-up attempts. Please try again later.',
        byIp.retryAfterSeconds
      );
    }

    if (typeof email === 'string' && email) {
      const byEmail = await rateLimit(
        `signup:email:${email.toLowerCase()}`,
        PER_EMAIL.limit,
        PER_EMAIL.windowMs
      );
      if (!byEmail.ok) {
        return tooManyRequests(
          'We have already sent several codes to that address. Check your inbox, including spam.',
          byEmail.retryAfterSeconds
        );
      }
    }

    const existingVerifiedUserByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifiedUserByUsername) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 400 }
      );
    }

    const existingUserByEmail = await UserModel.findOne({ email });
    let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: 'User already exists with this email',
          },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserByEmail.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
        messages: [],
      });

      await newUser.save();
    }

    // Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );
    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'User registered successfully. Please verify your account.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return Response.json(
      {
        success: false,
        message: 'Error registering user',
      },
      { status: 500 }
    );
  }
}
