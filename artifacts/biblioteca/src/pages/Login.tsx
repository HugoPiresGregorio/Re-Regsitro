import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, getGetMeQueryKey, useListFolders, getListFoldersQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  username: z.string().min(1, "O usuario e obrigatorio"),
  password: z.string().min(1, "A senha e obrigatoria"),
});

export default function Login() {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const { refetch: refetchFolders } = useListFolders({
    query: {
      queryKey: getListFoldersQueryKey(),
      enabled: false,
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "coordinator") {
        setLocation("/");
      } else {
        refetchFolders().then((res) => {
          const folders = res.data;
          if (folders && folders.length > 0) {
            setLocation(`/pasta/${folders[0].id}`);
          } else {
            setLocation("/");
          }
        });
      }
    }
  }, [user, isLoading, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: async (data) => {
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
          if (data.user.role === "coordinator") {
            setLocation("/");
          } else {
            const res = await refetchFolders();
            const folders = res.data;
            if (folders && folders.length > 0) {
              setLocation(`/pasta/${folders[0].id}`);
            } else {
              setLocation("/");
            }
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro de autenticacao",
            description: "Usuario ou senha incorretos.",
          });
        },
      }
    );
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl font-bold tracking-tight">
              Re-Registro
            </CardTitle>
            <CardDescription className="text-base mt-2">Sistema de relatórios</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                placeholder="Ex: nome.sobrenome"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full text-md h-12 mt-4"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
