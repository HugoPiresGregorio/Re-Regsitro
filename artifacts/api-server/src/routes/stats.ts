import { Router, type IRouter } from "express";
import { db, reportsTable, foldersTable, usersTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!currentUser || currentUser.role !== "coordinator") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const allReports = await db.select({ type: reportsTable.type }).from(reportsTable);
  const totalReports = allReports.filter((r) => r.type === "report").length;
  const totalRecords = allReports.filter((r) => r.type === "record").length;

  const [{ folderCount }] = await db.select({ folderCount: count() }).from(foldersTable);

  const recentActivity = await db
    .select({
      reportId: reportsTable.id,
      title: reportsTable.title,
      authorName: usersTable.name,
      type: reportsTable.type,
      updatedAt: reportsTable.updatedAt,
    })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.authorId, usersTable.id))
    .orderBy(desc(reportsTable.updatedAt))
    .limit(10);

  res.json({
    totalReports,
    totalRecords,
    totalFolders: Number(folderCount),
    recentActivity: recentActivity.map((r) => ({
      reportId: r.reportId,
      title: r.title,
      authorName: r.authorName,
      type: r.type,
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
});

router.get("/users", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      role: usersTable.role,
    })
    .from(usersTable)
    .orderBy(usersTable.name);

  res.json(users);
});

export default router;
