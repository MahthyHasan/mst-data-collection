import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIadlAssessment extends Document {
  patientId: mongoose.Types.ObjectId;
  campId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  stationLabel?: string;

  // Lawton IADL items (0 or 1 point each)
  phone: number;
  shopping: number;
  foodPrep: number;
  housekeeping: number;
  laundry: number;
  transport: number;
  medications: number;
  finances: number;
  
  totalScore: number; // 0-8 (legacy/backward compatibility)
  rawScore?: number;
  maxScore?: number;
  gender?: string;
  impaired?: boolean;
  classification: 'Functional Impairment' | 'Independent';
  createdAt: Date;
  updatedAt: Date;
}

const IadlAssessmentSchema: Schema<IIadlAssessment> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stationLabel: { type: String, trim: true },
    phone: { type: Number, required: true },
    shopping: { type: Number, required: true },
    foodPrep: { type: Number, required: true },
    housekeeping: { type: Number, required: true },
    laundry: { type: Number, required: true },
    transport: { type: Number, required: true },
    medications: { type: Number, required: true },
    finances: { type: Number, required: true },
    totalScore: { type: Number, required: true, min: 0, max: 8 },
    rawScore: { type: Number },
    maxScore: { type: Number },
    gender: { type: String },
    impaired: { type: Boolean, default: false },
    classification: {
      type: String,
      enum: ['Functional Impairment', 'Independent'],
      required: true,
    },
  },
  { timestamps: true }
);

const IadlAssessment: Model<IIadlAssessment> =
  mongoose.models.IadlAssessment || mongoose.model<IIadlAssessment>('IadlAssessment', IadlAssessmentSchema);

export default IadlAssessment;
