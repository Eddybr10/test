import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { email, masterPasswordHash } = await req.json();

    if (!email || !masterPasswordHash) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.masterPasswordHash !== masterPasswordHash) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
