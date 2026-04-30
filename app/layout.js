import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

// Serif para el wordmark de Claude (aproximación a su tipografía)
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-claude-serif",
});

export const metadata = {
  title: "Evaluación de Uso de Claude AI | ALZAK Foundation",
  description:
    "Formulario interno de ALZAK Foundation para evaluar el impacto y uso de Claude AI en los equipos de Investigación, Salud Pública, IT y Administración.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${serif.variable}`}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
