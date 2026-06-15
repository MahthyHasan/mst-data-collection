import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAllergy {
  type: string;
  description: string;
}

export interface ISurgery {
  event: string;
  date?: string;
  notes?: string;
}

export interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface IPatient extends Document {
  fullName: string;
  age: number;
  dob: Date;
  gender: 'Male' | 'Female' | 'Other';
  nic: string;
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Other';
  contactNumber: string;
  campId: mongoose.Types.ObjectId;
  registeredBy: mongoose.Types.ObjectId;
  
  // Health details
  urinaryIncontinence: boolean;
  constipation: boolean;
  freeTextIssues?: string;
  
  allergies: IAllergy[];
  medicalConditions: string[];
  customMedicalConditions?: string;
  
  surgeries: ISurgery[];
  medications: IMedication[];
  
  visionProblems: 'None' | 'Normal' | 'Refractive Error' | 'Cataract' | 'Glaucoma' | 'Blurred Vision' | 'Other';
  hearingProblems: 'None' | 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Hearing Aid User';
  
  // Functional Status
  walkIndependently: boolean;
  walkingAids: string[];
  needsAssistanceWith: string[];
  historyOfFalls: boolean;
  functionalNotes?: string;
  
  // Mental/Cognitive
  memoryProblems: boolean;
  dementiaDiagnosis: boolean;
  alzheimersDiagnosis: boolean;
  depressionSymptoms: boolean;
  anxietySymptoms: boolean;
  cognitiveNotes?: string;
  
  // Lifestyle
  smokingHistory: 'Never' | 'Former' | 'Current';
  alcoholUse: 'Never' | 'Occasional' | 'Regular';
  exerciseHabits?: string;
  dietaryHabits?: string;
  
  // Social
  livesAlone: boolean;
  livesWithFamily: boolean;
  caregiverMaintained: boolean;
  caregiverName?: string;
  caregiverContact?: string;
  socialNotes?: string;
  
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema<IPatient> = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    nic: { type: String, required: true, index: true },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Widowed', 'Divorced', 'Other'], required: true },
    contactNumber: { type: String, required: true, trim: true },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', required: true },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    urinaryIncontinence: { type: Boolean, default: false },
    constipation: { type: Boolean, default: false },
    freeTextIssues: { type: String },
    
    allergies: [
      {
        type: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    medicalConditions: [{ type: String }],
    customMedicalConditions: { type: String },
    
    surgeries: [
      {
        event: { type: String, required: true },
        date: { type: String },
        notes: { type: String },
      },
    ],
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
      },
    ],
    
    visionProblems: { type: String, enum: ['None', 'Normal', 'Refractive Error', 'Cataract', 'Glaucoma', 'Blurred Vision', 'Other'], default: 'None' },
    hearingProblems: { type: String, enum: ['None', 'Normal', 'Mild', 'Moderate', 'Severe', 'Hearing Aid User'], default: 'None' },
    
    walkIndependently: { type: Boolean, default: true },
    walkingAids: [{ type: String }],
    needsAssistanceWith: [{ type: String }],
    historyOfFalls: { type: Boolean, default: false },
    functionalNotes: { type: String },
    
    memoryProblems: { type: Boolean, default: false },
    dementiaDiagnosis: { type: Boolean, default: false },
    alzheimersDiagnosis: { type: Boolean, default: false },
    depressionSymptoms: { type: Boolean, default: false },
    anxietySymptoms: { type: Boolean, default: false },
    cognitiveNotes: { type: String },
    
    smokingHistory: { type: String, enum: ['Never', 'Former', 'Current'], default: 'Never' },
    alcoholUse: { type: String, enum: ['Never', 'Occasional', 'Regular'], default: 'Never' },
    exerciseHabits: { type: String },
    dietaryHabits: { type: String },
    
    livesAlone: { type: Boolean, default: false },
    livesWithFamily: { type: Boolean, default: false },
    caregiverMaintained: { type: Boolean, default: false },
    caregiverName: { type: String },
    caregiverContact: { type: String },
    socialNotes: { type: String },
    
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// We index NIC but also compound-index nic and isDeleted to help enforce uniqueness checks
PatientSchema.index({ nic: 1, isDeleted: 1 });

const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
