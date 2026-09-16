import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Tell us your name").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[a-zA-Z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export const createBusinessSchema = z.object({
  name: z.string().min(2, "Business name is required").max(80),
  type: z.string().min(1).default("retail"),
  city: z.string().max(60).optional().or(z.literal("")),
  district: z.string().max(60).optional().or(z.literal("")),
  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[0-9+\-\s()]{9,20}$/.test(v), "Enter a valid phone number"),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(400).optional().or(z.literal("")),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
