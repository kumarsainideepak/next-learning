import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from 'zod';
import { User } from "./app/lib/definitions";
import { sql } from "@vercel/postgres";
import bcrypt from 'bcrypt';

async function getUser(email: string) {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const validateFields = z.object({ email: z.string().email(), password: z.string().min(6)}).safeParse(credentials);

        if (validateFields.success) {
          const { email, password } = validateFields.data;

          const user = await getUser(email);

          if (!user) return null;

          if (await bcrypt.compare(password, user.password)) return user;
        }

        console.log('Invalid credentials');
        return null;
      }
    })
  ]
});

