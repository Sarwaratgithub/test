import { useState } from "react";
import { Layout } from "@/components/layout";
import { useSales, useCreateSale } from "@/hooks/use-sales";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Banknote, Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSaleSchema } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom schema to handle string->number coercion for amount
const saleFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  type: z.enum(["cash_sale", "cash_in"]),
  description: z.string().optional(),
  date: z.string(),
});

export default function SalesPage() {
  const { data: sales, isLoading } = useSales();
  const createSale = useCreateSale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const form = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      amount: 0,
      type: "cash_sale",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: z.infer<typeof saleFormSchema>) => {
    const submitData = {
      ...data,
      amount: String(data.amount),
    };
    createSale.mutate(submitData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset({
          amount: 0,
          type: "cash_sale",
          description: "",
          date: format(new Date(), "yyyy-MM-dd"),
        });
      },
    });
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-3d btn-3d rounded-xl px-4 py-6">
                <Plus className="h-5 w-5 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sales/Cash Entry</DialogTitle>
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
                            <SelectItem value="cash_in">Other Cash In</SelectItem>
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
                          <Input placeholder="e.g. Morning Sales, Opening Cash" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={createSale.isPending}>
                    {createSale.isPending ? "Recording..." : "Save Entry"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border">
          <Button variant="ghost" size="icon" onClick={prevDay}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">
              {isSameDay(viewDate, new Date()) ? "Today" : format(viewDate, "EEEE")}
            </p>
            <p className="font-heading font-bold">{format(viewDate, "dd MMM yyyy")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={nextDay} disabled={isSameDay(viewDate, new Date())}>
            <ArrowRight className="h-5 w-5" />
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
              <div key={sale.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${sale.type === 'cash_in' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-none mb-1">
                      {sale.description || (sale.type === 'cash_in' ? "Cash In" : "Cash Sale")}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                      {sale.type === 'cash_in' ? "Cash In" : "Daily Sale"} • {sale.date ? format(new Date(sale.date), "h:mm a") : "N/A"}
                    </p>
                  </div>
                </div>
                <span className={`font-black ${sale.type === 'cash_in' ? 'text-blue-600' : 'text-green-600'}`}>
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
