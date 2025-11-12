import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

const ExpenseChart = () => {
  const [data, setData] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseData();
  }, []);

  const fetchExpenseData = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
          amount,
          category:categories(name, color, type)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const expensesByCategory: { [key: string]: { amount: number; color: string } } = {};

      transactions?.forEach((transaction: any) => {
        if (transaction.category?.type === "expense") {
          const categoryName = transaction.category.name;
          if (!expensesByCategory[categoryName]) {
            expensesByCategory[categoryName] = {
              amount: 0,
              color: transaction.category.color,
            };
          }
          expensesByCategory[categoryName].amount += parseFloat(transaction.amount);
        }
      });

      const chartData = Object.entries(expensesByCategory).map(([category, data]) => ({
        category,
        amount: data.amount,
        color: data.color,
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
        Nenhuma transação encontrada. Faça o upload de um arquivo para começar!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
        <YAxis />
        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
        <Legend />
        <Bar dataKey="amount" name="Gasto" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ExpenseChart;