import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, Save, Phone, Lock } from "lucide-react";

const settingsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  username: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(4, "PIN must be at least 4 digits").optional().or(z.literal("")),
});

export default function SettingsPage() {
  const { user, logout, updateProfile, isUpdating } = useAuth();

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shopName: user?.shopName || "",
      ownerName: user?.ownerName || "",
      username: user?.username || "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    const updates: any = {
      shopName: data.shopName,
      ownerName: data.ownerName,
      username: data.username,
    };
    if (data.password) {
      updates.password = data.password;
    }
    updateProfile(updates);
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold">Shop Settings</h2>

        <Card className="border-none shadow-sm card-3d bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg">Profile & Security</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl border-2 focus:border-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl border-2 focus:border-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Mobile Number
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 03001234567" className="rounded-xl border-2 focus:border-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Change PIN (Leave empty to keep current)
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Enter new 4-digit PIN" className="rounded-xl border-2 focus:border-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full mt-6 bg-primary shadow-3d btn-3d rounded-xl py-6 font-bold" disabled={isUpdating}>
                  <Save className="h-5 w-5 mr-2" />
                  {isUpdating ? "Saving..." : "Save All Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button 
            variant="destructive" 
            className="w-full h-14 shadow-3d btn-3d rounded-xl font-bold"
            onClick={() => logout()}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout from {user.shopName}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-6 font-bold uppercase tracking-widest">
            Kirana Asaan v1.0.0
          </p>
        </div>
      </div>
    </Layout>
  );
}
