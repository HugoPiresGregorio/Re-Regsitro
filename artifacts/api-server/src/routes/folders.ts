import { Router, type IRouter } from "express";
import { db, foldersTable, usersTable, reportsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return req.session.userId;
}

router.get("/folders", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!currentUser) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }

  // Get folders with owner info and report counts
  const folders = await db
    .select({
      id: foldersTable.id,
      ownerId: foldersTable.ownerId,
      ownerName: usersTable.name,
      createdAt: foldersTable.createdAt,
    })
    .from(foldersTable)
    .innerJoin(usersTable, eq(foldersTable.ownerId, usersTable.id))
    .orderBy(usersTable.name);

  // Filter for employees: only their own folder
  const filteredFolders = currentUser.role === "coordinator"
    ? folders
    : folders.filter((f) => f.ownerId === userId);

  // Get report counts
  const counts = await db
    .select({
      folderId: reportsTable.folderId,
      count: count(),
    })
    .from(reportsTable)
    .groupBy(reportsTable.folderId);

  const countMap: Record<number, number> = {};
  for (const c of counts) {
    countMap[c.folderId] = Number(c.count);
  }

  const result = filteredFolders.map((f) => ({
    id: f.id,
    ownerId: f.ownerId,
    ownerName: f.ownerName,
    createdAt: f.createdAt.toISOString(),
    reportCount: countMap[f.id] ?? 0,
  }));

  res.json(result);
});

router.get("/folders/:folderId", async (req, res): Promise<void> => {
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

  const [folder] = await db
    .select({
      id: foldersTable.id,
      ownerId: foldersTable.ownerId,
      ownerName: usersTable.name,
      createdAt: foldersTable.createdAt,
    })
    .from(foldersTable)
    .innerJoin(usersTable, eq(foldersTable.ownerId, usersTable.id))
    .where(eq(foldersTable.id, folderId));

  if (!folder) {
    res.status(404).json({ error: "Pasta não encontrada" });
    return;
  }

  // Employees can only see their own folder
  if (currentUser.role !== "coordinator" && folder.ownerId !== userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  res.json({
    id: folder.id,
    ownerId: folder.ownerId,
    ownerName: folder.ownerName,
    createdAt: folder.createdAt.toISOString(),
  });
});

export default router;
