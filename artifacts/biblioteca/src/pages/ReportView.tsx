import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Pencil, Printer, FileText, FilePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

function TypeBadge({ type }: { type: string }) {
  return type === "report" ? (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Relatorio</Badge>
  ) : (
    <Badge className="bg-green-100 text-green-800 border-green-200">Registro</Badge>
  );
}

export default function ReportView() {
  const { reportId: reportIdStr } = useParams<{ reportId: string }>();
  const reportId = parseInt(reportIdStr ?? "0", 10);
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  const { data: report, isLoading, error } = useGetReport(reportId, {
    query: { queryKey: getGetReportQueryKey(reportId), enabled: !!reportId },
  });

  const canEdit = user?.role === "coordinator" || report?.authorId === user?.id;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-4">Relatorio nao encontrado ou acesso negado.</p>
        <Button variant="outline" onClick={() => setLocation("/")}>Voltar ao inicio</Button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-content { max-width: 100% !important; padding: 2rem !important; }
        }
      `}</style>

      <div className="space-y-6 print-content">
        <div className="no-print flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / Salvar como PDF
            </Button>
            {canEdit && report && (
              <Link href={`/relatorio/${report.id}/editar`}>
                <Button>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : report ? (
          <article className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <div className="hidden print:block mb-6 pb-4 border-b">
              <p className="text-sm text-muted-foreground">Sistema de Relatorios — Biblioteca Municipal</p>
            </div>

            <header className="mb-6 pb-5 border-b border-border">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  {report.type === "report" ? (
                    <FileText className="h-5 w-5 text-primary no-print" />
                  ) : (
                    <FilePen className="h-5 w-5 text-green-600 no-print" />
                  )}
                  <TypeBadge type={report.type} />
                  {user?.role === "coordinator" && (
                    <Badge variant="outline" className="no-print">Coordenadora</Badge>
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground leading-tight">
                {report.title}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-muted-foreground">
                <span>
                  Autor: <span className="text-foreground font-medium">{report.authorName}</span>
                </span>
                <span>
                  Criado em:{" "}
                  <span className="text-foreground">{format(new Date(report.createdAt), "dd/MM/yyyy")}</span>
                </span>
                <span>
                  Atualizado em:{" "}
                  <span className="text-foreground">{format(new Date(report.updatedAt), "dd/MM/yyyy")}</span>
                </span>
              </div>
            </header>

            <div className="prose prose-sm max-w-none">
              <div className="text-foreground leading-relaxed whitespace-pre-wrap font-serif text-base">
                {report.content || (
                  <span className="text-muted-foreground italic">(sem conteudo)</span>
                )}
              </div>
            </div>

            <div className="hidden print:block mt-8 pt-4 border-t text-xs text-muted-foreground">
              <p>Impresso em: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </article>
        ) : null}
      </div>
    </>
  );
}
