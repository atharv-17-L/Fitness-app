import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

const MEAL_ORDER = ["breakfast", "snack_am", "lunch", "snack_pm", "dinner"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  snack_am: "Morning snack",
  lunch: "Lunch",
  snack_pm: "Afternoon snack",
  dinner: "Dinner",
};

export default function DietPlan() {
  const { user } = useAuth();

  const { data: meals, isLoading } = useQuery({
    queryKey: ["diet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("diet_plans")
        .select("*")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const grouped = MEAL_ORDER.map((type) => ({
    type,
    label: MEAL_LABELS[type] || type,
    items: meals?.filter((m) => m.meal_type === type) || [],
  })).filter((g) => g.items.length > 0);

  const totalCals = meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0;
  const totalProtein = meals?.reduce((sum, m) => sum + Number(m.protein_g || 0), 0) || 0;
  const totalCarbs = meals?.reduce((sum, m) => sum + Number(m.carbs_g || 0), 0) || 0;
  const totalFat = meals?.reduce((sum, m) => sum + Number(m.fat_g || 0), 0) || 0;

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-6 space-y-5">
        <div className="space-y-1 animate-fade-in">
          <h1 className="text-xl font-semibold">Diet plan</h1>
          <p className="text-sm text-muted-foreground">Your daily meals. Flexible, not rigid.</p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading meals...</div>
        ) : !meals?.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No diet plan yet. Complete your profile to get personalized meals.
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* Macros summary */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Calories", value: `${totalCals}` },
                { label: "Protein", value: `${Math.round(totalProtein)}g` },
                { label: "Carbs", value: `${Math.round(totalCarbs)}g` },
                { label: "Fat", value: `${Math.round(totalFat)}g` },
              ].map(({ label, value }) => (
                <div key={label} className="p-2.5 rounded-lg bg-secondary/50 text-center">
                  <p className="text-base font-semibold">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Meals */}
            {grouped.map(({ type, label, items }) => (
              <div key={type} className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</h3>
                {items.map((meal) => (
                  <div key={meal.id} className="p-3 rounded-lg bg-card border">
                    <p className="text-sm font-medium">{meal.meal_name}</p>
                    {meal.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{meal.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      {meal.calories && <span>{meal.calories} cal</span>}
                      {meal.protein_g && <span>{meal.protein_g}g protein</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
