import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertPurchase, type InsertExpense, type Purchase, type Expense } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePurchases() {
  return useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
    queryFn: async () => {
      const res = await fetch("/api/purchases");
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return await res.json();
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPurchase) => {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record purchase");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      toast({ title: `Purchase Recorded: Rs.${variables.amount}` });
    },
  });
}

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      const res = await fetch("/api/expenses");
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return await res.json();
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertExpense) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record expense");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: `Expense Recorded: Rs.${variables.amount}` });
    },
  });
}
