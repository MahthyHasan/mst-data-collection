import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGdsAssessment extends Document {
  patientId: mongoose.Types.ObjectId;
  campId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  responses: boolean[]; // Array of 15 elements: true for 'Yes', false for 'No'
  totalScore: number;
  classification: 'Normal' | 'Mild Depression' | 'Moderate Depression' | 'Severe Depression';
  createdAt: Date;
  updatedAt: Date;
}

const GdsAssessmentSchema: Schema<IGdsAssessment> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    responses: { type: [Boolean], required: true },
    totalScore: { type: Number, required: true },
    classification: {
      type: String,
      enum: ['Normal', 'Mild Depression', 'Moderate Depression', 'Severe Depression'],
      required: true,
    },
  },
  { timestamps: true }
);

const GdsAssessment: Model<IGdsAssessment> =
  mongoose.models.GdsAssessment || mongoose.model<IGdsAssessment>('GdsAssessment', GdsAssessmentSchema);

export default GdsAssessment;
