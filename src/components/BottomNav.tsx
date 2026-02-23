import { useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, UtensilsCrossed, TrendingUp, Settings, LayoutDashboard } from "lucide-react";

const tabs = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/workout", label: "Workout", icon: Dumbbell },
  { path: "/diet", label: "Diet", icon: UtensilsCrossed },
  { path: "/progress", label: "Progress", icon: TrendingUp },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
