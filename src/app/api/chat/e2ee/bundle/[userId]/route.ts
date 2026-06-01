import { NextResponse } from 'next/server';
import { auth } from '@/utils/auth';
import { chatService } from "@/backend/modules/chat";
import logger from '@/utils/logger';

const log = logger.child("src/app/api/chat/e2ee/bundle/[userId]/route.ts");

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      log.warn("E2EE Bundle: Solicitud de bundle sin sesión válida.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await context.params;
    log.debug("E2EE Bundle: Solicitud de bundle recibida:", { solicitante: session.user.id, targetUserId: userId });

    const bundle = await chatService.getE2EEBundle(session.user.id, userId);

    return NextResponse.json(bundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ADMIN_DEVICE_NOT_FOUND") {
      log.warn("E2EE Bundle: Dispositivo de administrador no encontrado.");
      return NextResponse.json({ error: 'Admin device not found' }, { status: 404 });
    }
    if (message === "DEVICE_NOT_FOUND") {
      log.warn("E2EE Bundle: Dispositivo no encontrado.");
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    log.error('Error fetching E2EE bundle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
