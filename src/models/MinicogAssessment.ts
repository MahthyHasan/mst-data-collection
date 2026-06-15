import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMinicogAssessment extends Document {
  patientId: mongoose.Types.ObjectId;
  campId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  recallScore: number; // 0-3
  clockDrawingScore: number; // 0 or 2
  totalScore: number; // 0-5
  outcome: 'Normal Screening' | 'Possible Cognitive Impairment';
  createdAt: Date;
  updatedAt: Date;
}

const MinicogAssessmentSchema: Schema<IMinicogAssessment> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recallScore: { type: Number, required: true, min: 0, max: 3 },
    clockDrawingScore: { type: Number, required: true, enum: [0, 2] },
    totalScore: { type: Number, required: true, min: 0, max: 5 },
    outcome: {
      type: String,
      enum: ['Normal Screening', 'Possible Cognitive Impairment'],
      required: true,
    },
  },
  { timestamps: true }
);

const MinicogAssessment: Model<IMinicogAssessment> =
  mongoose.models.MinicogAssessment || mongoose.model<IMinicogAssessment>('MinicogAssessment', MinicogAssessmentSchema);

export default MinicogAssessment;
