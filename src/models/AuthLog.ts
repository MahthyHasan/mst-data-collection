import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthLog extends Document {
  username: string;
  userId?: mongoose.Types.ObjectId;
  loginTimestamp?: Date;
  logoutTimestamp?: Date;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  sessionDuration?: number; // in seconds
}

const AuthLogSchema: Schema<IAuthLog> = new Schema({
  username: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  loginTimestamp: { type: Date, index: true },
  logoutTimestamp: { type: Date },
  success: { type: Boolean, required: true, index: true },
  failureReason: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  sessionId: { type: String, index: true },
  sessionDuration: { type: Number },
});

const AuthLog: Model<IAuthLog> =
  mongoose.models.AuthLog || mongoose.model<IAuthLog>('AuthLog', AuthLogSchema);

export default AuthLog;
