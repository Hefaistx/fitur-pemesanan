import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      hasActiveReservation: boolean;
      reservationId: string | null;
      propertyName: string | null;
      roomNumber: string | null;
      isInJogja: boolean;
      checkIn: string | null;   // ISO string
      checkOut: string | null;  // ISO string
      rooms: { reservationId: string; roomNumber: string | null; propertyName: string }[];
    };
  }
}
