import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { LogOut, Save } from "lucide-react";

const profileSchema = insertUserSchema.pick({
  shopName: true,
  ownerName: true,
});

export default function SettingsPage() {
  const { user, logout, updateProfile, isUpdating } = useAuth();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      shopName: user?.shopName || "",
      ownerName: user?.ownerName || "",
    },
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfile(data);
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold">Shop Settings</h2>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="shopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isUpdating}>
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button 
            variant="destructive" 
            className="w-full h-12 shadow-lg shadow-red-500/20"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout from {user.shopName}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Version 1.0.0 • Made with ❤️ for India
          </p>
        </div>
      </div>
    </Layout>
  );
}
