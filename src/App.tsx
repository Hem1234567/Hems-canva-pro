import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import BarcodePrintPage from "./pages/BarcodePrintPage";
import BarcodeGenPrintPage from "./pages/BarcodeGenPrintPage";
import BarcodeGeneratorPage from "./pages/BarcodeGeneratorPage";
import LabelMakerPage from "./pages/LabelMakerPage";
import IdMakerPage from "./pages/IdMakerPage";
import QRGeneratorPage from "./pages/QRGeneratorPage";
import OrganizePagesPage from "./pages/OrganizePagesPage";
import BgRemoverPage from "./pages/BgRemoverPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/editor/:projectId" element={<Editor />} />
              <Route path="/barcode-generator" element={<BarcodeGeneratorPage />} />
              <Route path="/barcode-gen-print" element={<BarcodeGenPrintPage />} />
              <Route path="/barcode-print" element={<BarcodePrintPage />} />
              <Route path="/label-generator" element={<LabelMakerPage />} />
              <Route path="/id-maker" element={<IdMakerPage />} />
              <Route path="/qr-generator" element={<QRGeneratorPage />} />
              <Route path="/organize-pages" element={<OrganizePagesPage />} />
              <Route path="/bg-remover" element={<BgRemoverPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
