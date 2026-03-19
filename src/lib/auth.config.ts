import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [], // Providers can be empty here as we add them in the main auth.ts
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).email = token.email as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
