import { z } from 'zod';

// Password validation with strong security requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email validation
export const emailSchema = z.string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase();

// User type validation
export const userTypeSchema = z.enum(['woman', 'child', 'guardian']);

// Age validation for COPPA compliance
export const ageSchema = z.number()
  .int('Age must be a whole number')
  .min(8, 'Users must be at least 8 years old')
  .max(120, 'Please enter a valid age');

// Date of birth validation
export const dateOfBirthSchema = z.string()
  .refine((date) => {
    const dob = new Date(date);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 8 && age <= 120;
  }, 'User must be between 8 and 120 years old');

// Name validation
export const nameSchema = z.string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Phone number validation (E.164 format)
export const phoneSchema = z.string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (e.g., +1234567890)')
  .optional();

// Bio validation
export const bioSchema = z.string()
  .trim()
  .max(500, 'Bio must be less than 500 characters')
  .optional();

// Location validation
export const locationSchema = z.string()
  .trim()
  .max(200, 'Location must be less than 200 characters')
  .optional();

// Emergency contact validation
export const emergencyContactSchema = z.object({
  contact_name: nameSchema,
  contact_phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
  contact_email: emailSchema.optional(),
  relationship: z.string()
    .trim()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship must be less than 50 characters'),
  is_primary: z.boolean().optional(),
});

// Sign up form validation
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  userType: userTypeSchema,
  age: ageSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Sign in form validation
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Profile setup validation
export const profileSetupSchema = z.object({
  full_name: nameSchema,
  date_of_birth: dateOfBirthSchema,
  phone_number: phoneSchema,
  bio: bioSchema,
  location: locationSchema,
});

// Content validation (for posts, messages)
export const contentSchema = z.string()
  .trim()
  .min(1, 'Content cannot be empty')
  .max(5000, 'Content must be less than 5000 characters');

// Title validation
export const titleSchema = z.string()
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters');
