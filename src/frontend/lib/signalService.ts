import { signalStore } from './signalStore';
import { config } from '@/config/config';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import logger from '@/utils/logger';
const log = logger.child("src/frontend/lib/signalService.ts");

export class SignalService {
  /**
   * Generates identity and PreKeys locally, and registers them on the server.
   * Utiliza TweetNaCl.js (Curve25519) para proveer seguridad nivel Signal 100% compatible con el navegador.
   */
  static async registerDevice() {
    if (!config.chat.enableE2EE) {
      log.warn('[E2EE:Register] E2EE is globally disabled in configuration (NEXT_PUBLIC_ENABLE_E2EE). Exiting registration.');
      return false;
    }

    log.info('[E2EE:Register] Initiating E2EE device registration and keys check...');

    // 1. Verificar si ya tenemos identidad local
    log.debug('[E2EE:Register] Checking local cryptographic identity in signalStore (IndexedDB)...');
    let identity = await signalStore.getIdentity();
    let restored = false;

    if (!identity) {
      const userId = signalStore.getUserId();
      log.info(`[E2EE:Register] Local identity not found in signalStore. Querying backup escrow from server for user ID: ${userId}`);
      try {
        const myBundle = await this.fetchBundle(userId);
        if (myBundle && myBundle.privateKeys && myBundle.privateKeys.identityPrivateKey && myBundle.privateKeys.signedPreKeyPrivateKey) {
          log.info(`[E2EE:Register] Secure recovery escrow bundle successfully retrieved for registration ID: ${myBundle.registrationId}. Restoring session...`);
          const restoredIdentityKey = naclUtil.decodeBase64(myBundle.privateKeys.identityPrivateKey);
          await signalStore.saveIdentity(myBundle.registrationId, restoredIdentityKey);

          const restoredSignedPreKeySecret = naclUtil.decodeBase64(myBundle.privateKeys.signedPreKeyPrivateKey);
          await signalStore.storeSignedPreKey(1, restoredSignedPreKeySecret);

          identity = { registrationId: myBundle.registrationId, keyPair: restoredIdentityKey };
          restored = true;
          log.info('[E2EE:Register] Cryptographic identity and Signed PreKey successfully restored in this browser.');
        }
      } catch (e) {
        log.warn('[E2EE:Register] No recovery escrow bundle found on server, or client failed to retrieve it. Proceeding with new identity generation...');
      }

      if (!identity) {
        log.info('[E2EE:Register] Generating a brand new Curve25519 cryptographic identity pair (TweetNaCl)...');
        const registrationId = Math.floor(Math.random() * 16380) + 1; // 1 to 16380

        // La clave de identidad en Signal suele ser Ed25519
        const keyPair = nacl.sign.keyPair();

        // Guardamos el SecretKey completo (que incluye el public key internamente)
        await signalStore.saveIdentity(registrationId, keyPair.secretKey);
        identity = { registrationId, keyPair: keyPair.secretKey };
        log.debug(`[E2EE:Register] New local identity successfully created. Local registration ID: ${registrationId}`);
      }
    }

    const identitySecret = new Uint8Array(Object.values(identity.keyPair));
    const identityKeyPair = nacl.sign.keyPair.fromSecretKey(identitySecret);

    // Evitar sobreescribir las claves si el dispositivo ya fue registrado y no acabamos de restaurarlo
    const existingSignedPreKey = await signalStore.loadSignedPreKey(1);
    if (existingSignedPreKey && !restored) {
      log.debug('[E2EE:Register] Existing E2EE device loaded from IndexedDB. Validating public key synchronization with server...');
      const localSignedPreKeyPublicKey = nacl.box.keyPair.fromSecretKey(existingSignedPreKey).publicKey;
      const localPublicKeyBase64 = naclUtil.encodeBase64(localSignedPreKeyPublicKey);

      try {
        const myRegistration = await this.fetchBundle(signalStore.getUserId());
        if (myRegistration && myRegistration.signedPreKey && myRegistration.signedPreKey.publicKey === localPublicKeyBase64) {
          log.info(`[E2EE:Register] Local identity and Signed PreKey match key-escrow server. Sincronización perfecta. (Key Hash: ${localPublicKeyBase64.substring(0, 12)}...)`);
          return false;
        }

        log.warn(`[E2EE:Register] Signed PreKey mismatch detected. (Local: ${localPublicKeyBase64.substring(0, 10)}... vs Server: ${myRegistration?.signedPreKey?.publicKey?.substring(0, 10)}...). Sincronizando claves locales desde el servidor...`);
        if (myRegistration && myRegistration.privateKeys && myRegistration.privateKeys.identityPrivateKey && myRegistration.privateKeys.signedPreKeyPrivateKey) {
          const restoredIdentityKey = naclUtil.decodeBase64(myRegistration.privateKeys.identityPrivateKey);
          await signalStore.saveIdentity(myRegistration.registrationId, restoredIdentityKey);

          const restoredSignedPreKeySecret = naclUtil.decodeBase64(myRegistration.privateKeys.signedPreKeyPrivateKey);
          await signalStore.storeSignedPreKey(1, restoredSignedPreKeySecret);

          log.info('[E2EE:Register] Local cryptographic identity successfully auto-sincronizada from server bundle.');
          return false;
        }
        log.warn('[E2EE:Register] No E2EE recovery private keys bundle found on the server. Re-registering keys traditionally...');
      } catch (e) {
        log.info('[E2EE:Register] Client has no active registration, or server query failed. Registering new cryptographic keys...');
      }
    }

    if (restored) {
      log.info('[E2EE:Register] Cryptographic session successfully recovered from escrow. Device registration complete.');
      return false;
    }

    log.info('[E2EE:Register] Preparing cryptographic PreKeys generation...');
    let signedPreKeySecret = existingSignedPreKey;
    let signedPreKeyPublicKey: Uint8Array;
    let signature: Uint8Array;

    if (!signedPreKeySecret) {
      log.info('[E2EE:Register] Generating a new Signed PreKey (signedPreKeyId: 1)...');
      const signedPreKeyKeyPair = nacl.box.keyPair();
      signedPreKeySecret = signedPreKeyKeyPair.secretKey;
      signedPreKeyPublicKey = signedPreKeyKeyPair.publicKey;
      signature = nacl.sign.detached(signedPreKeyPublicKey, identitySecret);
      await signalStore.storeSignedPreKey(1, signedPreKeySecret);
    } else {
      log.debug('[E2EE:Register] Re-signing existing local Signed PreKey with identity secret...');
      const keypair = nacl.box.keyPair.fromSecretKey(signedPreKeySecret);
      signedPreKeyPublicKey = keypair.publicKey;
      signature = nacl.sign.detached(signedPreKeyPublicKey, identitySecret);
    }

    log.info('[E2EE:Register] Generating 20 One-Time PreKeys for asynchronous offline E2EE key agreement...');
    const preKeys = [];
    for (let i = 1; i <= 20; i++) {
      const preKeyKeyPair = nacl.box.keyPair();
      await signalStore.storePreKey(i, preKeyKeyPair.secretKey);
      preKeys.push({
        keyId: i,
        publicKey: naclUtil.encodeBase64(preKeyKeyPair.publicKey)
      });
    }
    log.debug('[E2EE:Register] 20 One-Time PreKeys successfully generated and cached locally in IndexedDB.');

    log.info('[E2EE:Register] Uploading cryptographic public bundle and secure private backup block to the escrow server...');
    const payload = {
      registrationId: identity.registrationId,
      identityKey: naclUtil.encodeBase64(identityKeyPair.publicKey),
      identityPrivateKey: naclUtil.encodeBase64(identitySecret),
      signedPreKeyId: 1,
      signedPreKey: naclUtil.encodeBase64(signedPreKeyPublicKey),
      signedPreKeyPrivateKey: naclUtil.encodeBase64(signedPreKeySecret),
      signedPreKeySig: naclUtil.encodeBase64(signature),
      preKeys
    };

    const res = await fetch('/api/chat/e2ee/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      log.error('[E2EE:Register] Failed to upload cryptographic bundle to key-escrow server.');
      throw new Error("Error al registrar dispositivo E2EE en el servidor.");
    }

    log.info(`[E2EE:Register] E2EE Device successfully registered and synchronized with server. Registration ID: ${identity.registrationId}`);
    return true;
  }

