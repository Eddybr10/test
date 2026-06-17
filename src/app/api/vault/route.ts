import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const items = await prisma.vaultItem.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error in GET vault:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { title, username, url, encryptedPassword, notes, iv } = await req.json();

    const item = await prisma.vaultItem.create({
      data: {
        userId: session.userId,
        title,
        username,
        url,
        encryptedPassword,
        notes: notes || null,
        iv,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error in POST vault:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
