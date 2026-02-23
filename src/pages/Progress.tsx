import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";

export default function Progress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("progress_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const logMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("progress_logs").insert({
        user_id: user!.id,
        weight_kg: weight ? parseFloat(weight) : null,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["latest-progress"] });
      setWeight("");
      setNotes("");
    },
  });

  const chartData = (logs || [])
    .filter((l) => l.weight_kg)
    .map((l) => ({
      date: format(parseISO(l.logged_at), "MMM d"),
      weight: Number(l.weight_kg),
    }));

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-6 space-y-6">
        <div className="space-y-1 animate-fade-in">
          <h1 className="text-xl font-semibold">Progress</h1>
          <p className="text-sm text-muted-foreground">Track how things are going over time.</p>
        </div>

        {/* Log form */}
        <div className="p-4 rounded-xl bg-card border space-y-3 animate-fade-in">
          <h3 className="text-sm font-medium">Log today</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling?"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => logMutation.mutate()}
            disabled={logMutation.isPending || !weight}
          >
            {logMutation.isPending ? "Saving..." : "Save entry"}
          </Button>
        </div>

        {/* Chart */}
        {chartData.length >= 2 && (
          <div className="animate-fade-in">
            <h3 className="text-sm font-medium mb-3">Weight over time</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History */}
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-sm font-medium">Recent entries</h3>
            {[...logs].reverse().slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <div>
                  <p className="text-sm font-medium">
                    {log.weight_kg ? `${log.weight_kg} kg` : "No weight"}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(log.logged_at), "MMM d")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No entries yet. Start by logging your weight above.
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
