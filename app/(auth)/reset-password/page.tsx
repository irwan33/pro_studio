import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-studio-bg p-6">
      <form className="w-full max-w-md border border-studio-border bg-studio-panel p-6">
        <h1 className="font-display text-3xl">Reset password</h1>
        <div className="mt-6 space-y-3">
          <Input placeholder="Reset token" />
          <Input type="password" placeholder="New password" />
          <Button variant="primary" className="w-full">Reset password</Button>
        </div>
      </form>
    </main>
  );
}
