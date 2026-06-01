import { NextResponse } from 'next/server';
import { auth } from '@/utils/auth';
import { chatService } from "@/backend/modules/chat";
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

    await chatService.registerE2EEDevice(userId, {
      registrationId,
      identityKey,
      identityPrivateKey,
      signedPreKeyId,
      signedPreKey,
      signedPreKeyPrivateKey,
      signedPreKeySig,
      preKeys,
    });

    log.info("E2EE Registro: Registro de claves completado exitosamente para el usuario:", { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error in E2EE registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
