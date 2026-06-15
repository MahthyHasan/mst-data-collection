import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdlAssessment extends Document {
  patientId: mongoose.Types.ObjectId;
  campId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  
  // Barthel Index items
  feeding: number;
  bathing: number;
  grooming: number;
  dressing: number;
  bowelBladder: number; // Bowels & Bladder combined or split (we'll store it as numeric value)
  toiletUse: number;
  transfers: number;
  mobility: number;
  stairsMobility: number;
  
  totalScore: number; // 0-100
  classification: 'Total Dependence' | 'Severe Dependence' | 'Moderate Dependence' | 'Slight Dependence' | 'Independent';
  createdAt: Date;
  updatedAt: Date;
}

const AdlAssessmentSchema: Schema<IAdlAssessment> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    feeding: { type: Number, required: true },
    bathing: { type: Number, required: true },
    grooming: { type: Number, required: true },
    dressing: { type: Number, required: true },
    bowelBladder: { type: Number, required: true },
    toiletUse: { type: Number, required: true },
    transfers: { type: Number, required: true },
    mobility: { type: Number, required: true },
    stairsMobility: { type: Number, required: true },
    totalScore: { type: Number, required: true, min: 0, max: 100 },
    classification: {
      type: String,
      enum: ['Total Dependence', 'Severe Dependence', 'Moderate Dependence', 'Slight Dependence', 'Independent'],
      required: true,
    },
  },
  { timestamps: true }
);

const AdlAssessment: Model<IAdlAssessment> =
  mongoose.models.AdlAssessment || mongoose.model<IAdlAssessment>('AdlAssessment', AdlAssessmentSchema);

export default AdlAssessment;
