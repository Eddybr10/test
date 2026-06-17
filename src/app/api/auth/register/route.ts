import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { email, salt, masterPasswordHash } = await req.json();

    if (!email || !salt || !masterPasswordHash) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        salt,
        masterPasswordHash,
      },
    });

    await createSession(user.id);

    return NextResponse.json({ success: true, salt: user.salt });
  } catch (error) {
    console.error('Error in register:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
