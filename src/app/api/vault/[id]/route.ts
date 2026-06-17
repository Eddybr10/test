import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const { title, username, url, encryptedPassword, notes, iv } = await req.json();

    const existing = await prisma.vaultItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const updated = await prisma.vaultItem.update({
      where: { id },
      data: {
        title,
        username,
        url,
        encryptedPassword,
        notes: notes || null,
        iv,
        lastModified: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT vault:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    
    const existing = await prisma.vaultItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await prisma.vaultItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE vault:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
