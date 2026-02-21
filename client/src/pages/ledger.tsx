import { useState } from "react";
import { Layout } from "@/components/layout";
import { usePurchases, useCreatePurchase, useUpdatePurchase, useDeletePurchase, useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/use-ledger";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, ShoppingBag, Receipt, Calendar, Loader2, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Purchase, type Expense } from "@shared/schema";

const purchaseFormSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  description: z.string().optional(),
});

const expenseFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  description: z.string().optional(),
});

export default function LedgerPage() {
  const { data: purchases, isLoading: purchasesLoading } = usePurchases();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const deletePurchase = useDeletePurchase();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const purchaseForm = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: { supplierName: "", amount: 0, description: "" },
  });

  const expenseForm = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { category: "", amount: 0, description: "" },
  });

  const onPurchaseSubmit = (data: z.infer<typeof purchaseFormSchema>) => {
    if (editingPurchase) {
      updatePurchase.mutate({ id: editingPurchase.id, ...data, amount: String(data.amount) }, {
        onSuccess: () => {
          setPurchaseDialogOpen(false);
          setEditingPurchase(null);
          purchaseForm.reset();
        },
      });
      return;
    }
    createPurchase.mutate({ ...data, amount: String(data.amount) }, {
      onSuccess: () => {
        setPurchaseDialogOpen(false);
        purchaseForm.reset();
      },
    });
  };

  const onExpenseSubmit = (data: z.infer<typeof expenseFormSchema>) => {
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, ...data, amount: String(data.amount) }, {
        onSuccess: () => {
          setExpenseDialogOpen(false);
          setEditingExpense(null);
          expenseForm.reset();
        },
      });
      return;
    }
    createExpense.mutate({ ...data, amount: String(data.amount) }, {
      onSuccess: () => {
        setExpenseDialogOpen(false);
        expenseForm.reset();
      },
    });
  };

  const handleEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    purchaseForm.reset({
      supplierName: p.supplierName,
      amount: Number(p.amount),
      description: p.description || "",
    });
    setPurchaseDialogOpen(true);
  };

  const handleEditExpense = (e: Expense) => {
    setEditingExpense(e);
    expenseForm.reset({
      category: e.category,
      amount: Number(e.amount),
      description: e.description || "",
    });
    setExpenseDialogOpen(true);
  };

  const totalPurchases = purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-gray-900 uppercase tracking-tighter">Business Ledger</h2>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary text-white border-none card-3d overflow-hidden rounded-[2rem] ring-4 ring-primary/20">
            <CardContent className="p-5 flex flex-col justify-between h-32 relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShoppingBag size={80} />
              </div>
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Purchases</p>
              <h3 className="text-2xl font-black">Rs.{totalPurchases.toLocaleString()}</h3>
            </CardContent>
          </Card>

          <Card className="bg-accent text-white border-none card-3d overflow-hidden rounded-[2rem] ring-4 ring-accent/20">
            <CardContent className="p-5 flex flex-col justify-between h-32 relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
                <Receipt size={80} />
              </div>
              <p className="text-[10px] font-black text-red-100 uppercase tracking-widest">Expenses</p>
              <h3 className="text-2xl font-black">Rs.{totalExpenses.toLocaleString()}</h3>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-1.5 shadow-inner">
            <TabsTrigger value="purchases" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">Purchases</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={purchaseDialogOpen} onOpenChange={(open) => {
                setPurchaseDialogOpen(open);
                if (!open) setEditingPurchase(null);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary shadow-3d btn-3d rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Purchase
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingPurchase ? "Edit Purchase" : "Record Purchase"}</DialogTitle></DialogHeader>
                  <Form {...purchaseForm}>
                    <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-4 pt-4">
                      <FormField control={purchaseForm.control} name="supplierName" render={({ field }) => (
                        <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input placeholder="Enter supplier name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={purchaseForm.control} name="amount" render={({ field }) => (
                        <FormItem><FormLabel>Amount (Rs.)</FormLabel><FormControl><Input type="number" className="text-2xl h-14 font-bold" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={purchaseForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full h-12" disabled={createPurchase.isPending}>{createPurchase.isPending ? "Saving..." : "Save Purchase"}</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {purchasesLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div> : (
              <div className="space-y-4 pb-20">
                {purchases?.map((p) => (
                  <div key={p.id} className="card-3d bg-white dark:bg-slate-900 p-5 border-none flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{p.supplierName}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{p.description || "Purchase Entry"}</p>
                      <p className="text-[10px] font-black text-primary uppercase mt-1.5">{p.date ? format(new Date(p.date), "dd MMM yyyy") : "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-xl text-gray-900 dark:text-white">Rs.{Number(p.amount).toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-300 hover:text-primary" onClick={() => handleEditPurchase(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-300 hover:text-destructive" onClick={() => { if(window.confirm("Delete?")) deletePurchase.mutate(p.id) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
                setExpenseDialogOpen(open);
                if (!open) setEditingExpense(null);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-destructive shadow-3d btn-3d rounded-xl text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingExpense ? "Edit Expense" : "Record Expense"}</DialogTitle></DialogHeader>
                  <Form {...expenseForm}>
                    <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4 pt-4">
                      <FormField control={expenseForm.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Rent, Bill, Salary" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={expenseForm.control} name="amount" render={({ field }) => (
                        <FormItem><FormLabel>Amount (Rs.)</FormLabel><FormControl><Input type="number" className="text-2xl h-14 font-bold" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={expenseForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full h-12 bg-destructive hover:bg-destructive/90 text-white" disabled={createExpense.isPending}>{createExpense.isPending ? "Saving..." : "Save Expense"}</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {expensesLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div> : (
              <div className="space-y-4 pb-20">
                {expenses?.map((e) => (
                  <div key={e.id} className="card-3d bg-white dark:bg-slate-900 p-5 border-none flex items-center justify-between border-l-4 border-l-destructive overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg uppercase tracking-tight">{e.category}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{e.description || "Expense Entry"}</p>
                      <p className="text-[10px] font-black text-destructive uppercase mt-1.5">{e.date ? format(new Date(e.date), "dd MMM yyyy") : "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-xl text-destructive">Rs.{Number(e.amount).toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-300 hover:text-primary" onClick={() => handleEditExpense(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-300 hover:text-destructive" onClick={() => { if(window.confirm("Delete?")) deleteExpense.mutate(e.id) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
