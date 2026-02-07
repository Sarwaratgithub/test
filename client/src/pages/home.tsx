import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useSales } from "@/hooks/use-sales";
import { useCustomers } from "@/hooks/use-customers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function HomePage() {
  const { user } = useAuth();
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: customers, isLoading: customersLoading } = useCustomers();

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  
  const todaysSales = sales?.filter(s => 
    new Date(s.date!).toISOString().split('T')[0] === today
  ).reduce((sum, s) => sum + Number(s.amount), 0) || 0;

  const totalUdhar = customers?.reduce((sum, c) => sum + Number(c.totalBalance), 0) || 0;

  const recentSales = sales?.slice(0, 3) || [];

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-lg shadow-green-500/20">
            <CardContent className="p-4 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                  Today
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-green-100">Total Sales</p>
                <h3 className="text-2xl font-bold mt-1">
                  Rs.{salesLoading ? "..." : todaysSales.toLocaleString()}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-red-100 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Udhar</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">
                  Rs.{customersLoading ? "..." : totalUdhar.toLocaleString()}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/sales">
            <Button size="lg" className="w-full h-14 text-base bg-white text-foreground border shadow-sm hover:bg-gray-50 flex gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Sale
            </Button>
          </Link>
          <Link href="/customers">
            <Button size="lg" className="w-full h-14 text-base bg-primary text-primary-foreground shadow-md shadow-primary/20 flex gap-2">
              <Plus className="h-5 w-5" />
              New Khata
            </Button>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-lg">Recent Sales</h3>
            <Link href="/sales" className="text-sm text-primary font-medium flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {salesLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))
            ) : recentSales.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                <p className="text-muted-foreground text-sm">No sales recorded yet</p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {sale.description || "Cash Sale"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sale.date!), "h:mm a")}
                    </p>
                  </div>
                  <span className="font-bold text-green-600">
                    +Rs.{Number(sale.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
