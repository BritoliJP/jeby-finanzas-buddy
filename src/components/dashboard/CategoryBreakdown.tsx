import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  spent: number;
  goal: number;
  color: string;
}

const CategoryBreakdown = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
  }, []);

  const fetchCategoryData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("type", "expense");

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, category_id")
        .gte("transaction_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`);

      const { data: goals } = await supabase
        .from("budget_goals")
        .select("monthly_limit, category_id")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      const categoryMap: { [key: string]: CategoryData } = {};

      categoriesData?.forEach((cat) => {
        categoryMap[cat.id] = {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || "📦",
          spent: 0,
          goal: 0,
          color: cat.color || "#gray",
        };
      });

      transactions?.forEach((t) => {
        if (categoryMap[t.category_id]) {
          categoryMap[t.category_id].spent += parseFloat(String(t.amount));
        }
      });

      goals?.forEach((g) => {
        if (categoryMap[g.category_id]) {
          categoryMap[g.category_id].goal = parseFloat(String(g.monthly_limit));
        }
      });

      setCategories(Object.values(categoryMap));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => {
        const percentage = category.goal > 0 ? (category.spent / category.goal) * 100 : 0;
        const isOverBudget = category.spent > category.goal && category.goal > 0;

        return (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gasto:</span>
                  <span className="font-medium">R$ {category.spent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Meta:</span>
                  <span className="font-medium">
                    {category.goal > 0 ? `R$ ${category.goal.toFixed(2)}` : "Não definida"}
                  </span>
                </div>
                {category.goal > 0 && (
                  <>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={isOverBudget ? "[&>div]:bg-destructive" : ""}
                    />
                    <div className="text-xs text-center text-muted-foreground">
                      {percentage.toFixed(0)}% da meta
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CategoryBreakdown;