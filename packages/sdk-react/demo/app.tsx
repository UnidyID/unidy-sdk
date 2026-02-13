import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { Auth } from "./pages/auth";
import { Home } from "./pages/home";
import { Newsletter } from "./pages/newsletter";
import { NewsletterReactQuery } from "./pages/newsletter-react-query";
import { PreferenceCenter } from "./pages/preference-center";
import { Profile } from "./pages/profile";
import { Ticketables } from "./pages/ticketables";

export function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/preference-center" element={<PreferenceCenter />} />
        <Route path="/newsletter-react-query" element={<NewsletterReactQuery />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ticketables" element={<Ticketables />} />
      </Routes>
    </BrowserRouter>
  );
}
