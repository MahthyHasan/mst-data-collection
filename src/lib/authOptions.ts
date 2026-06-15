import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { logAuth } from '@/lib/audit';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        await dbConnect();

        // Check user
        const user = await User.findOne({
          username: credentials.username.toLowerCase(),
          isDeleted: false,
        });

        const headers = req?.headers as Record<string, string> | undefined;
        const ipAddress = headers?.['x-forwarded-for'] || headers?.['x-real-ip'] || '127.0.0.1';
        const userAgent = headers?.['user-agent'] || 'Unknown';

        if (!user) {
          await logAuth({
            username: credentials.username,
            success: false,
            failureReason: 'User not found',
            ipAddress,
            userAgent,
            action: 'LOGIN',
          });
          throw new Error('Invalid username or password');
        }

        if (!user.isEnabled) {
          await logAuth({
            username: credentials.username,
            userId: user._id.toString(),
            success: false,
            failureReason: 'Account disabled',
            ipAddress,
            userAgent,
            action: 'LOGIN',
          });
          throw new Error('Account is disabled. Please contact the administrator.');
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password || '');
        if (!isPasswordCorrect) {
          await logAuth({
            username: credentials.username,
            userId: user._id.toString(),
            success: false,
            failureReason: 'Incorrect password',
            ipAddress,
            userAgent,
            action: 'LOGIN',
          });
          throw new Error('Invalid username or password');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Log successful login
        const sessionId = Math.random().toString(36).substring(2, 15);
        await logAuth({
          username: user.username,
          userId: user._id.toString(),
          success: true,
          ipAddress,
          userAgent,
          sessionId,
          action: 'LOGIN',
        });

        return {
          id: user._id.toString(),
          name: user.username,
          role: user.role,
          sessionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.sessionId = (user as any).sessionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).sessionId = token.sessionId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes session duration as per session timeout request
  },
  secret: process.env.NEXTAUTH_SECRET,
};
