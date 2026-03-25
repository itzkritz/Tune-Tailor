import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "../../../../src/lib/supabase";

const handler = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // 1. Find user by email in Supabase
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (!user || !user.password_hash) {
          throw new Error('Invalid email or password');
        }

        // 2. Validate Password against hashed DB record
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
        
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // 3. Return the authorized User object for the session
        return {
          id: user.id,
          email: user.email,
        };
      }
    })
  ],
  pages: {
    signIn: '/login', // We use our custom AuthPage design
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        // Automatically sync Google Users into your Custom Database to track their Name (username) and Image (pfp)
        try {
          await supabase.from('users').upsert({
            email: user.email,
            username: user.name,
            avatar_url: user.image,
            password_hash: 'GOOGLE_OAUTH_PROXY' // Since they don't have a password
          }, { onConflict: 'email' });
        } catch (err) {
          console.error("Failed to sync Google user to Supabase:", err);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    }
  }
});

export { handler as GET, handler as POST };
