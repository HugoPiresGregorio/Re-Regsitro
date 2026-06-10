import { useAuth } from "@/contexts/AuthContext";
import { useListFolders, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Folder, FolderLock, FileText, FilePen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

function TypeBadge({ type }: { type: string }) {
  return type === "report" ? (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Relatorio</Badge>
  ) : (
    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Registro</Badge>
  );
}

function CoordinatorDashboard() {
  const { data: folders, isLoading: foldersLoading } = useListFolders();
  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Painel da Coordenadora</h1>
        <p className="text-muted-foreground mt-1">Visao geral de todos os relatorios e pastas da equipe</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : stats ? (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalReports}</p>
                    <p className="text-sm text-muted-foreground">Relatorios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FilePen className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalRecords}</p>
                    <p className="text-sm text-muted-foreground">Registros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Folder className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalFolders}</p>
                    <p className="text-sm text-muted-foreground">Pastas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Folders Grid */}
      <div>
        <h2 className="text-xl font-serif font-semibold mb-4">Pastas dos Funcionarios</h2>
        {foldersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders?.map((folder) => (
              <Link key={folder.id} href={`/pasta/${folder.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/40 group">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <FolderLock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{folder.ownerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {folder.reportCount} {folder.reportCount === 1 ? "documento" : "documentos"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Desde {format(new Date(folder.createdAt), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {stats && stats.recentActivity.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-semibold mb-4">Atividade Recente</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {stats.recentActivity.map((item) => (
                  <li key={item.reportId} className="px-5 py-3 hover:bg-muted/50 transition-colors">
                    <Link href={`/relatorio/${item.reportId}`}>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.authorName}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TypeBadge type={item.type} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.updatedAt), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: folders, isLoading } = useListFolders();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const myFolder = folders?.[0];

  if (!myFolder) {
    return (
      <div className="text-center py-16">
        <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma pasta encontrada. Contate a coordenadora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Bem-vindo(a), {user?.name}</h1>
        <p className="text-muted-foreground mt-1">Sua pasta de relatorios e registros</p>
      </div>
      <Link href={`/pasta/${myFolder.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/40 group max-w-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FolderLock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{myFolder.ownerName}</p>
                <p className="text-sm text-muted-foreground">
                  {myFolder.reportCount} {myFolder.reportCount === 1 ? "documento" : "documentos"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "coordinator" ? <CoordinatorDashboard /> : <EmployeeDashboard />;
}
