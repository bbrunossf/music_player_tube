import { Link, useLocation } from "@remix-run/react";
import { Button } from "~/components/ui/button";

type NavItem = {
  to: string;
  icon: string;
  label: string;
};

const navItems: NavItem[] = [
  { to: "/", icon: "home", label: "Home" },
  { to: "/library", icon: "download_for_offline", label: "Library" },
  { to: "/config", icon: "settings", label: "Config" },
];

export  function BottomNavigation() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 py-2 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between mt-4 text-zinc-400">

          {navItems.map((item) => {
            const active = location.pathname === item.to;

            const button = (
              <Button
                variant="ghost"
                disabled={active}
                className={`flex flex-col items-center text-xs ${
                  active ? "text-white" : ""
                }`}
              >
                <span className="material-icons">{item.icon}</span>
                {item.label}
              </Button>
            );

            return active ? (
              <div key={item.to}>{button}</div>
            ) : (
              <Link key={item.to} to={item.to}>
                {button}
              </Link>
            );
          })}

        </div>
      </div>
    </div>
  );
}
