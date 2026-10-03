import { SignUp } from "@clerk/nextjs";
import { AuthNotConfigured } from "@/app/components/AuthNotConfigured";
import { isClerkConfigured } from "@/app/lib/runtimeConfig";

export default function SignUpPage() {
  if (!isClerkConfigured()) return <AuthNotConfigured />;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignUp />
    </main>
  );
}
