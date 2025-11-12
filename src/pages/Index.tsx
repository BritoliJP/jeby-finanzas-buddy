import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Upload, BarChart3, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Upload className="h-8 w-8 text-primary" />,
      title: "Upload Fácil",
      description: "Envie seus extratos bancários em CSV ou XLSX",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-accent" />,
      title: "Análise com IA",
      description: "Categorização automática de transações usando inteligência artificial",
    },
    {
      icon: <Target className="h-8 w-8 text-success" />,
      title: "Metas Personalizadas",
      description: "Defina limites mensais para cada categoria de gasto",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-chart-4" />,
      title: "Visualização Clara",
      description: "Gráficos interativos para acompanhar seus gastos",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            JEBY Finanças
          </h1>
          <Button onClick={() => navigate("/auth")}>
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl font-bold mb-4">
            Controle Financeiro
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Inteligente e Simples
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Entenda seus gastos, defina metas e tome decisões financeiras mais conscientes
            com a ajuda de inteligência artificial
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Saber Mais
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Como Funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Crie sua conta</h3>
                  <p className="text-muted-foreground">Cadastre-se gratuitamente em segundos</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Faça upload do seu extrato</h3>
                  <p className="text-muted-foreground">
                    Envie arquivos CSV ou XLSX do seu banco
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Deixe a IA trabalhar</h3>
                  <p className="text-muted-foreground">
                    Nossas IA categoriza automaticamente suas transações
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Visualize e planeje</h3>
                  <p className="text-muted-foreground">
                    Veja gráficos, defina metas e tome o controle das suas finanças
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-20 border-t text-center text-muted-foreground">
        <p>© 2024 JEBY Finanças. Educação financeira para jovens adultos.</p>
      </footer>
    </div>
  );
};

export default Index;
