'use server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { productSchema } from '@/lib/validators/productSchemas';
import { generateUniqueSlug } from '@/lib/slug';
import { revalidatePath } from 'next/cache';

export async function createProductAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: { message: 'Unauthorized' } };
    }

    const rawData = {
      name: formData.get('name') ?? undefined,
      description: formData.get('description') ?? undefined,
      price: formData.get('price'),
      imageUrl: formData.get('imageUrl') ?? undefined,
    };

    const result = productSchema.safeParse(rawData);

    if (!result.success) {
      return { ok: false, error: { message: result.error.issues[0].message } };
    }

    const data = result.data;
    const file = formData.get('image') as File | null;
    let finalImageUrl = data.imageUrl;

    if (file && file.size > 0) {
      const { uploadFile } = await import('@/lib/storage');
      finalImageUrl = await uploadFile(file);
    } else if (!finalImageUrl) {
      return { ok: false, error: { message: 'Image is required' } };
    }

    const uniqueSlug = await generateUniqueSlug(data.name);

    await prisma.product.create({
      data: {
        userId: (session.user as any).id,
        name: data.name,
        description: data.description,
        price: data.price * 100,
        imageUrl: finalImageUrl,
        uniqueSlug,
      },
    });

    revalidatePath('/products');
    return { ok: true, data: { slug: uniqueSlug } };
  } catch (error: any) {
    console.error('Failed to create product:', error);
    return { ok: false, error: { message: 'Something went wrong. Please try again later.' } };
  }
}

export async function completeOnboardingAction() {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: 'Unauthorized' };
    }
    const userId = (session.user as any).id;
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });
    return { ok: true };
  } catch (error) {
    console.error('completeOnboardingAction error:', error);
    return { ok: false, error: 'Something went wrong' };
  }
}

export async function updateProductAction(productId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: { message: 'Unauthorized' } };
    }

    const userId = (session.user as any).id;

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing || existing.userId !== userId) {
      return { ok: false, error: { message: 'Product not found' } };
    }

    const rawData = {
      name: formData.get('name') ?? undefined,
      description: formData.get('description') ?? undefined,
      price: formData.get('price'),
      imageUrl: formData.get('imageUrl') ?? undefined,
    };

    const result = productSchema.safeParse(rawData);
    if (!result.success) {
      return { ok: false, error: { message: result.error.issues[0].message } };
    }

    const data = result.data;
    const file = formData.get('image') as File | null;
    let finalImageUrl = data.imageUrl || existing.imageUrl;

    if (file && file.size > 0) {
      const { uploadFile } = await import('@/lib/storage');
      finalImageUrl = await uploadFile(file);
    }

    let uniqueSlug = existing.uniqueSlug;
    if (data.name !== existing.name) {
      uniqueSlug = await generateUniqueSlug(data.name);
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price * 100,
        imageUrl: finalImageUrl,
        uniqueSlug,
      },
    });

    revalidatePath('/products');
    revalidatePath(`/p/${uniqueSlug}`);
    return { ok: true, data: { slug: uniqueSlug } };
  } catch (error: any) {
    console.error('Failed to update product:', error);
    return { ok: false, error: { message: 'Something went wrong. Please try again later.' } };
  }
}
