import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { salt: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ salt: user.salt });
  } catch (error) {
    console.error('Error in get-salt:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
