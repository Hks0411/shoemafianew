import { prisma } from "@/lib/db";

export async function audit(input: {
  adminId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  detail?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      adminId: input.adminId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      detail: input.detail ? JSON.stringify(input.detail) : undefined,
    },
  });
}
