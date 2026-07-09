import { z } from 'zod';

export const uploadFileSchema = z.object({
  body: z.object({
    description: z.string().max(500, 'Description is too long').optional(),
    category: z.string().max(50, 'Category is too long').optional().default('other'),
    // Tags come as a JSON string array in multipart/form-data
    tags: z.string().optional().transform((val) => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.map(t => String(t).trim()).filter(Boolean);
        return [];
      } catch {
        // Fallback in case it's a comma-separated string
        return val.split(',').map(tag => tag.trim()).filter(Boolean);
      }
    }),
    // Booleans often come as strings like "true" or "false" in form-data
    isPublic: z.string().optional().transform((val) => {
      return val === 'true' || val === '1';
    }).default('false'),
  }),
});
