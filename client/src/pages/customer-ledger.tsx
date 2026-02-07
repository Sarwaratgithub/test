import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { useCustomers } from "@/hooks/use-customers";
import { useTransactions, useCreateTransaction } from "@/hooks/use-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Plus, TrendingDown, TrendingUp, History } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const transactionFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  description: z.string().optional(),
  type: z.enum(["give", "receive"]),
});

export default function CustomerLedgerPage() {
  const [, params] = useRoute("/customers/:id");
  const customerId = params?.id ? Number(params.id) : null;

  const { data: customers, isLoading: customerLoading } = useCustomers();
  const customer = customers?.find(c => c.id === customerId);

  const { data: transactions, isLoading: txLoading } = useTransactions(customerId || undefined);
  const createTx = useCreateTransaction();

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
      type: "give",
    },
  });

  const onSubmit = (data: z.infer<typeof transactionFormSchema>) => {
    if (!customerId) return;
    createTx.mutate({
      ...data,
      amount: String(data.amount),
      customerId,
    }, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  if (customerLoading || !customer) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-heading font-bold">{customer.name}</h2>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-red-50 border-red-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-red-600 uppercase mb-1">Total Udhar</p>
              <h3 className="text-2xl font-black text-red-700">Rs.{Number(customer.totalBalance).toLocaleString()}</h3>
            </CardContent>
          </Card>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="h-full bg-primary flex flex-col items-center gap-1">
                <Plus className="h-5 w-5" />
                <span className="text-xs">Entry</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Entry for {customer.name}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={field.value === "give" ? "destructive" : "outline"}
                              onClick={() => field.onChange("give")}
                              className="h-12"
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Udhar Diya
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === "receive" ? "default" : "outline"}
                              className={field.value === "receive" ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => field.onChange("receive")}
                            >
                              <TrendingDown className="h-4 w-4 mr-2" />
                              Wapas Mila
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (Rs.)</FormLabel>
                        <FormControl>
                          <Input type="number" className="text-2xl h-14 font-bold" {...field} />
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
                          <Input placeholder="e.g. Rice 2kg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12" disabled={createTx.isPending}>
                    {createTx.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4 pb-20">
          <div className="flex items-center gap-2 px-1">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading font-semibold">Ledger History</h3>
          </div>

          {txLoading ? (
            <div className="text-center py-8">Loading history...</div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
              <p className="text-muted-foreground">No entries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.description || (tx.type === 'give' ? "Udhar Diya" : "Wapas Mila")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt!), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'give' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'give' ? '+' : '-'}Rs.{Number(tx.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                      {tx.type === 'give' ? 'Debit' : 'Credit'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
