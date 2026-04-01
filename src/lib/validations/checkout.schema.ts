import { z } from "zod";

export const CheckoutSchema = z.object({
  fullName: z.string().min(3, { message: "Name must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(7, { message: "Phone number must be at least 7 characters" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  city: z.string().min(2, { message: "City must be at least 2 characters" }),
  notes: z.string().optional(),
  paymentMethod: z.enum(["whatsapp", "nequi", "mercadopago", "pse", "wompi"]),
});

export type CheckoutValues = z.infer<typeof CheckoutSchema>;
