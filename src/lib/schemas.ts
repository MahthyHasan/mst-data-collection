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
