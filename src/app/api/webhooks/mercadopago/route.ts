import { NextResponse } from "next/server";
import { paymentsService } from "@/backend/modules/payments";

export async function POST(request: Request) {
  try {
    // 1. Obtener el ID de pago de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    let paymentId = searchParams.get("data.id") || searchParams.get("id");
    let topic = searchParams.get("type") || searchParams.get("topic");

    // 2. Si no están en la URL, intentar obtener del cuerpo JSON
    if (!paymentId) {
      try {
        const body = await request.json();
        paymentId = body.data?.id || body.id;
        topic = body.type || body.action;
      } catch (err) {
        // El cuerpo puede no ser JSON o estar vacío
      }
    }

    console.log(`MercadoPago Webhook recibido: id=${paymentId}, tipo/tópico=${topic}`);

    // Solo procesamos eventos relacionados con pagos ("payment")
    // MercadoPago también notifica sobre "merchant_order" u otros tópicos
    if (paymentId && (topic === "payment" || topic === "payment.created" || topic === "payment.updated" || topic === "payment.updated")) {
      const result = await paymentsService.processNotification(String(paymentId));
      return NextResponse.json(result);
    }

    // Retornamos 200 OK para confirmar recepción de cualquier otro webhook y evitar reintentos infinitos
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error en Ruta de Webhook:", error);
    // MercadoPago requiere una respuesta exitosa (incluso si falló el procesamiento)
    // para evitar que reintente infinitamente. Sin embargo, devolvemos 500 en desarrollo
    // si el error es grave para alertar al desarrollador, o 200 si queremos silenciarlo.
    // Retornamos 200 para evitar bloqueos del webhook, pero registrando el error.
    return NextResponse.json(
      { error: error.message || "Internal Server Error", processed: false },
      { status: 200 }
    );
  }
}
