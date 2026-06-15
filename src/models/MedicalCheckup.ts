import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedicalCheckup extends Document {
  patientId: mongoose.Types.ObjectId;
  campId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  stationLabel?: string;
  height: number; // in meters
  weight: number; // in kg
  waistCircumference: number; // in cm
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  randomBloodSugar: number; // in mg/dL
  visionAssessmentNotes?: string;
  hearingAssessmentNotes?: string;
  bmi: number;
  bmiClassification: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  createdAt: Date;
  updatedAt: Date;
}

const MedicalCheckupSchema: Schema<IMedicalCheckup> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stationLabel: { type: String, trim: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    waistCircumference: { type: Number, required: true },
    bloodPressureSystolic: { type: Number, required: true },
    bloodPressureDiastolic: { type: Number, required: true },
    randomBloodSugar: { type: Number, required: true },
    visionAssessmentNotes: { type: String },
    hearingAssessmentNotes: { type: String },
    bmi: { type: Number, required: true },
    bmiClassification: {
      type: String,
      enum: ['Underweight', 'Normal', 'Overweight', 'Obese'],
      required: true,
    },
  },
  { timestamps: true }
);

const MedicalCheckup: Model<IMedicalCheckup> =
  mongoose.models.MedicalCheckup || mongoose.model<IMedicalCheckup>('MedicalCheckup', MedicalCheckupSchema);

export default MedicalCheckup;
