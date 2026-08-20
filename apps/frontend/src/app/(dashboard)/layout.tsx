import type { ReactNode } from "react";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { Sidebar } from "@/features/shell/components/Sidebar";
import { Topbar } from "@/features/shell/components/Topbar";
import { ToastProvider } from "@/features/shell/components/ToastProvider";
import { GlobalModal } from "@/features/shell/components/GlobalModal";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <Topbar />
            <main className="mx-auto max-w-370 p-4 sm:p-5.5">{children}</main>
          </div>
        </div>
        <GlobalModal />
      </ToastProvider>
    </AuthGate>
  );
}
