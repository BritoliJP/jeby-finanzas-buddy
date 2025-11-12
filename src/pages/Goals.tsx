import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Goal {
  category_id: string;
  monthly_limit: number;
}

const Goals = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchCategories();
    fetchGoals();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUserId(session.user.id);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "expense")
      .order("name");

    if (data) {
      setCategories(data);
    }
  };

  const fetchGoals = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { data } = await supabase
      .from("budget_goals")
      .select("category_id, monthly_limit")
      .eq("month", currentMonth)
      .eq("year", currentYear);

    if (data) {
      const goalsMap: { [key: string]: string } = {};
      data.forEach((goal: Goal) => {
        goalsMap[goal.category_id] = goal.monthly_limit.toString();
      });
      setGoals(goalsMap);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setLoading(true);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    try {
      for (const categoryId of Object.keys(goals)) {
        const limit = parseFloat(goals[categoryId] || "0");
        
        const { error } = await supabase
          .from("budget_goals")
          .upsert({
            user_id: userId,
            category_id: categoryId,
            monthly_limit: limit,
            month: currentMonth,
            year: currentYear,
          }, {
            onConflict: "user_id,category_id,month,year",
          });

        if (error) throw error;
      }

      toast.success("Metas salvas com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao salvar metas:", error);
      toast.error(error.message || "Erro ao salvar metas");
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Definir Metas de Gastos</CardTitle>
            <CardDescription>
              Estabeleça limites mensais para cada categoria de despesa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <Label htmlFor={category.id} className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id={category.id}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-10"
                      value={goals[category.id] || ""}
                      onChange={(e) =>
                        setGoals({ ...goals, [category.id]: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Metas
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Goals;