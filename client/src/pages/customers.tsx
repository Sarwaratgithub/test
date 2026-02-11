import { useState } from "react";
import { Layout } from "@/components/layout";
import { useCustomers, useCreateCustomer } from "@/hooks/use-customers";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, UserPlus, Phone, Loader2, ArrowRight, Users } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
import { z } from "zod";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomers(search);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const createCustomer = useCreateCustomer();

  const form = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const onSubmit = (data: z.infer<typeof insertCustomerSchema>) => {
    createCustomer.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold">Udhar Khata</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary shadow-lg shadow-primary/25">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone" type="tel" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createCustomer.isPending}>
                    {createCustomer.isPending ? "Adding..." : "Add Customer"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-11 bg-white dark:bg-slate-900 border-none shadow-3d h-14 rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4 pb-20">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : customers?.length === 0 ? (
            <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Users className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white uppercase tracking-tight">No customers found</h3>
              <p className="text-sm text-gray-500 mt-2">Add a new customer to start udhar khata</p>
            </div>
          ) : (
            customers?.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="hover-elevate active-elevate-2 card-3d border-none mb-4 overflow-hidden group">
                  <div className="p-5 flex items-center justify-between relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-xl shadow-inner border border-primary/10">
                        {customer.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white leading-tight">{customer.name}</h3>
                        {customer.phone && (
                          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right relative z-10">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Balance</p>
                      <p className={`font-black text-lg ${Number(customer.totalBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Rs.{Number(customer.totalBalance).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
