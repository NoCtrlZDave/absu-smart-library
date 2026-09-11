import AuditLog from '../models/AuditLog.js';

export const logActivity = async ({ actor, action, entity, entityId, details }) => {
  try {
    await AuditLog.create({
      actor: actor?._id || actor || null,
      actorName: actor
        ? `${actor.first_name || ''} ${actor.last_name || ''}`.trim()
        : null,
      role: actor?.role || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      details,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

export default logActivity;