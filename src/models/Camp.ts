import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICamp extends Document {
  name: string;
  code: string;
  center: string;
  district: string;
  mohArea: string;
  address: string;
  campDate: Date;
  organizedBy: string;
  status: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CampSchema: Schema<ICamp> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, trim: true },
    center: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    mohArea: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    campDate: { type: Date, required: true },
    organizedBy: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Planned', 'Active', 'Completed', 'Cancelled'],
      default: 'Planned',
    },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Camp: Model<ICamp> = mongoose.models.Camp || mongoose.model<ICamp>('Camp', CampSchema);

export default Camp;
