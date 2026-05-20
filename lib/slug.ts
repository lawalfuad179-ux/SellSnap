import prisma from './db';

export async function generateUniqueSlug(name: string): Promise<string> {
  // Normalize: lowercase, replace spaces with hyphens, remove non-alphanumeric (except hyphens)
  const baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with a single one
    .replace(/^-|-$/g, ''); // Trim hyphens from start and end

  let uniqueSlug = baseSlug;
  let counter = 1;

  // Ensure uniqueness in the database
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { uniqueSlug },
    });

    if (!existing) {
      break;
    }

    // Collision detected, append a random suffix (similar to cuid slice)
    // Using simple random string for brevity, but could use nano-id or cuid
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    uniqueSlug = `${baseSlug}-${randomSuffix}`;
    counter++;
    
    // Fallback if we hit a loop (very unlikely with random suffix)
    if (counter > 10) {
      uniqueSlug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return uniqueSlug;
}
