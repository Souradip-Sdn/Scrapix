import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().min(8).max(18),
  password: z.string().min(8).max(72),
  customerType: z.enum(["individual", "organization"]).default("individual"),
  companyName: z.string().trim().max(120).optional(),
  orgType: z.enum(["private", "government"]).optional(),
  gstNumber: z.string().trim().max(30).optional(),
  address: z.string().trim().min(3, "Address is required").max(300),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Must be a 6-digit PIN code"),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
}).refine((data) => {
  if (data.customerType === "organization") {
    return !!data.companyName && !!data.orgType && !!data.gstNumber;
  }
  return true;
}, {
  message: "Organization details are required",
  path: ["companyName"]
});

export const estimateSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  weightKg: z.coerce.number().positive().max(100000),
});

export const pickupSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  weightKg: z.coerce.number().positive().max(100000),
  address: z.string().trim().min(10).max(300),
  city: z.string().trim().min(2).max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  preferredDate: z.string().min(10),
  notes: z.string().trim().max(500).optional().default(""),
});

export const partnerSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  businessType: z.enum([
    "retailer",
    "installer",
    "distributor",
    "collector",
    "recycler",
  ]),
  gstNumber: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().min(10).max(300),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  monthlyCapacityKg: z.coerce.number().positive().max(10000000),
  serviceRadiusKm: z.coerce.number().positive().max(1000),
});

export const pickupStatusSchema = z.object({
  status: z.enum([
    "pending",
    "scheduled",
    "collected",
    "completed",
    "cancelled",
  ]),
});

export const partnerDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
