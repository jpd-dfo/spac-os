/**
 * SPAC OS - Authentication Configuration
 * NextAuth.js configuration for authentication
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from './prisma';

import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      organizationId?: string;
      role?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    organizationId?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    organizationId?: string;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },

  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
      allowDangerousEmailAccountLinking: true,
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env['GITHUB_CLIENT_ID']!,
      clientSecret: process.env['GITHUB_CLIENT_SECRET']!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Email Magic Link
    EmailProvider({
      server: {
        host: process.env['EMAIL_SERVER_HOST'],
        port: Number(process.env['EMAIL_SERVER_PORT']),
        auth: {
          user: process.env['EMAIL_SERVER_USER'],
          pass: process.env['EMAIL_SERVER_PASSWORD'],
        },
      },
      from: process.env['EMAIL_FROM'] || 'SPAC OS <noreply@spacos.com>',
    }),

    // Credentials (email/password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Type assertion for password field (may be stored externally or in extended schema)
        const userWithPassword = user as typeof user & { password?: string };
        if (!userWithPassword.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(credentials.password, userWithPassword.password);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account }) {
      // Allow OAuth linking
      if (account?.provider && account.provider !== 'credentials') {
        return true;
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.organizationId = user.organizationId;
        token.role = user.role;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.organizationId = session.organizationId;
        token.role = session.role;
      }

      // Refresh organization data periodically
      if (token.id && !token.organizationId) {
        // Query organization membership separately
        const membership = await prisma.organizationUser.findFirst({
          where: { userId: token.id },
          orderBy: { createdAt: 'desc' },
        });

        if (membership) {
          token.organizationId = membership.organizationId;
          token.role = membership.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.organizationId = token.organizationId;
        session.user.role = token.role;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign-in event
      if (user.id) {
        // Get user's organization for audit log
        const membership = await prisma.organizationUser.findFirst({
          where: { userId: user.id },
        });

        if (membership) {
          await prisma.auditLog.create({
            data: {
              action: 'SIGN_IN',
              entityType: 'User',
              entityId: user.id,
              userId: user.id,
              organizationId: membership.organizationId,
              metadata: {
                provider: account?.provider,
                isNewUser,
              },
            },
          });
        }
      }
    },

    async signOut(message) {
      // Log sign-out event
      if ('token' in message && message.token?.id) {
        const userId = message.token.id as string;
        // Get user's organization for audit log
        const membership = await prisma.organizationUser.findFirst({
          where: { userId },
        });

        if (membership) {
          await prisma.auditLog.create({
            data: {
              action: 'SIGN_OUT',
              entityType: 'User',
              entityId: userId,
              userId: userId,
              organizationId: membership.organizationId,
            },
          });
        }
      }
    },

    async createUser({ user }) {
      // Send welcome email, create default organization, etc.
      // User creation logged via audit log system
    },

    async linkAccount({ user, account }) {
      // Account linking logged via audit log system
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

/**
 * Get the current session server-side
 */
export { getServerSession } from 'next-auth';
