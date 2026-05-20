import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // For MVP, we save to public/uploads directory.
  // In production with STORAGE_ACCESS_KEY, we would upload to S3/Cloudinary here.
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const extension = file.name.split('.').pop() || 'png';
  const filename = `${uuidv4()}.${extension}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`;
}
