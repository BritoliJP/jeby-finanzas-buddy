import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface BalanceData {
  category: string;
  balance: number;
}

const BalanceChart = () => {
  const [data, setData] = useState<BalanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, category_id, category:categories(id, name, type)")
        .gte("transaction_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`);

      const { data: goals } = await supabase
        .from("budget_goals")
        .select("monthly_limit, category:categories(id, name)")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      const balanceByCategory: { [key: string]: number } = {};

      goals?.forEach((goal: any) => {
        const categoryName = goal.category?.name;
        balanceByCategory[categoryName] = parseFloat(goal.monthly_limit);
      });

      transactions?.forEach((transaction: any) => {
        if (transaction.category?.type === "expense") {
          const categoryName = transaction.category.name;
          if (balanceByCategory[categoryName] !== undefined) {
            balanceByCategory[categoryName] -= parseFloat(transaction.amount);
          }
        }
      });

      const chartData = Object.entries(balanceByCategory).map(([category, balance]) => ({
        category,
        balance,
      }));

      setData(chartData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Carregando...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Defina suas metas para ver o saldo por categoria!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="category" type="category" width={100} />
        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
        <Legend />
        <Bar dataKey="balance" name="Saldo">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BalanceChart;