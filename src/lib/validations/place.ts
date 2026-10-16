import { z } from 'zod';

export const PlaceSubmissionSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama tempat makan minimal 3 karakter')
    .max(100, 'Nama tempat makan maksimal 100 karakter')
    .trim(),
  featured_food: z
    .string()
    .min(3, 'Menu unggulan minimal 3 karakter')
    .max(100, 'Menu unggulan maksimal 100 karakter')
    .trim(),
  category: z
    .string()
    .min(1, 'Kategori kuliner wajib dipilih'),
  description: z
    .string()
    .min(15, 'Deskripsi minimal 15 karakter. Jelaskan cita rasa dan suasana tempat')
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .trim(),
  price_min: z.number().optional().nullable(),
  price_max: z.number().optional().nullable(),
  price_range: z.enum(['under_15k', '15k_30k', '30k_50k', 'above_50k', 'unknown']),
  address_text: z
    .string()
    .min(5, 'Nama area atau patokan alamat minimal 5 karakter')
    .max(250, 'Alamat maksimal 250 karakter')
    .trim(),
  latitude: z
    .number()
    .min(-90, 'Koordinat lintang tidak valid')
    .max(90, 'Koordinat lintang tidak valid'),
  longitude: z
    .number()
    .min(-180, 'Koordinat bujur tidak valid')
    .max(180, 'Koordinat bujur tidak valid'),
  contributor_name: z
    .string()
    .max(50, 'Nama kontributor maksimal 50 karakter')
    .optional()
    .nullable(),
  is_anonymous: z.boolean(),
  photos: z
    .array(z.string())
    .min(1, 'Minimal satu foto makanan atau tempat wajib diunggah')
    .max(5, 'Maksimal 5 foto per tempat makan'),
  // Honeypot field for bot protection
  website_honeypot: z.string().max(0, 'Bot submission rejected').optional(),
});

export type PlaceSubmissionInput = z.infer<typeof PlaceSubmissionSchema>;

export const ReportSubmissionSchema = z.object({
  place_id: z.string().uuid('ID tempat makan tidak valid'),
  reason: z.string().min(2, 'Alasan pelaporan wajib dipilih'),
  description: z.string().max(500, 'Keterangan tambahan maksimal 500 karakter').optional(),
  website_honeypot: z.string().max(0, 'Bot submission rejected').optional(),
});

export type ReportSubmissionInput = z.infer<typeof ReportSubmissionSchema>;

export const AdminPlaceStatusSchema = z.object({
  status: z.enum(['pending', 'published', 'rejected', 'hidden']),
});
