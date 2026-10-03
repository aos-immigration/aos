import { DEMO_BANNER, DEMO_COOKIE } from "@/app/lib/demoCouple";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function startDemo() {
  "use server";
  const jar = await cookies();
  jar.set(DEMO_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: false });
  redirect("/sections");
}

export default function DemoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl space-y-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
          Fictional sample
        </p>
        <h1 className="text-4xl font-semibold">Jordan Sampleton and Avery Exampleton</h1>
        <p className="text-muted-foreground">{DEMO_BANNER}</p>
        <form action={startDemo}>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground"
          >
            Explore the sample couple
          </button>
        </form>
      </div>
    </main>
  );
}
