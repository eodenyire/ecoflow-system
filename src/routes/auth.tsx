import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — TakaFlow" }, { name: "description", content: "Access your TakaFlow account." }] }),
  component: AuthPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8, "At least 8 characters").max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Check your email to confirm.");
    router.navigate({ to: "/dashboard" });
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    router.navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <Toaster />
      <div className="relative hidden flex-col justify-between bg-gradient-hero p-12 text-primary-foreground md:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Leaf className="h-5 w-5" /></span>
          <span className="font-display text-lg font-bold">TakaFlow</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">Every pickup. Every kilogram. Every collector — one platform.</h1>
          <p className="mt-4 max-w-md text-white/70">Join the circular waste movement, starting with your street.</p>
        </div>
        <div className="text-xs text-white/50">© {new Date().getFullYear()} TakaFlow</div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in or create an account to continue.</p>

          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <Field label="Email" name="email" type="email" required />
                <Field label="Password" name="password" type="password" required />
                <Button disabled={loading} className="w-full bg-gradient-leaf text-primary-foreground">{loading ? "…" : "Sign in"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <Field label="Full name" name="full_name" required />
                <Field label="Phone" name="phone" type="tel" placeholder="+254…" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Password" name="password" type="password" required />
                <Button disabled={loading} className="w-full bg-gradient-leaf text-primary-foreground">{loading ? "…" : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} autoComplete={type === "password" ? "current-password" : undefined} />
    </div>
  );
}
