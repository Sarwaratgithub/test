import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useSales } from "@/hooks/use-sales";
import { useCustomers } from "@/hooks/use-customers";
import { useTransactions } from "@/hooks/use-transactions";
import { usePurchases, useExpenses } from "@/hooks/use-ledger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, TrendingUp, Users, ReceiptText, Flame } from "lucide-react";
import { Link } from "wouter";
import { format, isSameDay } from "date-fns";

export default function HomePage() {
  const { user } = useAuth();
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: transactions, isLoading: txsLoading } = useTransactions();
  const { data: purchases, isLoading: purchasesLoading } = usePurchases();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();

  const isToday = (date: string | Date | null | undefined) => {
    if (!date) return false;
    return isSameDay(new Date(date), new Date());
  };

  // Calculate stats
  const todaysSales = sales?.filter(s => isToday(s.date)) || [];
  const todaysSalesTotal = todaysSales.reduce((sum, s) => sum + Number(s.amount), 0);

  const todaysPayments = transactions?.filter(t => t.type === 'receive' && isToday(t.date)) || [];
  const todaysPaymentsTotal = todaysPayments.reduce((sum, t) => sum + Number(t.amount), 0);

  const todaysPurchases = purchases?.filter(p => isToday(p.date)) || [];
  const todaysPurchasesTotal = todaysPurchases.reduce((sum, p) => sum + Number(p.amount), 0);

  const todaysExpenses = expenses?.filter(e => isToday(e.date)) || [];
  const todaysExpensesTotal = todaysExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const netTodaysSales = todaysSalesTotal + todaysPaymentsTotal - todaysPurchasesTotal - todaysExpensesTotal;

  const totalUdhar = customers?.reduce((sum, c) => sum + Number(c.totalBalance), 0) || 0;

  const recentSales = sales?.slice(0, 3) || [];

  const isLoading = salesLoading || customersLoading || txsLoading || purchasesLoading || expensesLoading;

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Quick Stats Grid */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-heading font-black text-gray-900 uppercase tracking-tight">Dashboard</h2>
          {user?.loginStreak !== undefined && user.loginStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 animate-pulse">
              <Flame className="h-4 w-4 text-orange-600 fill-orange-600" />
              <span className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                {user.loginStreak} Day Streak
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="primary-gradient border-none card-3d overflow-hidden ring-4 ring-blue-500/20">
            <CardContent className="p-5 flex flex-col justify-between h-40 relative">
              <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12 translate-x-4 -translate-y-4">
                <TrendingUp size={100} />
              </div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/30 rounded-2xl backdrop-blur-md shadow-inner">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black bg-white/30 px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
                  Today
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-blue-100 uppercase tracking-widest opacity-80">Total Sales</p>
                <h3 className="text-3xl font-black mt-1 drop-shadow-md">
                  Rs.{isLoading ? "..." : netTodaysSales.toLocaleString()}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-none card-3d overflow-hidden ring-4 ring-red-500/10">
            <CardContent className="p-5 flex flex-col justify-between h-40 relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform -rotate-12 translate-x-4 -translate-y-4 text-red-600">
                <Users size={100} />
              </div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl shadow-inner">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-[10px] font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full uppercase tracking-widest">
                  Credit
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-80">Total Udhar</p>
                <h3 className="text-3xl font-black mt-1 text-red-600 drop-shadow-sm">
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
            <Button size="lg" className="w-full h-16 text-base bg-secondary text-secondary-foreground border-none shadow-3d flex flex-col items-center justify-center gap-0 btn-3d rounded-2xl">
              <Plus className="h-5 w-5 mb-1" />
              <span className="font-bold text-[10px] uppercase">Khata</span>
            </Button>
          </Link>
          <Link href="/ledger">
            <Button size="lg" className="w-full h-16 text-base bg-accent text-accent-foreground border-none shadow-3d flex flex-col items-center justify-center gap-0 btn-3d rounded-2xl">
              <ReceiptText className="h-5 w-5 mb-1" />
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
