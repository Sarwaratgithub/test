import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Transaction, type InsertTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTransactions(customerId?: number) {
  return useQuery({
    queryKey: [api.transactions.list.path, customerId],
    queryFn: async () => {
      const url = customerId 
        ? `${api.transactions.list.path}?customerId=${customerId}`
        : api.transactions.list.path;
        
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTransaction) => {
      // Ensure amount is handled correctly (backend expects decimal string or number)
      const payload = {
        ...data,
        amount: Number(data.amount) // Ensure it's a number for zod validation if needed, backend will handle
      };

      const res = await fetch(api.transactions.create.path, {
        method: api.transactions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to record transaction");
      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      // Also invalidate the specific customer to update balance
      queryClient.invalidateQueries({ queryKey: ["/api/customers/" + variables.customerId] }); 
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      const typeText = variables.type === 'give' ? "Udhar Diya" : "Wapas Mila";
      toast({ title: `${typeText}: Rs.${variables.amount}` });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertTransaction> & { id: number }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Entry updated" });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete transaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Entry deleted" });
    },
  });
}
