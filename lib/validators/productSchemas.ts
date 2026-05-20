import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(10, 'Description should be at least 10 characters'),
  price: z.coerce.number().min(100, 'Price must be at least 1 NGN'), // assuming frontend passes NGN, we convert to kobo later or vice versa. Let's say user inputs NGN.
  imageUrl: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
