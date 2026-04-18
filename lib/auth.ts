import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import prisma from '@/prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      authorization: { params: { scope: 'read:user user:email' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !account) return false;
      const provider = account.provider;
      const existing = await prisma.user.findUnique({ where: { email: user.email } });

      if (existing) {
        if (provider === 'google' && existing.authProvider !== 'google' && !existing.googleId) {
          return false;
        }
        if (provider === 'github' && existing.authProvider !== 'github' && !existing.githubId) {
          return false;
        }
        await prisma.user.update({
          where: { id: existing.id },
          data: { lastLoginAt: new Date() },
        });
        return true;
      }

      const githubLogin = (profile as { login?: string } | undefined)?.login;

      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name ?? null,
          avatar: user.image ?? null,
          authProvider: provider,
          googleId: provider === 'google' ? account.providerAccountId : null,
          githubId: provider === 'github' ? account.providerAccountId : null,
          githubUsername: provider === 'github' ? githubLogin ?? null : null,
          lastLoginAt: new Date(),
          gdprConsentAt: new Date(),
          gdprConsentVersion: '1.0',
        },
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};

export async function getAuthedUserOrNull(email: string | null | undefined) {
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}
