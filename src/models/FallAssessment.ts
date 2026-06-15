import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFallAssessment extends Document {
  patientId: mongoose.Types.ObjectId;
  campId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  stationLabel?: string;
  
  // Legacy / backup simple fields
  age65OrOlder: boolean;
  fallHistory6Months: boolean;
  takingFourOrMoreMedications: boolean;
  psychoactiveMedications: boolean;
  abnormalGait: boolean;
  usesAssistiveDevice: boolean;
  impairedBalance: boolean;
  visionImpairment: boolean;
  riskScore: number;
  riskClassification: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  
  // Full FRAT Fields
  part1?: {
    recentFalls: number;
    medications: number;
    psychological: number;
    cognitiveStatus: number;
    totalScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    automaticHighRisk: {
      functionalStatusChange: boolean;
      dizzinessPosturalHypotension: boolean;
    };
  };
  
  part2Checklist?: {
    vision: boolean;
    mobility: boolean;
    transfers: boolean;
    behaviours: boolean;
    adlRiskBehaviours: boolean;
    unsafeEquipmentUse: boolean;
    unsafeFootwear: boolean;
    environmentalDifficulties: boolean;
    nutrition: boolean;
    continence: boolean;
    otherRisk?: string;
  };

  fallHistory?: {
    timeAgo?: string;
    mechanism?: 'trip' | 'slip' | 'lost_balance' | 'collapse' | 'legs_gave_way' | 'dizziness' | 'unknown';
    location?: string;
  }[];

  actionPlan?: {
    problem?: string;
    interventionStrategy?: string;
    referral?: string;
  }[];

  plannedReviewDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const FallAssessmentSchema: Schema<IFallAssessment> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stationLabel: { type: String, trim: true },
    
    // Legacy simple fields (keep optional or default to prevent errors)
    age65OrOlder: { type: Boolean, default: false },
    fallHistory6Months: { type: Boolean, default: false },
    takingFourOrMoreMedications: { type: Boolean, default: false },
    psychoactiveMedications: { type: Boolean, default: false },
    abnormalGait: { type: Boolean, default: false },
    usesAssistiveDevice: { type: Boolean, default: false },
    impairedBalance: { type: Boolean, default: false },
    visionImpairment: { type: Boolean, default: false },
    riskScore: { type: Number, required: true },
    riskClassification: {
      type: String,
      enum: ['Low Risk', 'Moderate Risk', 'High Risk'],
      required: true,
    },
    
    // Extended FRAT schema
    part1: {
      recentFalls: { type: Number, enum: [2, 4, 6, 8] },
      medications: { type: Number, enum: [1, 2, 3, 4] },
      psychological: { type: Number, enum: [1, 2, 3, 4] },
      cognitiveStatus: { type: Number, enum: [1, 2, 3, 4] },
      totalScore: { type: Number },
      riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
      automaticHighRisk: {
        functionalStatusChange: { type: Boolean, default: false },
        dizzinessPosturalHypotension: { type: Boolean, default: false }
      }
    },
    
    part2Checklist: {
      vision: { type: Boolean, default: false },
      mobility: { type: Boolean, default: false },
      transfers: { type: Boolean, default: false },
      behaviours: { type: Boolean, default: false },
      adlRiskBehaviours: { type: Boolean, default: false },
      unsafeEquipmentUse: { type: Boolean, default: false },
      unsafeFootwear: { type: Boolean, default: false },
      environmentalDifficulties: { type: Boolean, default: false },
      nutrition: { type: Boolean, default: false },
      continence: { type: Boolean, default: false },
      otherRisk: { type: String }
    },
    
    fallHistory: [
      {
        timeAgo: { type: String },
        mechanism: { type: String, enum: ['trip', 'slip', 'lost_balance', 'collapse', 'legs_gave_way', 'dizziness', 'unknown'] },
        location: { type: String }
      }
    ],
    
    actionPlan: [
      {
        problem: { type: String },
        interventionStrategy: { type: String },
        referral: { type: String }
      }
    ],
    
    plannedReviewDate: { type: Date }
  },
  { timestamps: true }
);


const FallAssessment: Model<IFallAssessment> =
  mongoose.models.FallAssessment || mongoose.model<IFallAssessment>('FallAssessment', FallAssessmentSchema);

export default FallAssessment;
