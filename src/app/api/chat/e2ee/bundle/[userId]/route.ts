import { NextResponse } from 'next/server';
import { auth } from '@/utils/auth';
import prisma from '@/backend/db/prisma';
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

    let targetUserId = userId;
    
    if (userId === "admin") {
      log.debug("E2EE Bundle: Buscando dispositivo de administrador.");
      const admin = await prisma.user.findFirst({
        where: { role: 'admin' },
        include: { e2eeDevice: true }
      });
      if (!admin || !admin.e2eeDevice) {
        log.warn("E2EE Bundle: Dispositivo de administrador no encontrado.");
        return NextResponse.json({ error: 'Admin device not found' }, { status: 404 });
      }
      targetUserId = admin.id;
    }

    const device = await prisma.e2EEDevice.findUnique({
      where: { userId: targetUserId },
      include: {
        preKeys: {
          take: 1, // Only take one prekey per bundle request
          orderBy: { keyId: 'asc' },
        },
      },
    });

    if (!device) {
      log.warn("E2EE Bundle: Dispositivo no encontrado para el usuario:", { targetUserId });
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Return a prekey if available (we do NOT delete it since our nacl.box scheme
    // only uses the signedPreKey for encryption. PreKeys are kept for future protocol upgrades.)
    const preKey = device.preKeys.length > 0 ? device.preKeys[0] : null;

    const isSelf = targetUserId === session.user.id;

    const bundle: any = {
      registrationId: device.registrationId,
      identityKey: device.identityKey,
      signedPreKey: {
        keyId: device.signedPreKeyId,
        publicKey: device.signedPreKey,
        signature: device.signedPreKeySig,
      },
      preKey: preKey ? {
        keyId: preKey.keyId,
        publicKey: preKey.publicKey,
      } : null, // If null, the client falls back to not using a one-time prekey
    };

    if (isSelf) {
      log.debug("E2EE Bundle: Solicitante es dueño del dispositivo. Adjuntando claves privadas.", { userId: targetUserId });
      bundle.privateKeys = {
        identityPrivateKey: device.identityPrivateKey,
        signedPreKeyPrivateKey: device.signedPreKeyPrivateKey,
      };
    } else {
      log.debug("E2EE Bundle: Transmitiendo claves públicas únicamente.", { targetUserId });
    }

    return NextResponse.json(bundle);
  } catch (error) {
    log.error('Error fetching E2EE bundle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
