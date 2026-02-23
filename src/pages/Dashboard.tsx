import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Dumbbell, UtensilsCrossed, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
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

  const { data: todayWorkout } = useQuery({
    queryKey: ["today-workout", user?.id],
    queryFn: async () => {
      const dayOfWeek = new Date().getDay();
      const { data } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user!.id)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: latestProgress } = useQuery({
    queryKey: ["latest-progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("progress_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const goalLabel: Record<string, string> = {
    fat_loss: "Losing fat",
    muscle_gain: "Building muscle",
    maintenance: "Maintaining",
    general_fitness: "General fitness",
  };

  const exercises = (todayWorkout?.exercises as unknown as Array<{ name: string; sets: number; reps: string }>) || [];

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-6 space-y-6">
        {/* Header */}
        <div className="space-y-1 animate-fade-in">
          <h1 className="text-xl font-semibold">Hey, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.goal ? goalLabel[profile.goal] || profile.goal : "Let's keep going."}
          </p>
        </div>

        {/* Quick cards */}
        <div className="space-y-3">
          {/* Today's workout */}
          <button
            onClick={() => navigate("/workout")}
            className="w-full text-left p-4 rounded-xl bg-card border transition-colors hover:border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Today's workout</p>
                {todayWorkout ? (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {todayWorkout.day_label} · {exercises.length} exercises
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Rest day — take it easy.
                  </p>
                )}
              </div>
            </div>
          </button>

          {/* Diet */}
          <button
            onClick={() => navigate("/diet")}
            className="w-full text-left p-4 rounded-xl bg-card border transition-colors hover:border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Meals for today</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  View your daily meal plan
                </p>
              </div>
            </div>
          </button>

          {/* Progress */}
          <button
            onClick={() => navigate("/progress")}
            className="w-full text-left p-4 rounded-xl bg-card border transition-colors hover:border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Progress</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {latestProgress
                    ? `Last logged: ${latestProgress.weight_kg}kg`
                    : "Start logging your progress"}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Stats row */}
        {profile && (
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            {[
              { label: "Weight", value: profile.weight_kg ? `${profile.weight_kg}kg` : "—" },
              { label: "Days/week", value: profile.workout_days_per_week || "—" },
              { label: "Height", value: profile.height_cm ? `${profile.height_cm}cm` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-lg bg-secondary/50 text-center">
                <p className="text-lg font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
