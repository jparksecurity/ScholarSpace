import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  // This is redundant since middleware handles it, but good for explicit checking
  if (!userId) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
          <p className="text-muted-foreground">
            You're now authenticated and can access protected content.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">Your Studies</h2>
          <p className="text-muted-foreground">
            Manage your academic resources and progress.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">Collaborate</h2>
          <p className="text-muted-foreground">
            Connect with other scholars and share knowledge.
          </p>
        </div>
      </div>
    </div>
  );
} 