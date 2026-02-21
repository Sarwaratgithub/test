import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useCustomers, useUpdateCustomer, useDeleteCustomer } from "@/hooks/use-customers";
import { useTransactions, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Plus, TrendingDown, TrendingUp, History, Trash2, Pencil } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { type Transaction } from "@shared/schema";

const transactionFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  description: z.string().optional(),
  type: z.enum(["give", "receive"]),
});

const customerEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

export default function CustomerLedgerPage() {
  const [, params] = useRoute("/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id ? Number(params.id) : null;
  const { toast } = useToast();

  const { data: customers, isLoading: customerLoading } = useCustomers();
  const customer = customers?.find(c => c.id === customerId);

  const { data: transactions, isLoading: txLoading } = useTransactions(customerId || undefined);
  const createTx = useCreateTransaction();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const deleteTx = useDeleteTransaction();

  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
      type: "give",
    },
  });

  const editCustomerForm = useForm<z.infer<typeof customerEditSchema>>({
    resolver: zodResolver(customerEditSchema),
    values: {
      name: customer?.name || "",
      phone: customer?.phone || "",
    },
  });

  const updateTx = useUpdateTransaction();

  const onSubmit = (data: z.infer<typeof transactionFormSchema>) => {
    if (!customerId) return;
    
    if (editingTx) {
      updateTx.mutate({
        id: editingTx.id,
        ...data,
        amount: String(data.amount),
      }, {
        onSuccess: () => {
          setEditingTx(null);
          form.reset();
        }
      });
      return;
    }

    createTx.mutate({
      ...data,
      amount: String(data.amount),
      customerId,
    }, {
      onSuccess: () => {
        form.reset();
        toast({ title: "Entry Saved", description: "Ledger entry added successfully" });
      },
    });
  };

  const onEditCustomer = (data: z.infer<typeof customerEditSchema>) => {
    if (!customerId) return;
    updateCustomer.mutate({ id: customerId, ...data }, {
      onSuccess: () => {
        setIsEditCustomerOpen(false);
        toast({ title: "Updated", description: "Customer details updated" });
      }
    });
  };

  const handleDeleteCustomer = () => {
    if (!customerId || !window.confirm("Are you sure? This will delete the customer and all their ledger history.")) return;
    deleteCustomer.mutate(customerId, {
      onSuccess: () => {
        setLocation("/customers");
        toast({ title: "Deleted", description: "Customer removed from Khata" });
      }
    });
  };

  const handleDeleteTx = (id: number) => {
    if (!window.confirm("Delete this entry?")) return;
    deleteTx.mutate(id, {
      onSuccess: () => {
        toast({ title: "Entry Deleted", description: "Ledger entry removed" });
      }
    });
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    form.reset({
      amount: Number(tx.amount),
      description: tx.description || "",
      type: tx.type as "give" | "receive",
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/customers">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-heading font-black text-gray-900 leading-tight uppercase tracking-tight">{customer.name}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{customer.phone}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-gray-200">
                  <Pencil className="h-4 w-4 text-gray-600" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
                <Form {...editCustomerForm}>
                  <form onSubmit={editCustomerForm.handleSubmit(onEditCustomer)} className="space-y-4 pt-4">
                    <FormField control={editCustomerForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editCustomerForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="destructive" className="flex-1" onClick={handleDeleteCustomer} disabled={deleteCustomer.isPending}>
                        Delete Customer
                      </Button>
                      <Button type="submit" className="flex-1" disabled={updateCustomer.isPending}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-red-50 dark:bg-red-900/10 border-none card-3d ring-4 ring-red-500/10">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Total Udhar</p>
              <h3 className="text-2xl font-black text-red-700 dark:text-red-400">Rs.{Number(customer.totalBalance).toLocaleString()}</h3>
            </CardContent>
          </Card>

          <Dialog open={!!editingTx || undefined} onOpenChange={(open) => !open && setEditingTx(null)}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-full bg-primary btn-3d rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
                <Plus className="h-6 w-6 text-white" />
                <span className="text-xs font-black text-white uppercase tracking-wider">New Entry</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTx ? "Edit Entry" : `Add Entry for ${customer.name}`}</DialogTitle>
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
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-muted-foreground font-medium uppercase tracking-tight">No entries yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="card-3d bg-white dark:bg-slate-900 p-5 border-none flex items-center justify-between group overflow-hidden relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${tx.type === 'give' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                      {tx.description || (tx.type === 'give' ? "Udhar Diya" : "Wapas Mila")}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {tx.date ? format(new Date(tx.date), "dd MMM • h:mm a") : "N/A"}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-xl font-black ${tx.type === 'give' ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.type === 'give' ? '+' : '-'}Rs.{Number(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-70">
                        {tx.type === 'give' ? 'Udhar Diya' : 'Wapas Mila'}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-gray-300 hover:text-primary transition-colors"
                      onClick={() => handleEditTx(tx)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-gray-300 hover:text-destructive transition-colors"
                      onClick={() => handleDeleteTx(tx.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
