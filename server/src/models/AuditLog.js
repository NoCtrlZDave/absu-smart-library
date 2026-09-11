import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: null },
    role: { type: String, default: null },
    action: { type: String, required: true, index: true },
    entity: { type: String, default: null },
    entityId: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;