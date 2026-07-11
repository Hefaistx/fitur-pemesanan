import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, reservations, properties } from './schema';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        phone: { label: 'No. HP', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.phone, credentials.phone))
          .limit(1);

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Ambil semua reservasi aktif (untuk support multi-kamar)
        const allReservations = await db
          .select()
          .from(reservations)
          .where(eq(reservations.userId, user.id));

        const activeReservations = allReservations.filter(r => r.status === 'active');
        const [activeReservation] = activeReservations;
        const hasActiveReservation = activeReservations.length > 0;

        const propertyName = hasActiveReservation ? activeReservation.propertyName : null;

        // Cek isInJogja dari SEMUA reservasi aktif (bukan hanya yang pertama)
        let jogjaReservations: typeof activeReservations = [];
        if (hasActiveReservation) {
          const allPropertyNames = [...new Set(activeReservations.map(r => r.propertyName))];
          const jogjaProperties = await db
            .select({ name: properties.name })
            .from(properties)
            .where(require('drizzle-orm').inArray(properties.name, allPropertyNames));
          const jogjaNames = new Set(jogjaProperties.map(p => p.name));
          jogjaReservations = activeReservations.filter(r => jogjaNames.has(r.propertyName));
        }
        const isInJogja = jogjaReservations.length > 0;

        // Tentukan reservasi utama: prioritaskan Jogja
        const primaryReservation = jogjaReservations[0] ?? activeReservation;

        // rooms: hanya kamar Jogja yang ditampilkan di room selector
        const rooms = jogjaReservations.map(r => ({
          reservationId: String(r.id),
          roomNumber: r.roomNumber,
          propertyName: r.propertyName,
        }));

        return {
          id: String(user.id),
          name: user.name,
          phone: user.phone,
          email: user.email ?? '',
          hasActiveReservation,
          reservationId: primaryReservation ? String(primaryReservation.id) : null,
          propertyName: primaryReservation?.propertyName ?? null,
          roomNumber: primaryReservation?.roomNumber ?? null,
          isInJogja,
          checkIn: primaryReservation ? primaryReservation.checkIn.toISOString() : null,
          checkOut: primaryReservation ? primaryReservation.checkOut.toISOString() : null,
          rooms,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.hasActiveReservation = (user as any).hasActiveReservation;
        token.reservationId = (user as any).reservationId;
        token.propertyName = (user as any).propertyName;
        token.roomNumber = (user as any).roomNumber;
        token.isInJogja = (user as any).isInJogja;
        token.checkIn = (user as any).checkIn;
        token.checkOut = (user as any).checkOut;
        token.rooms = (user as any).rooms;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        session.user.hasActiveReservation = token.hasActiveReservation as boolean;
        session.user.reservationId = token.reservationId as string | null;
        session.user.propertyName = token.propertyName as string | null;
        session.user.roomNumber = token.roomNumber as string | null;
        session.user.isInJogja = token.isInJogja as boolean;
        session.user.checkIn = token.checkIn as string | null;
        session.user.checkOut = token.checkOut as string | null;
        session.user.rooms = (token.rooms as any) ?? [];
      }
      return session;
    },
  },
};
