import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: "1rem",
				sm: "1.5rem",
				lg: "2rem"
			},
			screens: {
				"2xl": "1280px"
			}
		},
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				},
				// Sampled from the ComSci KMITL logo: amber #FC9C18, charcoal #494C54.
				brand: {
					50: "#FFF8EC",
					100: "#FFEDCF",
					200: "#FED89A",
					300: "#FDC05E",
					400: "#FCAB36",
					500: "#FC9C18",
					600: "#E27E06",
					700: "#B85F08",
					800: "#944A0E",
					900: "#793D0F",
					950: "#462004"
				},
				charcoal: {
					50: "#F6F6F7",
					100: "#EAEBED",
					200: "#D4D6DA",
					300: "#B2B5BC",
					400: "#898D97",
					500: "#6B6F7A",
					600: "#575A64",
					700: "#494C54",
					800: "#393B42",
					900: "#27292E",
					950: "#18191D"
				}
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				sans: ['"IBM Plex Sans Thai"', ...fontFamily.sans],
				display: ["Prompt", '"IBM Plex Sans Thai"', ...fontFamily.sans],
				mono: ['"JetBrains Mono"', ...fontFamily.mono]
			},
			keyframes: {
				"orbit-spin": {
					to: { transform: "rotate(360deg)" }
				},
				"fade-up": {
					from: { opacity: "0", transform: "translateY(12px)" },
					to: { opacity: "1", transform: "translateY(0)" }
				},
				"pop-in": {
					"0%": { opacity: "0", transform: "scale(0.6)" },
					"70%": { opacity: "1", transform: "scale(1.06)" },
					"100%": { transform: "scale(1)" }
				}
			},
			animation: {
				"orbit-slow": "orbit-spin 60s linear infinite",
				"orbit-slower": "orbit-spin 90s linear infinite reverse",
				"fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
				"pop-in": "pop-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both"
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
	  ],
};

export default config;
