import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Leaf, MapPin, Plus, Truck, BarChart3, Recycle, Clock, CheckCircle2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TakaFlow" }] }),
  component: Dashboard,
});

type Pickup = {
  id: string;
  citizen_id: string;
  collector_id: string | null;
  address: string;
  waste_type: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  estimated_weight_kg: number | null;
  actual_weight_kg: number | null;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
};

const wasteTypes = ["organic", "plastic", "metal", "glass", "paper", "mixed", "hazardous", "e_waste"] as const;

function Dashboard() {
  const { user, roles, loading, isAdmin, isCollector } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Leaf className="mr-2 h-4 w-4 animate-pulse" /> Loading…
      </div>
    );
  }

  // Default tab logic: admin > collector > citizen
  const defaultTab = isAdmin ? "admin" : isCollector ? "collector" : "citizen";

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Operations</h1>
            <p className="text-sm text-muted-foreground">Signed in as {user.email} · {roles.join(", ") || "citizen"}</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="citizen"><Recycle className="mr-1 h-4 w-4" /> Citizen</TabsTrigger>
            {isCollector && <TabsTrigger value="collector"><Truck className="mr-1 h-4 w-4" /> Collector</TabsTrigger>}
            {isAdmin && <TabsTrigger value="admin"><BarChart3 className="mr-1 h-4 w-4" /> Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="citizen" className="mt-6"><CitizenPanel userId={user.id} /></TabsContent>
          {isCollector && <TabsContent value="collector" className="mt-6"><CollectorPanel userId={user.id} /></TabsContent>}
          {isAdmin && <TabsContent value="admin" className="mt-6"><AdminPanel /></TabsContent>}
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- CITIZEN ---------------- */

const pickupSchema = z.object({
  address: z.string().trim().min(3).max(300),
  waste_type: z.enum(wasteTypes),
  estimated_weight_kg: z.coerce.number().min(0).max(1000).optional(),
  scheduled_at: z.string().optional(),
  notes: z.string().max(500).optional(),
});

function CitizenPanel({ userId }: { userId: string }) {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("pickup_requests")
      .select("*")
      .eq("citizen_id", userId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setPickups((data ?? []) as Pickup[]);
  }
  useEffect(() => { load(); }, [userId]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd);
    const parsed = pickupSchema.safeParse(raw);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("pickup_requests").insert({
      citizen_id: userId,
      address: parsed.data.address,
      waste_type: parsed.data.waste_type,
      estimated_weight_kg: parsed.data.estimated_weight_kg,
      scheduled_at: parsed.data.scheduled_at || null,
      notes: parsed.data.notes || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Pickup requested 🌿");
    form.reset();
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
        <h2 className="font-display text-xl font-semibold">Request a pickup</h2>
        <p className="mt-1 text-sm text-muted-foreground">A nearby collector will accept it shortly.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="address">Pickup address</Label>
            <Input id="address" name="address" placeholder="House #, street, estate" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Waste type</Label>
              <Select name="waste_type" defaultValue="mixed">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {wasteTypes.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimated_weight_kg">Est. weight (kg)</Label>
              <Input id="estimated_weight_kg" name="estimated_weight_kg" type="number" step="0.1" min="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scheduled_at">Schedule (optional)</Label>
            <Input id="scheduled_at" name="scheduled_at" type="datetime-local" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Gate code, special items…" />
          </div>
          <Button disabled={submitting} className="w-full bg-gradient-leaf text-primary-foreground">
            <Plus className="mr-1 h-4 w-4" /> {submitting ? "Submitting…" : "Request pickup"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Your pickups</h2>
        <div className="mt-4 space-y-3">
          {pickups.length === 0 && <EmptyState text="No pickups yet — request your first above." />}
          {pickups.map((p) => <PickupCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}

/* ---------------- COLLECTOR ---------------- */

function CollectorPanel({ userId }: { userId: string }) {
  const [available, setAvailable] = useState<Pickup[]>([]);
  const [mine, setMine] = useState<Pickup[]>([]);

  async function load() {
    const [{ data: a }, { data: m }] = await Promise.all([
      supabase.from("pickup_requests").select("*").is("collector_id", null).eq("status", "pending").order("created_at"),
      supabase.from("pickup_requests").select("*").eq("collector_id", userId).order("created_at", { ascending: false }),
    ]);
    setAvailable((a ?? []) as Pickup[]);
    setMine((m ?? []) as Pickup[]);
  }
  useEffect(() => { load(); }, [userId]);

  async function accept(id: string) {
    const { error } = await supabase.from("pickup_requests").update({ collector_id: userId, status: "assigned" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Job accepted");
    load();
  }
  async function setStatus(id: string, status: Pickup["status"]) {
    const patch: { status: Pickup["status"]; completed_at?: string } = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("pickup_requests").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-xl font-semibold">Available jobs</h2>
        <div className="mt-4 space-y-3">
          {available.length === 0 && <EmptyState text="No open jobs right now." />}
          {available.map((p) => (
            <PickupCard key={p.id} p={p} action={<Button size="sm" onClick={() => accept(p.id)}>Accept</Button>} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold">My jobs</h2>
        <div className="mt-4 space-y-3">
          {mine.length === 0 && <EmptyState text="No assigned jobs yet." />}
          {mine.map((p) => (
            <PickupCard key={p.id} p={p} action={
              <div className="flex gap-2">
                {p.status === "assigned" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "in_progress")}>Start</Button>}
                {p.status !== "completed" && p.status !== "cancelled" && <Button size="sm" onClick={() => setStatus(p.id, "completed")}>Complete</Button>}
              </div>
            } />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- ADMIN ---------------- */

function AdminPanel() {
  const [all, setAll] = useState<Pickup[]>([]);
  const [collectors, setCollectors] = useState<{ user_id: string; full_name: string | null }[]>([]);

  async function load() {
    const { data: pickups } = await supabase.from("pickup_requests").select("*").order("created_at", { ascending: false }).limit(200);
    setAll((pickups ?? []) as Pickup[]);

    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "collector");
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) { setCollectors([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    setCollectors((profs ?? []).map((p) => ({ user_id: p.id, full_name: p.full_name })));
  }
  useEffect(() => { load(); }, []);

  const stats = {
    total: all.length,
    pending: all.filter((p) => p.status === "pending").length,
    inProgress: all.filter((p) => p.status === "in_progress" || p.status === "assigned").length,
    completed: all.filter((p) => p.status === "completed").length,
    kg: all.reduce((s, p) => s + (Number(p.actual_weight_kg) || 0), 0),
  };

  async function assign(pickupId: string, collectorId: string) {
    const { error } = await supabase.from("pickup_requests").update({ collector_id: collectorId, status: "assigned" }).eq("id", pickupId);
    if (error) return toast.error(error.message);
    toast.success("Assigned");
    load();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={Package} label="Total pickups" value={stats.total} />
        <Stat icon={Clock} label="Pending" value={stats.pending} />
        <Stat icon={Truck} label="In progress" value={stats.inProgress} />
        <Stat icon={CheckCircle2} label="Completed" value={stats.completed} />
        <Stat icon={Recycle} label="Kg processed" value={stats.kg.toFixed(1)} />
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">All pickups</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Collector</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {all.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3"><div className="font-medium">{p.address}</div><div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div></td>
                  <td className="px-4 py-3 capitalize">{p.waste_type.replace("_", " ")}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    {collectors.find((c) => c.user_id === p.collector_id)?.full_name || (p.collector_id ? "—" : <span className="text-muted-foreground">unassigned</span>)}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "pending" && (
                      <Select onValueChange={(v) => assign(p.id, v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Assign collector" /></SelectTrigger>
                        <SelectContent>
                          {collectors.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No collectors yet</div>}
                          {collectors.map((c) => <SelectItem key={c.user_id} value={c.user_id}>{c.full_name || c.user_id.slice(0, 8)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
              {all.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No pickups in the system yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ---------------- shared ---------------- */

function PickupCard({ p, action }: { p: Pickup; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="truncate">{p.address}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="capitalize">{p.waste_type.replace("_", " ")}</Badge>
            <StatusBadge status={p.status} />
            {p.estimated_weight_kg ? <span>~{p.estimated_weight_kg} kg</span> : null}
            {p.scheduled_at && <span>· {new Date(p.scheduled_at).toLocaleString()}</span>}
          </div>
          {p.notes && <p className="mt-2 text-sm text-muted-foreground">{p.notes}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Pickup["status"] }) {
  const map: Record<Pickup["status"], string> = {
    pending: "bg-muted text-foreground",
    assigned: "bg-accent/20 text-accent-foreground",
    in_progress: "bg-primary/15 text-primary",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status.replace("_", " ")}</span>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
