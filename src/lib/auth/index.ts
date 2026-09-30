import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { signInSchema } from "@/lib/validations/auth";

/**
 * Google sign-in is optional. Without credentials the provider is not
 * registered and the sign-in pages hide the button, so a checkout with no
 * `.env.local` still runs on email and password alone.
 */
export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/**
 * Maps a Google identity onto a Helabiz user, creating one on first sign-in.
 *
 * Sessions are JWTs with no database adapter, so accounts are keyed by email:
 * signing in with Google using the address of an existing password account
 * opens that same account instead of a second one. Google only gets this far
 * with an address it has verified (see the `signIn` callback), which is what
 * makes linking on email safe here.
 *
 * Returns the Mongo id, because that is what every business-scoped query in
 * the app derives its access from — never the Google subject id.
 */
async function upsertGoogleUser(profile: { email: string; name?: string | null; image?: string | null }) {
  await connectDB();
  const email = profile.email.toLowerCase();

  const existing = await User.findOne({ email }).select("_id image").lean();
  if (existing) {
    // Adopt the Google avatar only for accounts that have none of their own.
    if (profile.image && !existing.image) {
      await User.updateOne({ _id: existing._id }, { image: profile.image });
    }
    return String(existing._id);
  }

  const created = await User.create({
    name: profile.name?.trim() || email.split("@")[0],
    email,
    image: profile.image ?? undefined,
    emailVerifiedAt: new Date(),
  });
  return String(created._id);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/sign-in", error: "/sign-in" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
          .select("+passwordHash")
          .lean();
        if (!user?.passwordHash) return null;
        // Disabled by a platform admin. Same null as a bad password: the sign-in
        // form should not tell a stranger which accounts exist.
        if (user.status === "disabled") return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          image: user.image ?? undefined,
        };
      },
    }),
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: true })] : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      // Accounts link on email, so an unverified address must not claim one.
      return Boolean(profile?.email && profile.email_verified);
    },
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === "google" && user?.email) {
        token.uid = await upsertGoogleUser({ email: user.email, name: user.name, image: user.image });
      } else if (user) {
        token.uid = user.id;
      }
      // `update()` from the client refreshes the cached display name/avatar.
      if (trigger === "update" && session?.name) token.name = session.name as string;
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
});
