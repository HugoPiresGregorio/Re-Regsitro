import "./load-env";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("employee"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const foldersTable = pgTable("folders", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id").notNull(),
  authorId: integer("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  type: text("type").notNull().default("report"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const COORD_PASS = "coord2024";
const EMP_PASS = "senha123";

const employees = [
  { username: "ana.silva", name: "Ana Silva" },
  { username: "bruno.santos", name: "Bruno Santos" },
  { username: "carla.oliveira", name: "Carla Oliveira" },
  { username: "daniel.costa", name: "Daniel Costa" },
  { username: "eduarda.lima", name: "Eduarda Lima" },
  { username: "felipe.rodrigues", name: "Felipe Rodrigues" },
  { username: "gabriela.ferreira", name: "Gabriela Ferreira" },
  { username: "henrique.souza", name: "Henrique Souza" },
];

async function main() {
  // Clear existing data
  await db.delete(reportsTable);
  await db.delete(foldersTable);
  await db.delete(usersTable);

  // Create coordinator
  const coordHash = await bcrypt.hash(COORD_PASS, 10);
  const [coord] = await db.insert(usersTable).values({
    username: "coordenadora",
    name: "Maria Aparecida",
    passwordHash: coordHash,
    role: "coordinator",
  }).returning();

  console.log(`Created coordinator: coordenadora / ${COORD_PASS}`);

  // Create employees and their folders
  const empHash = await bcrypt.hash(EMP_PASS, 10);

  for (const emp of employees) {
    const [user] = await db.insert(usersTable).values({
      username: emp.username,
      name: emp.name,
      passwordHash: empHash,
      role: "employee",
    }).returning();

    const [folder] = await db.insert(foldersTable).values({
      ownerId: user.id,
    }).returning();

    // Seed sample reports for first 3 employees
    if (["ana.silva", "bruno.santos", "carla.oliveira"].includes(emp.username)) {
      await db.insert(reportsTable).values({
        folderId: folder.id,
        authorId: user.id,
        title: "Relatorio de Atividades - Maio 2025",
        content: `Relatorio de atividades do mes de maio 2025.\n\nAtividades realizadas:\n- Atendimento ao publico\n- Organizacao do acervo\n- Catalogacao de novos livros\n\nObservacoes: Mes com grande fluxo de usuarios, especialmente estudantes.\n\nTotal de atendimentos: 156\nLivros catalogados: 23`,
        type: "report",
      });
      await db.insert(reportsTable).values({
        folderId: folder.id,
        authorId: user.id,
        title: "Registro de Ocorrencia - 15/05/2025",
        content: `Data: 15/05/2025\nHorario: 14h30\n\nDescrição do ocorrido:\nUsuario devolveu livro com danos na capa. Livro foi encaminhado para restauracao.\n\nLivro: "Dom Casmurro" - Machado de Assis\nCodigo: BC-00234\n\nProvidencias tomadas: Livro enviado para reparo. Usuario notificado.`,
        type: "record",
      });
    }

    console.log(`Created employee: ${emp.username} / ${EMP_PASS} (folder id: ${folder.id})`);
  }

  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log(`  Coordenadora: coordenadora / ${COORD_PASS}`);
  console.log(`  Funcionarios: [username] / ${EMP_PASS}`);
  console.log(`  Usernames: ${employees.map(e => e.username).join(", ")}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
