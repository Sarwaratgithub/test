import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useSales } from "@/hooks/use-sales";
import { useCustomers } from "@/hooks/use-customers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, TrendingUp, Users, ReceiptText } from "lucide-react";
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
          <Card className="primary-gradient border-none card-3d overflow-hidden">
            <CardContent className="p-4 flex flex-col justify-between h-32 relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                <TrendingUp size={80} />
              </div>
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Today
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-green-100 uppercase tracking-tighter">Total Sales</p>
                <h3 className="text-2xl font-black mt-1">
                  Rs.{salesLoading ? "..." : todaysSales.toLocaleString()}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none card-3d overflow-hidden">
            <CardContent className="p-4 flex flex-col justify-between h-32 relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 text-red-600">
                <Users size={80} />
              </div>
              <div className="flex justify-between items-start">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Market Udhar</p>
                <h3 className="text-2xl font-black mt-1 text-red-600">
                  Rs.{customersLoading ? "..." : totalUdhar.toLocaleString()}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <Link href="/sales">
            <Button size="lg" className="w-full h-16 text-base bg-white text-foreground border-none shadow-3d hover:bg-gray-50 flex flex-col items-center justify-center gap-0 btn-3d rounded-2xl">
              <Plus className="h-5 w-5 text-primary mb-1" />
              <span className="font-bold text-[10px] uppercase">Sale</span>
            </Button>
          </Link>
          <Link href="/customers">
            <Button size="lg" className="w-full h-16 text-base bg-primary text-primary-foreground border-none shadow-3d flex flex-col items-center justify-center gap-0 btn-3d rounded-2xl">
              <Plus className="h-5 w-5 mb-1" />
              <span className="font-bold text-[10px] uppercase">Khata</span>
            </Button>
          </Link>
          <Link href="/ledger">
            <Button size="lg" className="w-full h-16 text-base bg-white text-foreground border-none shadow-3d hover:bg-gray-50 flex flex-col items-center justify-center gap-0 btn-3d rounded-2xl">
              <ReceiptText className="h-5 w-5 text-primary mb-1" />
              <span className="font-bold text-[10px] uppercase">Ledger</span>
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
                      {sale.date ? format(new Date(sale.date), "h:mm a") : "N/A"}
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
