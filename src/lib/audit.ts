import mongoose from 'mongoose';
import AuditLog from '@/models/AuditLog';
import AuthLog from '@/models/AuthLog';
import { dbConnect } from './db';

interface AuditParams {
  userId?: string;
  username: string;
  role: string;
  entityType: string;
  entityId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT';
  ipAddress?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
}

export async function logAudit(params: AuditParams) {
  try {
    await dbConnect();
    const log = new AuditLog({
      userId: params.userId ? new mongoose.Types.ObjectId(params.userId) : undefined,
      username: params.username,
      role: params.role,
      entityType: params.entityType,
      entityId: params.entityId ? new mongoose.Types.ObjectId(params.entityId) : undefined,
      action: params.action,
      ipAddress: params.ipAddress,
      oldValues: params.oldValues,
      newValues: params.newValues,
      changedFields: params.changedFields,
      timestamp: new Date(),
    });
    await log.save();
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
}

interface AuthLogParams {
  username: string;
  userId?: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  action: 'LOGIN' | 'LOGOUT' | 'EXPIRE';
}

export async function logAuth(params: AuthLogParams) {
  try {
    await dbConnect();
    
    if (params.action === 'LOGIN') {
      const log = new AuthLog({
        username: params.username,
        userId: params.userId ? new mongoose.Types.ObjectId(params.userId) : undefined,
        loginTimestamp: new Date(),
        success: params.success,
        failureReason: params.failureReason,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
      });
      await log.save();
    } else if (params.action === 'LOGOUT' || params.action === 'EXPIRE') {
      // Find the latest active log for this user/session and update logout
      const query: Record<string, any> = { username: params.username, success: true };
      if (params.sessionId) {
        query.sessionId = params.sessionId;
      }
      
      const latestLog = await AuthLog.findOne(query).sort({ loginTimestamp: -1 });
      if (latestLog) {
        latestLog.logoutTimestamp = new Date();
        if (latestLog.loginTimestamp) {
          latestLog.sessionDuration = Math.round(
            (latestLog.logoutTimestamp.getTime() - latestLog.loginTimestamp.getTime()) / 1000
          );
        }
        await latestLog.save();
      }
    }
  } catch (error) {
    console.error('Failed to save auth log:', error);
  }
}
