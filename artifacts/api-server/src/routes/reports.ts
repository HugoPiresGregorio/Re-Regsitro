import { Router, type IRouter } from "express";
import { db, reportsTable, foldersTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateReportBody, UpdateReportBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return req.session.userId;
}

router.get("/folders/:folderId/reports", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.folderId) ? req.params.folderId[0] : req.params.folderId;
  const folderId = parseInt(rawId, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!currentUser) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const [folder] = await db.select().from(foldersTable).where(eq(foldersTable.id, folderId));
  if (!folder) {
    res.status(404).json({ error: "Pasta não encontrada" });
    return;
  }

  if (currentUser.role !== "coordinator" && folder.ownerId !== userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const reports = await db
    .select({
      id: reportsTable.id,
      folderId: reportsTable.folderId,
      authorId: reportsTable.authorId,
      authorName: usersTable.name,
      title: reportsTable.title,
      content: reportsTable.content,
      type: reportsTable.type,
      createdAt: reportsTable.createdAt,
      updatedAt: reportsTable.updatedAt,
    })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.authorId, usersTable.id))
    .where(eq(reportsTable.folderId, folderId))
    .orderBy(desc(reportsTable.updatedAt));

  res.json(
    reports.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
});

router.post("/folders/:folderId/reports", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.folderId) ? req.params.folderId[0] : req.params.folderId;
  const folderId = parseInt(rawId, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!currentUser) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const [folder] = await db.select().from(foldersTable).where(eq(foldersTable.id, folderId));
  if (!folder) {
    res.status(404).json({ error: "Pasta não encontrada" });
    return;
  }

  // Only folder owner or coordinator can create reports in a folder
  if (currentUser.role !== "coordinator" && folder.ownerId !== userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      folderId,
      authorId: userId,
      title: parsed.data.title,
      content: parsed.data.content,
      type: parsed.data.type,
    })
    .returning();

  const author = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({
    ...report,
    authorName: author[0]?.name ?? "",
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  });
});

router.get("/reports/:reportId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const reportId = parseInt(rawId, 10);
  if (isNaN(reportId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!currentUser) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const rows = await db
    .select({
      id: reportsTable.id,
      folderId: reportsTable.folderId,
      authorId: reportsTable.authorId,
      authorName: usersTable.name,
      title: reportsTable.title,
      content: reportsTable.content,
      type: reportsTable.type,
      createdAt: reportsTable.createdAt,
      updatedAt: reportsTable.updatedAt,
      folderOwnerId: foldersTable.ownerId,
    })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.authorId, usersTable.id))
    .innerJoin(foldersTable, eq(reportsTable.folderId, foldersTable.id))
    .where(eq(reportsTable.id, reportId));

  if (!rows.length) {
    res.status(404).json({ error: "Relatório não encontrado" });
    return;
  }

  const report = rows[0];

  if (currentUser.role !== "coordinator" && report.folderOwnerId !== userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  res.json({
    id: report.id,
    folderId: report.folderId,
    authorId: report.authorId,
    authorName: report.authorName,
    title: report.title,
    content: report.content,
    type: report.type,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  });
});

router.put("/reports/:reportId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const reportId = parseInt(rawId, 10);
  if (isNaN(reportId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!currentUser) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const rows = await db
    .select({
      id: reportsTable.id,
      folderId: reportsTable.folderId,
      folderOwnerId: foldersTable.ownerId,
    })
    .from(reportsTable)
    .innerJoin(foldersTable, eq(reportsTable.folderId, foldersTable.id))
    .where(eq(reportsTable.id, reportId));

  if (!rows.length) {
    res.status(404).json({ error: "Relatório não encontrado" });
    return;
  }

  const report = rows[0];

  if (currentUser.role !== "coordinator" && report.folderOwnerId !== userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const parsed = UpdateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(reportsTable)
    .set({
      ...(parsed.data.title != null ? { title: parsed.data.title } : {}),
      ...(parsed.data.content != null ? { content: parsed.data.content } : {}),
      ...(parsed.data.type != null ? { type: parsed.data.type } : {}),
      updatedAt: new Date(),
    })
    .where(eq(reportsTable.id, reportId))
    .returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  res.json({
    ...updated,
    authorName: author?.name ?? "",
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/reports/:reportId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const reportId = parseInt(rawId, 10);
  if (isNaN(reportId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!currentUser) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const rows = await db
    .select({
      id: reportsTable.id,
      folderOwnerId: foldersTable.ownerId,
    })
    .from(reportsTable)
    .innerJoin(foldersTable, eq(reportsTable.folderId, foldersTable.id))
    .where(eq(reportsTable.id, reportId));

  if (!rows.length) {
    res.status(404).json({ error: "Relatório não encontrado" });
    return;
  }

  const report = rows[0];

  if (currentUser.role !== "coordinator" && report.folderOwnerId !== userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  await db.delete(reportsTable).where(eq(reportsTable.id, reportId));

  res.json({ message: "Relatório removido com sucesso" });
});

export default router;
