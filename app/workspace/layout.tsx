import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "katex/dist/katex.min.css";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      {children}
      <Toaster />
    </QueryProvider>
  );
}
