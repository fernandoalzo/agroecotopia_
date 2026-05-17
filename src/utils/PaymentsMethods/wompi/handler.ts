import { PaymentHandler, PaymentHandlerContext } from "../types";
import { toast } from "sonner";

export class WompiPaymentHandler implements PaymentHandler {
  async process({ clearCart, router, t }: PaymentHandlerContext): Promise<void> {
    clearCart();
    
    toast.success(t.checkout.processing, {
      description: t.checkout.paymentMuteNote,
    });
    
    setTimeout(() => {
      router.push("/");
    }, 3000);
  }
}
