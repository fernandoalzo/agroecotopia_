import { z } from "zod";

export const CheckoutSchema = z.object({
  fullName: z.string().min(3, { message: "Name must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(7, { message: "Phone number must be at least 7 characters" }),
  tipoEntrega: z.enum(["ENVIO", "RECOJO_EN_BODEGA"]),
  address: z.string().optional(),
  city: z.string().min(2, { message: "City must be at least 2 characters" }),
  bodegaId: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["advisor", "nequi", "mercadopago", "pse", "wompi"]),
}).refine(
  (data) => {
    if (data.tipoEntrega === "ENVIO") {
      return !!data.address && data.address.length >= 5;
    }
    return true;
  },
  {
    message: "Address must be at least 5 characters",
    path: ["address"],
  }
).refine(
  (data) => {
    if (data.tipoEntrega === "RECOJO_EN_BODEGA") {
      return !!data.bodegaId;
    }
    return true;
  },
  {
    message: "Debes seleccionar una bodega para recoger el pedido",
    path: ["bodegaId"],
  }
);

export type CheckoutValues = z.infer<typeof CheckoutSchema>;
