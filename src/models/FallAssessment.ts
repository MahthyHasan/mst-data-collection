import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFallAssessment extends Document {
  patientId: mongoose.Types.ObjectId;
  campId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const FallAssessmentSchema: Schema<IFallAssessment> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  },
  { timestamps: true }
);

const FallAssessment: Model<IFallAssessment> =
  mongoose.models.FallAssessment || mongoose.model<IFallAssessment>('FallAssessment', FallAssessmentSchema);

export default FallAssessment;
