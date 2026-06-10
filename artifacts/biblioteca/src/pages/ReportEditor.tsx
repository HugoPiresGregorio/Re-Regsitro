import {
  useGetReport,
  useUpdateReport,
  useCreateReport,
  getListReportsQueryKey,
  getGetReportQueryKey,
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function ReportEditor() {
  const { reportId: reportIdStr, folderId: folderIdStr } = useParams<{
    reportId?: string;
    folderId?: string;
  }>();
  const isNew = !reportIdStr;
  const reportId = reportIdStr ? parseInt(reportIdStr, 10) : 0;
  const folderId = folderIdStr ? parseInt(folderIdStr, 10) : 0;

  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"report" | "record">("report");

  const { data: report, isLoading } = useGetReport(reportId, {
    query: { queryKey: getGetReportQueryKey(reportId), enabled: !isNew && !!reportId },
  });

  const updateMutation = useUpdateReport();
  const createMutation = useCreateReport();

  useEffect(() => {
    if (report) {
      setTitle(report.title);
      setContent(report.content);
      setType(report.type as "report" | "record");
    }
  }, [report]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O titulo e obrigatorio." });
      return;
    }

    if (isNew) {
      createMutation.mutate(
        { folderId, data: { title: title.trim(), content, type } },
        {
          onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: getListReportsQueryKey(folderId) });
            toast({ title: "Documento criado", description: `"${created.title}" foi salvo.` });
            setLocation(`/relatorio/${created.id}`);
          },
          onError: () => {
            toast({ variant: "destructive", title: "Erro", description: "Nao foi possivel criar o documento." });
          },
        }
      );
    } else {
      updateMutation.mutate(
        { reportId, data: { title: title.trim(), content, type } },
        {
          onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: getGetReportQueryKey(reportId) });
            queryClient.invalidateQueries({ queryKey: getListReportsQueryKey(updated.folderId) });
            toast({ title: "Documento salvo", description: `"${updated.title}" foi atualizado.` });
            setLocation(`/relatorio/${reportId}`);
          },
          onError: () => {
            toast({ variant: "destructive", title: "Erro", description: "Nao foi possivel salvar o documento." });
          },
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-serif font-bold">
          {isNew ? "Novo Documento" : "Editar Documento"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="title">Titulo *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o titulo do documento"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo de Documento</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType("report")}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                type === "report"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:border-primary/40"
              }`}
            >
              Relatorio
            </button>
            <button
              type="button"
              onClick={() => setType("record")}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                type === "record"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-border bg-transparent text-muted-foreground hover:border-green-300"
              }`}
            >
              Registro
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Conteudo</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o conteudo do documento aqui..."
            className="min-h-[320px] font-serif text-base leading-relaxed resize-y"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={() => history.back()} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Salvando..." : "Salvar Documento"}
          </Button>
        </div>
      </form>
    </div>
  );
}
