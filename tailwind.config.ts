import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        week1: "hsl(var(--week-1))",
        week2: "hsl(var(--week-2))",
        week3: "hsl(var(--week-3))",
        week4: "hsl(var(--week-4))",
        week5: "hsl(var(--week-5))",
        weekMonthly: "hsl(var(--week-monthly))",
        "tracker-header": { DEFAULT: "hsl(var(--tracker-header-bg))", foreground: "hsl(var(--tracker-header-fg))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: { xxs: "0.625rem" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
