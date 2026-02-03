import { ReactNode } from "react";
import { NavBar } from "@/components/nav-bar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <NavBar />
      <main className="container mx-auto max-w-lg px-4 pt-4 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
