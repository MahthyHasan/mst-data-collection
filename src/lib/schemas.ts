import { z } from 'zod';

export const ASSESSMENT_MODULES = ['checkup', 'fall', 'gds', 'minicog', 'adl', 'iadl'] as const;
export type AssessmentModule = (typeof ASSESSMENT_MODULES)[number];

export const assessmentModuleSchema = z.enum(ASSESSMENT_MODULES);

export const campSectionSchema = z.object({
  label: z.string().min(1).max(100),
  modules: z.array(assessmentModuleSchema).min(1),
});

export const campSectionsSchema = z.array(campSectionSchema);

export const stationLabelSchema = z.string().min(1).max(100).optional();

export const assessmentBaseSchema = z.object({
  patientId: z.string().min(1),
  campId: z.string().min(1),
  stationLabel: stationLabelSchema,
});

export const MODULE_LABELS: Record<AssessmentModule, string> = {
  checkup: 'Medical Check-up',
  fall: 'Fall Risk',
  gds: 'GDS-15',
  minicog: 'Mini-Cog',
  adl: 'ADL (Barthel)',
  iadl: 'IADL (Lawton)',
};

export const patientSchema = z.object({
  fullName: z.string().min(1),
  dob: z.coerce.date(),
  age: z.number().int().positive(),
  gender: z.enum(['Male', 'Female', 'Other']),
  nic: z.string().min(1),
  maritalStatus: z.enum(['Single', 'Married', 'Widowed', 'Divorced', 'Other']),
  contactNumber: z.string().min(1),
  campId: z.string().min(1),

  // Extended fields (optional/nullable to prevent breaking changes)
  currentHealthIssues: z.object({
    urinaryIncontinence: z.boolean().default(false),
    constipation: z.boolean().default(false),
    other: z.string().optional().nullable(),
  }).optional(),

  betelChewing: z.boolean().default(false).optional(),

  livingStatus: z.enum(['with_spouse', 'with_family', 'with_caregiver', 'alone', 'care_home', 'other']).optional().nullable(),
  livingStatusOther: z.string().optional().nullable(),

  independenceLevel: z.enum(['independent', 'dependent', 'bed_bound']).optional().nullable(),
  outsideVisitFrequency: z.enum(['more_than_3_per_week', 'once_per_week', 'once_per_month', 'rarely', 'never']).optional().nullable(),

  spiritual: z.object({
    religion: z.string().optional().nullable(),
    attachment: z.enum(['well', 'moderate', 'mild', 'none']).optional().nullable(),
  }).optional(),

  financial: z.object({
    monthlyIncomeBracket: z.enum(['below_10000', '10000_25000', '25000_50000', 'above_50000']).optional().nullable(),
    incomeSource: z.array(z.enum(['employed', 'self_employed', 'pension', 'asvesuma', 'religious_ngo', 'family_support', 'dependent_on_family'])).optional(),
  }).optional(),

  vision: z.object({
    usesSpectacles: z.boolean().default(false),
    dmHtnComplicated: z.boolean().default(false),
    cataractDone: z.boolean().default(false),
    notAttended: z.boolean().default(false),
    snellenRight: z.string().optional().nullable(),
    snellenLeft: z.string().optional().nullable(),
  }).optional(),

  hearing: z.object({
    usesHearingAid: z.boolean().default(false),
    whisperTestResult: z.enum(['normal', 'impaired', 'not_tested']).optional().nullable(),
  }).optional(),
});

