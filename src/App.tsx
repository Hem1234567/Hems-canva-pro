import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import BarcodePrintPage from "./pages/BarcodePrintPage";
import BarcodeGenPrintPage from "./pages/BarcodeGenPrintPage";
import BarcodeGeneratorPage from "./pages/BarcodeGeneratorPage";
import LabelMakerPage from "./pages/LabelMakerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/label-maker" element={<LabelMakerPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
