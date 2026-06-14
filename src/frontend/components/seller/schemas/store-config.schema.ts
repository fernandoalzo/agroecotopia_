import { z } from "zod";

export const createStoreConfigSchema = (t: any) => {
  return z.object({
    paymentMethods: z.object({
      advisor: z.object({
        enabled: z.boolean(),
        instructions: z.string().optional(),
      }),
      mercadopago: z.object({
        enabled: z.boolean(),
        accessToken: z.string().optional(),
        secret: z.string().optional(),
      }),
      crypto: z.object({
        enabled: z.boolean(),
        currencies: z.array(z.object({
          id: z.string().optional(),
          name: z.string(),
          logo: z.string().optional(),
          addresses: z.array(z.string().min(1, "La dirección no puede estar vacía")).min(1, "Debes agregar al menos una dirección"),
        })).optional().default([]),
      }).optional(),
    }).optional(),
    shippingMethods: z.object({
      delivery: z.object({
        enabled: z.boolean(),
      }),
      pickup: z.object({
        enabled: z.boolean(),
      }),
    }).optional(),
  });
};

export type StoreConfigFormValues = z.infer<ReturnType<typeof createStoreConfigSchema>>;
