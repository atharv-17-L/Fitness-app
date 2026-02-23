import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
}

export default function WorkoutPlan() {
  const { user } = useAuth();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ["workouts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user!.id)
        .order("day_of_week");
      return data || [];
    },
    enabled: !!user,
  });

  const todayIndex = new Date().getDay();
  const todayWorkout = workouts?.find((w) => w.day_of_week === todayIndex);
  const defaultTab = todayWorkout?.id || workouts?.[0]?.id || "";

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-6 space-y-5">
        <div className="space-y-1 animate-fade-in">
          <h1 className="text-xl font-semibold">Workout plan</h1>
          <p className="text-sm text-muted-foreground">Your weekly training schedule.</p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading plan...</div>
        ) : !workouts?.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No workout plan yet. Complete your profile setup to get one.
          </div>
        ) : (
          <Tabs defaultValue={defaultTab} className="animate-fade-in">
            <TabsList className="w-full justify-start overflow-x-auto bg-transparent gap-1 px-0">
              {workouts.map((w) => (
                <TabsTrigger
                  key={w.id}
                  value={w.id}
                  className="text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {w.day_label}
                </TabsTrigger>
              ))}
            </TabsList>

            {workouts.map((w) => {
              const exercises = (w.exercises as unknown as Exercise[]) || [];
              return (
                <TabsContent key={w.id} value={w.id} className="mt-4 space-y-2">
                  {exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-medium">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.sets} sets × {ex.reps}
                          {ex.notes ? ` · ${ex.notes}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
