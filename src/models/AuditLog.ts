import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  username: string;
  role: string;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT';
  timestamp: Date;
  ipAddress?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
}

const AuditLogSchema: Schema<IAuditLog> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true, index: true },
  role: { type: String, required: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: Schema.Types.ObjectId },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT'],
    required: true,
    index: true,
  },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String },
  oldValues: { type: Schema.Types.Mixed },
  newValues: { type: Schema.Types.Mixed },
  changedFields: [{ type: String }],
});

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
