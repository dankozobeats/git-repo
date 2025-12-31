// Schémas de validation Zod pour les API routes
import { z } from 'zod';

// ============ CATEGORIES ============
export const CreateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Format de couleur invalide (ex: #FF5733)')
    .nullable()
    .optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// ============ HABITS ============
export const CreateHabitSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .nullable()
    .optional(),
  type: z.enum(['good', 'bad'], {
    errorMap: () => ({ message: 'Le type doit être "good" ou "bad"' }),
  }),
  icon: z.string()
    .max(10, 'L\'icône ne peut pas dépasser 10 caractères')
    .nullable()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Format de couleur invalide')
    .nullable()
    .optional(),
  tracking_mode: z.enum(['binary', 'counter']).default('binary'),
  daily_goal_value: z.number()
    .int('La valeur doit être un entier')
    .min(1, 'La valeur doit être au moins 1')
    .max(1000, 'La valeur ne peut pas dépasser 1000')
    .nullable()
    .optional(),
  category_id: z.string().uuid('ID de catégorie invalide').nullable().optional(),
});

export const UpdateHabitSchema = CreateHabitSchema.partial();

// ============ COACH / AI ============
export const CoachRequestSchema = z.object({
  habitId: z.string()
    .uuid('ID d\'habitude invalide')
    .min(1, 'habitId est requis'),
  tone: z.enum(['supportive', 'balanced', 'sarcastic']).default('balanced'),
  focus: z.enum(['mindset', 'patterns', 'motivation']).default('mindset'),
  stats: z.object({
    totalCount: z.number().int().min(0).optional(),
    last7DaysCount: z.number().int().min(0).optional(),
    currentStreak: z.number().int().min(0).optional(),
    todayCount: z.number().int().min(0).optional(),
    monthPercentage: z.number().min(0).max(100).optional(),
  }).optional(),
});

// ============ REMINDERS ============
export const CreateReminderSchema = z.object({
  habit_id: z.string().uuid('ID d\'habitude invalide').nullable().optional(),
  time_local: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Format de date invalide (ISO 8601 requis)'),
  timezone: z.string()
    .min(1, 'Timezone requis')
    .max(50, 'Timezone trop long'),
  weekday: z.number()
    .int('Le jour doit être un entier')
    .min(0, 'Le jour doit être entre 0 et 6')
    .max(6, 'Le jour doit être entre 0 et 6')
    .nullable()
    .optional(),
  channel: z.enum(['push', 'email']).default('push'),
  schedule: z.enum(['once', 'daily']).default('daily'),
  active: z.boolean().default(true),
});

// ============ WEEKLY REPORT ============
export const WeeklyReportSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
});

// ============ TYPES ============
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;
export type CoachRequestInput = z.infer<typeof CoachRequestSchema>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export type WeeklyReportInput = z.infer<typeof WeeklyReportSchema>;
