import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertSale } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSales() {
  return useQuery({
    queryKey: [api.sales.list.path],
    queryFn: async () => {
      const res = await fetch(api.sales.list.path);
      if (!res.ok) throw new Error("Failed to fetch sales");
      return api.sales.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSale) => {
      const res = await fetch(api.sales.create.path, {
        method: api.sales.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: Number(data.amount) }),
      });
      if (!res.ok) throw new Error("Failed to record sale");
      return api.sales.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.sales.list.path] });
      toast({ title: `Sale Recorded: Rs.${variables.amount}` });
    },
  });
}
