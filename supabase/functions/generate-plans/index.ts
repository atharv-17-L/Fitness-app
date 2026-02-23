import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) throw new Error("userId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    const prompt = `You are a practical fitness coach. Based on this person's data, create a realistic workout plan and diet plan.

Person:
- Age: ${profile.age || "unknown"}
- Gender: ${profile.gender || "unknown"}
- Height: ${profile.height_cm || "unknown"} cm
- Weight: ${profile.weight_kg || "unknown"} kg
- Activity level: ${profile.activity_level || "moderate"}
- Available workout days: ${profile.workout_days_per_week || 3} per week
- Goal: ${profile.goal || "general_fitness"}

Return a JSON object with this exact structure:
{
  "workouts": [
    {
      "day_of_week": 1,
      "day_label": "Monday — Upper Body",
      "exercises": [
        { "name": "Bench Press", "sets": 3, "reps": "8-10", "notes": "Use moderate weight" }
      ]
    }
  ],
  "meals": [
    {
      "meal_type": "breakfast",
      "meal_name": "Oatmeal with banana",
      "description": "Rolled oats with sliced banana and honey",
      "calories": 350,
      "protein_g": 12,
      "carbs_g": 55,
      "fat_g": 8
    }
  ]
}

Rules:
- Workouts should match the available days. Use day_of_week 1=Monday through 7=Sunday.
- Include 4-6 exercises per workout day.
- Diet should have 5 meals: breakfast, snack_am, lunch, snack_pm, dinner.
- Use everyday foods. Nothing exotic or hard to find.
- Calories and macros should align with the goal.
- Be realistic. No extreme diets or dangerous intensity.
- Return ONLY the JSON, no markdown.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Clean markdown fencing if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const plan = JSON.parse(content);

    // Delete old plans
    await supabase.from("workout_plans").delete().eq("user_id", userId);
    await supabase.from("diet_plans").delete().eq("user_id", userId);

    // Insert workouts
    if (plan.workouts?.length) {
      const workoutRows = plan.workouts.map((w: any) => ({
        user_id: userId,
        day_of_week: w.day_of_week,
        day_label: w.day_label,
        exercises: w.exercises,
      }));
      await supabase.from("workout_plans").insert(workoutRows);
    }

    // Insert meals
    if (plan.meals?.length) {
      const mealRows = plan.meals.map((m: any) => ({
        user_id: userId,
        meal_type: m.meal_type,
        meal_name: m.meal_name,
        description: m.description || null,
        calories: m.calories || null,
        protein_g: m.protein_g || null,
        carbs_g: m.carbs_g || null,
        fat_g: m.fat_g || null,
      }));
      await supabase.from("diet_plans").insert(mealRows);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating plans:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
