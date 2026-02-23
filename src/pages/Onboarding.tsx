import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    workout_days_per_week: "3",
    goal: "",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await supabase.from("profiles").update({
        full_name: form.full_name || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        activity_level: form.activity_level || null,
        workout_days_per_week: parseInt(form.workout_days_per_week),
        goal: form.goal || null,
        onboarding_complete: true,
      }).eq("user_id", user.id);

      // Generate plans
      await supabase.functions.invoke("generate-plans", {
        body: { userId: user.id },
      });

      navigate("/dashboard", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 0: Basics
    <div key="basics" className="space-y-4 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">About you</h2>
        <p className="text-sm text-muted-foreground">We'll use this to shape your plan.</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="What should we call you?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Age</Label>
            <Input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="28" />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Height (cm)</Label>
            <Input type="number" value={form.height_cm} onChange={(e) => update("height_cm", e.target.value)} placeholder="175" />
          </div>
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" value={form.weight_kg} onChange={(e) => update("weight_kg", e.target.value)} placeholder="70" />
          </div>
        </div>
      </div>
    </div>,

    // Step 1: Activity & goals
    <div key="goals" className="space-y-4 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Your routine</h2>
        <p className="text-sm text-muted-foreground">This helps us find the right intensity and structure.</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Activity level</Label>
          <Select value={form.activity_level} onValueChange={(v) => update("activity_level", v)}>
            <SelectTrigger><SelectValue placeholder="How active are you?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary — mostly sitting</SelectItem>
              <SelectItem value="light">Light — walking, light tasks</SelectItem>
              <SelectItem value="moderate">Moderate — regular movement</SelectItem>
              <SelectItem value="active">Active — frequent exercise</SelectItem>
              <SelectItem value="very_active">Very active — intense daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Workout days per week</Label>
          <Select value={form.workout_days_per_week} onValueChange={(v) => update("workout_days_per_week", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5, 6].map((d) => (
                <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Goal</Label>
          <Select value={form.goal} onValueChange={(v) => update("goal", v)}>
            <SelectTrigger><SelectValue placeholder="What are you working toward?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fat_loss">Lose fat</SelectItem>
              <SelectItem value="muscle_gain">Build muscle</SelectItem>
              <SelectItem value="maintenance">Stay where I am</SelectItem>
              <SelectItem value="general_fitness">General fitness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>,
  ];

  const canProceed = step === 0
    ? form.age && form.gender
    : form.activity_level && form.goal;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {steps[step]}

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!canProceed || saving} className="flex-1">
              {saving ? "Setting up your plan..." : "Get my plan"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
