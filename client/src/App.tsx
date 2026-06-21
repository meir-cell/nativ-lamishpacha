import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CoupleTherapy from "./pages/CoupleTherapy";
import Mediation from "./pages/Mediation";
import LegalAdvice from "./pages/LegalAdvice";
import ArticlesPage from "./pages/Articles";
import FAQPage from "./pages/FAQ";
import Admin from "./pages/Admin";
import AccessibilityPage from "./pages/Accessibility";
import AccessibilityMenu from "./components/AccessibilityMenu";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/tipul-zugi"} component={CoupleTherapy} />
      <Route path={"/gishur"} component={Mediation} />
      <Route path={"/yiutz-mishpati"} component={LegalAdvice} />
      <Route path={"/articles"} component={ArticlesPage} />
      <Route path={"/faq"} component={FAQPage} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/accessibility"} component={AccessibilityPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AccessibilityMenu />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
