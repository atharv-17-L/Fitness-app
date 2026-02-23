import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [regenerating, setRegenerating] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const getVal = (key: string) => form[key] ?? (profile as any)?.[key]?.toString() ?? "";
  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = {};
      if (form.full_name !== undefined) updates.full_name = form.full_name;
      if (form.age !== undefined) updates.age = parseInt(form.age);
      if (form.height_cm !== undefined) updates.height_cm = parseFloat(form.height_cm);
      if (form.weight_kg !== undefined) updates.weight_kg = parseFloat(form.weight_kg);
      if (form.activity_level !== undefined) updates.activity_level = form.activity_level;
      if (form.workout_days_per_week !== undefined) updates.workout_days_per_week = parseInt(form.workout_days_per_week);
      if (form.goal !== undefined) updates.goal = form.goal;

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("user_id", user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setForm({});
    },
  });

  const regeneratePlans = async () => {
    setRegenerating(true);
    try {
      await supabase.functions.invoke("generate-plans", {
        body: { userId: user!.id },
      });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["diet"] });
      queryClient.invalidateQueries({ queryKey: ["today-workout"] });
    } finally {
      setRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="px-5 pt-12 text-sm text-muted-foreground">Loading...</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-6 space-y-6">
        <div className="space-y-1 animate-fade-in">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Update your details or regenerate plans.</p>
        </div>

        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={getVal("full_name")} onChange={(e) => update("full_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input type="number" value={getVal("age")} onChange={(e) => update("age", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
              <Input type="number" value={getVal("weight_kg")} onChange={(e) => update("weight_kg", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Height (cm)</Label>
              <Input type="number" value={getVal("height_cm")} onChange={(e) => update("height_cm", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Days/week</Label>
              <Select value={getVal("workout_days_per_week")} onValueChange={(v) => update("workout_days_per_week", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Activity level</Label>
            <Select value={getVal("activity_level")} onValueChange={(v) => update("activity_level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="very_active">Very active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Select value={getVal("goal")} onValueChange={(v) => update("goal", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fat_loss">Lose fat</SelectItem>
                <SelectItem value="muscle_gain">Build muscle</SelectItem>
                <SelectItem value="maintenance">Maintain</SelectItem>
                <SelectItem value="general_fitness">General fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || Object.keys(form).length === 0}
              className="flex-1"
            >
              {saveMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              variant="outline"
              onClick={regeneratePlans}
              disabled={regenerating}
              className="flex-1"
            >
              {regenerating ? "Generating..." : "New plan"}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-3">{user?.email}</p>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
