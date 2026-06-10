import { useAuth } from "@/contexts/AuthContext";
import {
  useGetFolder,
  useListReports,
  useDeleteReport,
  getGetFolderQueryKey,
  getListReportsQueryKey,
} from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import { FolderLock, FilePlus, FileText, FilePen, Trash2, Pencil, ArrowLeft, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";

function TypeBadge({ type }: { type: string }) {
  return type === "report" ? (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Relatorio</Badge>
  ) : (
    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Registro</Badge>
  );
}

function DeleteButton({ reportId, title, folderId }: { reportId: number; title: string; folderId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteReport();

  const handleDelete = () => {
    if (!window.confirm(`Tem certeza que deseja remover "${title}"?`)) return;
    mutation.mutate(
      { reportId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey(folderId) });
          toast({ title: "Documento removido", description: `"${title}" foi removido.` });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erro", description: "Nao foi possivel remover." });
        },
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={mutation.isPending}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

export default function FolderView() {
  const { folderId: folderIdStr } = useParams<{ folderId: string }>();
  const folderId = parseInt(folderIdStr ?? "0", 10);
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "report" | "record">("all");

  const { data: folder, isLoading: folderLoading, error: folderError } = useGetFolder(folderId, {
    query: { queryKey: getGetFolderQueryKey(folderId), enabled: !!folderId },
  });

  const { data: reports, isLoading: reportsLoading } = useListReports(folderId, {
    query: { queryKey: getListReportsQueryKey(folderId), enabled: !!folderId },
  });

  const canEdit = user?.role === "coordinator" || folder?.ownerId === user?.id;

  const filtered = (reports ?? []).filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  if (folderError) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-4">Acesso negado ou pasta nao encontrada.</p>
        <Button variant="outline" onClick={() => setLocation("/")}>Voltar ao inicio</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          {folderLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <FolderLock className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-serif font-bold">{folder?.ownerName}</h1>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Pasta pessoal — {reports?.length ?? 0}{" "}
                {reports?.length === 1 ? "documento" : "documentos"}
              </p>
            </>
          )}
        </div>
        {canEdit && (
          <Link href={`/nova-entrada/${folderId}`}>
            <Button>
              <FilePlus className="h-4 w-4 mr-2" />
              Novo Documento
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por titulo..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "report", "record"] as const).map((t) => (
            <Button
              key={t}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "Todos" : t === "report" ? "Relatorios" : "Registros"}
            </Button>
          ))}
        </div>
      </div>

      {reportsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum documento encontrado</p>
          {canEdit && (
            <Link href={`/nova-entrada/${folderId}`}>
              <Button variant="link" className="mt-2">Criar primeiro documento</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((report) => (
            <Card key={report.id} className="hover:shadow-sm transition-shadow group">
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {report.type === "report" ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <FilePen className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/relatorio/${report.id}`}>
                      <p className="font-medium text-foreground hover:text-primary transition-colors truncate cursor-pointer">
                        {report.title}
                      </p>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(report.updatedAt), "dd/MM/yyyy")} — {report.authorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TypeBadge type={report.type} />
                    {canEdit && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/relatorio/${report.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <DeleteButton reportId={report.id} title={report.title} folderId={folderId} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
