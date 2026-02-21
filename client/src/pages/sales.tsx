import { useState } from "react";
import { Layout } from "@/components/layout";
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from "@/hooks/use-sales";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Banknote, Calendar, ArrowLeft, ArrowRight, Trash2, Pencil } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Sale } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom schema to handle string->number coercion for amount
const saleFormSchema = z.object({
  amount: z.coerce.string().min(1, "Amount is required"),
  type: z.enum(["cash_sale", "cash_in_hand"]),
  description: z.string().optional(),
  date: z.string(),
});

export default function SalesPage() {
  const { data: sales, isLoading } = useSales();
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const deleteSale = useDeleteSale();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  const form = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      amount: "",
      type: "cash_sale",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: z.infer<typeof saleFormSchema>) => {
    const payload = {
      ...data,
      date: new Date(data.date),
    };

    if (editingSale) {
      updateSale.mutate({ id: editingSale.id, ...payload } as any, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingSale(null);
          form.reset();
        },
      });
      return;
    }

    createSale.mutate(payload as any, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
      },
    });
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    form.reset({
      amount: String(sale.amount),
      type: sale.type as "cash_sale" | "cash_in_hand",
      description: sale.description || "",
      date: sale.date ? format(new Date(sale.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this entry?")) {
      deleteSale.mutate(id);
    }
  };

  const selectedSales = sales?.filter(s => 
    isSameDay(new Date(s.date!), viewDate)
  ) || [];
  
  const totalViewDate = selectedSales.reduce((sum, s) => sum + Number(s.amount), 0);

  const prevDay = () => setViewDate(d => subDays(d, 1));
  const nextDay = () => {
    const next = subDays(viewDate, -1);
    if (next <= new Date()) setViewDate(next);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-gray-900 uppercase tracking-tighter">Sales & Cash</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingSale(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-3d btn-3d rounded-xl px-4 py-6 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSale ? "Edit Entry" : "Add Sales/Cash Entry"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash_sale">Daily Cash Sale</SelectItem>
                            <SelectItem value="cash_in_hand">Cash In Hand</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} max={format(new Date(), "yyyy-MM-dd")} />
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
                          <Input 
                            type="number" 
                            className="text-2xl h-14 font-bold" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)} 
                          />
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
                          <Input placeholder="e.g. Morning Sales, Opening Cash" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white" disabled={createSale.isPending}>
                    {createSale.isPending ? "Recording..." : "Save Entry"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-[2rem] shadow-3d border-none card-3d no-default-hover-elevate">
          <Button variant="ghost" size="icon" onClick={prevDay} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">
              {isSameDay(viewDate, new Date()) ? "TODAY" : format(viewDate, "EEEE").toUpperCase()}
            </p>
            <p className="font-heading font-black text-xl tracking-tight">{format(viewDate, "dd MMM yyyy")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={nextDay} disabled={isSameDay(viewDate, new Date())} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-20">
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Total Card */}
        <Card className="bg-slate-900 text-white border-none shadow-2xl card-3d overflow-hidden rounded-[2rem]">
          <CardContent className="p-8 flex items-center justify-between relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Banknote size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-400" />
                Total for this day
              </p>
              <h2 className="text-4xl font-black tracking-tight">Rs.{totalViewDate.toLocaleString()}</h2>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md shadow-inner relative z-10">
              <Banknote className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 pb-20">
          <h3 className="font-heading font-semibold text-lg px-2">Entries</h3>
          
          {isLoading ? (
            <div className="text-center py-8">Loading entries...</div>
          ) : selectedSales.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
              <p className="text-gray-500">No entries for this date</p>
            </div>
          ) : (
            selectedSales.map((sale) => (
              <div key={sale.id} className="card-3d bg-white dark:bg-slate-900 p-5 border-none flex items-center justify-between group overflow-hidden relative">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${sale.type === 'cash_in_hand' ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl shadow-inner ${sale.type === 'cash_in_hand' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 dark:text-white text-lg leading-none mb-1.5">
                      {sale.description || (sale.type === 'cash_in_hand' ? "Cash In Hand" : "Daily Sale")}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                      {sale.type === 'cash_in_hand' ? "Cash In Hand" : "Daily Cash Sale"} • {sale.date ? format(new Date(sale.date), "h:mm a") : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-black ${sale.type === 'cash_in_hand' ? 'text-blue-600' : 'text-indigo-600'}`}>
                    +Rs.{Number(sale.amount).toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-300 hover:text-primary" onClick={() => handleEdit(sale)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-300 hover:text-destructive" onClick={() => handleDelete(sale.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
