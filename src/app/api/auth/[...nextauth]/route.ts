import { NextAuthOptions } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!existingUser) {
        await supabase
          .from("users")
          .insert({
            email: user.email,
            name: user.name,
            role: "customer",
          });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.restaurant_id = user.restaurant_id;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };