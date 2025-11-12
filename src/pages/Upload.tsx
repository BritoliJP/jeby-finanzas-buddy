import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload as UploadIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"ai" | "labeled">("ai");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      
      if (fileExtension !== "csv" && fileExtension !== "xlsx") {
        toast.error("Por favor, selecione um arquivo CSV ou XLSX");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setLoading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        const { data, error } = await supabase.functions.invoke("analyze-transactions", {
          body: {
            fileContent: content,
            fileName: file.name,
            analysisMode,
          },
        });

        if (error) {
          throw error;
        }

        toast.success(`Análise concluída! ${data.transactionsCount} transações processadas.`);
        navigate("/dashboard");
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error(error.message || "Erro ao processar arquivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload de Transações</CardTitle>
            <CardDescription>
              Envie um arquivo CSV ou XLSX com suas transações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Modo de Análise</Label>
              <RadioGroup value={analysisMode} onValueChange={(value) => setAnalysisMode(value as "ai" | "labeled")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ai" id="ai" />
                  <Label htmlFor="ai" className="cursor-pointer">
                    Análise com IA (arquivo bruto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="labeled" id="labeled" />
                  <Label htmlFor="labeled" className="cursor-pointer">
                    Arquivo já rotulado (com coluna "Categoria")
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {file.name}
                </p>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Formato esperado do arquivo:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Coluna "Descrição" ou "Description": descrição da transação</li>
                <li>• Coluna "Valor" ou "Amount": valor da transação</li>
                <li>• Coluna "Data" ou "Date": data da transação</li>
                {analysisMode === "labeled" && (
                  <li>• Coluna "Categoria" ou "Category": categoria da transação</li>
                )}
              </ul>
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Analisar Transações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Upload;