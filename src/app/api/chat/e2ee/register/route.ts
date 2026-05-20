import { NextResponse } from 'next/server';
import { auth } from '@/utils/auth';
import prisma from '@/backend/db/prisma';
import logger from '@/utils/logger';

const log = logger.child("src/app/api/chat/e2ee/register/route.ts");

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      log.warn("E2EE Registro: Intento de registro sin sesión válida.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { registrationId, identityKey, identityPrivateKey, signedPreKeyId, signedPreKey, signedPreKeyPrivateKey, signedPreKeySig, preKeys } = body;

    // Validate the incoming data
    if (registrationId == null || !identityKey || signedPreKeyId == null || !signedPreKey || !signedPreKeySig || !Array.isArray(preKeys)) {
      log.warn("E2EE Registro: Datos de registro inválidos.", { userId, registrationId, hasIdentityKey: !!identityKey, hasSignedPreKey: !!signedPreKey, preKeysLength: Array.isArray(preKeys) ? preKeys.length : null });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    log.info("E2EE Registro: Iniciando transacción de registro de claves para el usuario:", { userId, preKeysCount: preKeys.length });

    // Use a transaction to update or create the device and prekeys
    await prisma.$transaction(async (tx) => {
      // Upsert the device
      const device = await tx.e2EEDevice.upsert({
        where: { userId },
        update: {
          registrationId,
          identityKey,
          identityPrivateKey,
          signedPreKeyId,
          signedPreKey,
          signedPreKeyPrivateKey,
          signedPreKeySig,
        },
        create: {
          userId,
          registrationId,
          identityKey,
          identityPrivateKey,
          signedPreKeyId,
          signedPreKey,
          signedPreKeyPrivateKey,
          signedPreKeySig,
        },
      });

      // Delete old prekeys
      await tx.e2EEPreKey.deleteMany({
        where: { deviceId: device.id },
      });

      // Insert new prekeys
      if (preKeys.length > 0) {
        await tx.e2EEPreKey.createMany({
          data: preKeys.map((pk: any) => ({
            deviceId: device.id,
            keyId: pk.keyId,
            publicKey: pk.publicKey,
          })),
        });
      }
    });

    log.info("E2EE Registro: Registro de claves completado exitosamente para el usuario:", { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error in E2EE registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
