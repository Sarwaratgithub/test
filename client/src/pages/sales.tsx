import { useState } from "react";
import { Layout } from "@/components/layout";
import { useSales, useCreateSale } from "@/hooks/use-sales";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Banknote, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSaleSchema } from "@shared/schema";

// Custom schema to handle string->number coercion for amount
const saleFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  description: z.string().optional(),
});

export default function SalesPage() {
  const { data: sales, isLoading } = useSales();
  const createSale = useCreateSale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof saleFormSchema>) => {
    // Convert amount to string for the backend decimal field
    const submitData = {
      ...data,
      amount: String(data.amount),
    };
    console.log("Submitting sale data:", submitData);
    createSale.mutate(submitData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error) => {
        console.error("Sale recording failed:", error);
      }
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales?.filter(s => 
    new Date(s.date!).toISOString().split('T')[0] === today
  ) || [];
  
  const totalToday = todaysSales.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold">Daily Sales</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25">
                <Plus className="h-4 w-4 mr-2" />
                Add Cash Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Cash Sale</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (Rs.)</FormLabel>
                        <FormControl>
                          <Input type="number" className="text-2xl h-14 font-bold" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Milk, Bread, Chips" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={createSale.isPending}>
                    {createSale.isPending ? "Recording..." : "Save Sale"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Card */}
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Total
              </p>
              <h2 className="text-3xl font-bold">Rs.{totalToday.toLocaleString()}</h2>
            </div>
            <div className="bg-white/10 p-3 rounded-full">
              <Banknote className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 pb-20">
          <h3 className="font-heading font-semibold text-lg px-2">Transactions Today</h3>
          
          {isLoading ? (
            <div className="text-center py-8">Loading sales...</div>
          ) : todaysSales.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
              <p className="text-gray-500">No cash sales recorded today</p>
            </div>
          ) : (
            todaysSales.map((sale) => (
              <div key={sale.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <p className="font-medium text-gray-900">
                    {sale.description || "Cash Sale"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(sale.date!), "h:mm a")}
                  </p>
                </div>
                <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  +Rs.{Number(sale.amount).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
