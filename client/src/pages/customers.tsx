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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-9 bg-white border-none shadow-sm h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3 pb-20">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="font-medium text-gray-900">No customers found</h3>
              <p className="text-sm text-gray-500 mt-1">Add a new customer to start udhar khata</p>
            </div>
          ) : (
            customers?.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-none shadow-sm mb-3">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        {customer.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className={`font-bold ${Number(customer.totalBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Rs.{Number(customer.totalBalance).toLocaleString()}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
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