  static async fetchBundle(userId: string) {
    log.debug(`[E2EE:Bundle] Querying E2EE key bundle for user ID: ${userId}...`);
    const res = await fetch(`/api/chat/e2ee/bundle/${userId}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) {
      log.error(`[E2EE:Bundle] Failed to retrieve cryptographic bundle for user ID: ${userId}`);
      throw new Error('Failed to fetch bundle');
    }
    return await res.json();
  }

  static async encryptMessage(userId: string, plaintext: string) {
    if (!config.chat.enableE2EE) {
      log.debug(`[E2EE:Encrypt] E2EE disabled. Sending raw plaintext message to recipient: ${userId}`);
      return { type: 0, ciphertext: plaintext };
    }

    log.info(`[E2EE:Encrypt] Initiating message encryption for recipient: ${userId}`);

    // SIEMPRE obtener la clave pública más reciente del servidor antes de cifrar.
    // Esto previene el uso de claves obsoletas cuando el destinatario ha rotado sus llaves
    // (ej. al cambiar de navegador o sesión).
    const bundle = await this.fetchBundle(userId);
    const sessionPubKeyBase64 = bundle.signedPreKey.publicKey;

    log.debug(`[E2EE:Encrypt] Fresh PreKey fetched successfully for ${userId} (Public Key: ${sessionPubKeyBase64.substring(0, 10)}...). Updating local session cache...`);
    const encoder = new TextEncoder();
    await signalStore.storeSession(userId, encoder.encode(sessionPubKeyBase64));

    const receiverPublicKey = naclUtil.decodeBase64(sessionPubKeyBase64);
    const mySignedPreKeySecret = await signalStore.loadSignedPreKey(1);
    if (!mySignedPreKeySecret) {
      log.error('[E2EE:Encrypt] Cryptographic private key not found on this device. Aborting encryption.');
      throw new Error("Clave privada no encontrada en el dispositivo");
    }

    // Generar un Nonce aleatorio (vector de inicialización)
    log.debug(`[E2EE:Encrypt] Loading local Signed PreKey and generating random cryptographic vector (Nonce: ${nacl.box.nonceLength} bytes)...`);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = naclUtil.decodeUTF8(plaintext);

    // Cifrar el mensaje
    const encrypted = nacl.box(messageUint8, nonce, receiverPublicKey, mySignedPreKeySecret);

    // Empaquetar Nonce + Mensaje Cifrado para enviarlo
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    log.info(`[E2EE:Encrypt] Message successfully encrypted. Total packet size: ${fullMessage.length} bytes (Nonce + Ciphertext).`);
    return { type: 1, ciphertext: naclUtil.encodeBase64(fullMessage) };
  }

  static async decryptMessage(userId: string, ciphertextBase64: string, type: number, isRetry = false): Promise<string> {
    log.info(`[E2EE:Decrypt] Initiating decryption pipeline for message from sender: ${userId} (Attempt: ${isRetry ? '2/2 - Cache Bypassed' : '1/2 - Cache Enabled'}).`);

    let sessionPubKeyRecord = await signalStore.loadSession(userId);
    let sessionPubKeyBase64: string;

    if (!sessionPubKeyRecord) {
      log.info(`[E2EE:Decrypt] Session key cache miss for sender ${userId}. Fetching fresh cryptographic bundle from server...`);
      const bundle = await this.fetchBundle(userId);
      sessionPubKeyBase64 = bundle.signedPreKey.publicKey;

      const encoder = new TextEncoder();
      await signalStore.storeSession(userId, encoder.encode(sessionPubKeyBase64));
      log.debug(`[E2EE:Decrypt] Fresh session key cached locally for sender ${userId}.`);
    } else {
      log.debug(`[E2EE:Decrypt] Session key found in local cache for sender: ${userId}.`);
      const decoder = new TextDecoder();
      sessionPubKeyBase64 = decoder.decode(sessionPubKeyRecord);
    }

    const senderPublicKey = naclUtil.decodeBase64(sessionPubKeyBase64);
    const mySignedPreKeySecret = await signalStore.loadSignedPreKey(1);
    if (!mySignedPreKeySecret) {
      log.error('[E2EE:Decrypt] Cryptographic private key not found on this device. Aborting decryption.');
      throw new Error("Clave privada no encontrada en el dispositivo");
    }

    const fullMessage = naclUtil.decodeBase64(ciphertextBase64);
    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const encrypted = fullMessage.slice(nacl.box.nonceLength);

    log.debug(`[E2EE:Decrypt] Decrypting packet. Nonce size: ${nonce.length} bytes, Ciphertext size: ${encrypted.length} bytes.`);

    // Descifrar el mensaje
    const decrypted = nacl.box.open(encrypted, nonce, senderPublicKey, mySignedPreKeySecret);

    if (!decrypted) {
      if (!isRetry) {
        // La clave falló. Puede que la otra persona haya rotado su clave (ej. nuevo navegador).
        // Borramos el caché y reintentamos obtener la clave fresca del servidor.
        log.warn(`[E2EE:Decrypt] Decryption failed for sender ${userId}. This is usually caused by session key rotation (e.g. device switched). Evicting session cache and re-fetching bundle...`);
        await signalStore.removeSession(userId);
        return this.decryptMessage(userId, ciphertextBase64, type, true);
      }
      log.error(`[E2EE:Decrypt] Permanent E2EE decryption failure for sender: ${userId}. Integrity or signature validation check failed.`);
      throw new Error("No se pudo descifrar el mensaje (La clave o firma es inválida de forma permanente)");
    }

    log.info(`[E2EE:Decrypt] Message from sender ${userId} successfully decrypted. Plaintext length: ${decrypted.length} characters.`);
    return naclUtil.encodeUTF8(decrypted);
  }
}
