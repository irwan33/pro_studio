import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-studio-bg p-6">
      <form className="w-full max-w-md border border-studio-border bg-studio-panel p-6">
        <h1 className="font-display text-3xl">Forgot password</h1>
        <p className="mt-2 text-sm text-studio-secondaryText">Enter your email and a reset flow will be created.</p>
        <div className="mt-6 space-y-3">
          <Input type="email" placeholder="Email" />
          <Button variant="primary" className="w-full">Send reset link</Button>
        </div>
      </form>
    </main>
  );
}
