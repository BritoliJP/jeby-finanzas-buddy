import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const GoalsChart = () => {
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalGoal, setTotalGoal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, category:categories(type)")
        .gte("transaction_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`);

      const { data: goals } = await supabase
        .from("budget_goals")
        .select("monthly_limit")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      const spent = transactions?.reduce((sum, t: any) => {
        if (t.category?.type === "expense") {
          return sum + parseFloat(String(t.amount));
        }
        return sum;
      }, 0) || 0;

      const goal = goals?.reduce((sum, g) => sum + parseFloat(String(g.monthly_limit)), 0) || 0;

      setTotalSpent(spent);
      setTotalGoal(goal);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Carregando...</div>;
  }

  const remaining = Math.max(0, totalGoal - totalSpent);
  const data = [
    { name: "Gasto", value: totalSpent, color: "hsl(var(--primary))" },
    { name: "Restante", value: remaining, color: "hsl(var(--success))" },
  ];

  if (totalGoal === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Defina suas metas para ver a comparação!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GoalsChart;