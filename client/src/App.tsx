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
import ArticlesPage from "@/pages/Articles";
import BooksPage from "@/pages/Books";
import FAQPage from "./pages/FAQ";
import Admin from "./pages/Admin";
import AccessibilityPage from "./pages/Accessibility";
import AccessibilityMenu from "./components/AccessibilityMenu";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentError from "./pages/PaymentError";
// NLP Practitioner Course pages
import NlpHome from "./pages/nlp/Home";
import NlpAdminUpdates from "./pages/nlp/AdminUpdates";
import NlpAdminRegistrations from "./pages/nlp/AdminRegistrations";
import NlpAdminSurveys from "./pages/nlp/AdminSurveys";
import NlpAdminSettings from "./pages/nlp/AdminSettings";
import NlpAdminDashboard from "./pages/nlp/AdminDashboard";
import NlpAdminPronunciation from "./pages/nlp/AdminPronunciation";
import NlpAdminTtsEditor from "./pages/nlp/AdminTtsEditor";
import NlpAdminBackup from "./pages/nlp/AdminBackup";
import NlpChatPage from "./pages/nlp/NlpChatPage";
import NlpTerms from "./pages/nlp/Terms";
import NlpUnsubscribe from "./pages/nlp/Unsubscribe";
import NlpForgotPassword from "./pages/nlp/ForgotPassword";
import NlpResetPassword from "./pages/nlp/ResetPassword";
import NlpAccessibility from "./pages/nlp/Accessibility";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/tipul-zugi"} component={CoupleTherapy} />
      <Route path={"/gishur"} component={Mediation} />
      <Route path={"/yiutz-mishpati"} component={LegalAdvice} />
      <Route path={"/articles"} component={ArticlesPage} />
      <Route path={"/articles/:slug"} component={ArticlesPage} />
      <Route path={"/books"} component={BooksPage} />
      <Route path={"/books/:slug"} component={BooksPage} />
      <Route path={"/faq"} component={FAQPage} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/accessibility"} component={AccessibilityPage} />
      <Route path={"/payment"} component={Payment} />
      <Route path={"/payment-success"} component={PaymentSuccess} />
      <Route path={"/payment-error"} component={PaymentError} />
      <Route path={"/payment-cancel"} component={PaymentError} />
      {/* NLP Practitioner Course routes */}
      <Route path={"/nlp"} component={NlpHome} />
      <Route path={"/nlp/admin"} component={NlpAdminDashboard} />
      <Route path={"/nlp/admin/updates"} component={NlpAdminUpdates} />
      <Route path={"/nlp/admin/registrations"} component={NlpAdminRegistrations} />
      <Route path={"/nlp/admin/surveys"} component={NlpAdminSurveys} />
      <Route path={"/nlp/admin/settings"} component={NlpAdminSettings} />
      <Route path={"/nlp/admin/pronunciation"} component={NlpAdminPronunciation} />
      <Route path={"/nlp/admin/tts-editor"} component={NlpAdminTtsEditor} />
      <Route path={"/nlp/admin/backup"} component={NlpAdminBackup} />
      <Route path={"/nlp/chat"} component={NlpChatPage} />
      <Route path={"/nlp/terms"} component={NlpTerms} />
      <Route path={"/nlp/unsubscribe"} component={NlpUnsubscribe} />
      <Route path={"/nlp/forgot-password"} component={NlpForgotPassword} />
      <Route path={"/nlp/reset-password"} component={NlpResetPassword} />
      <Route path={"/nlp/accessibility"} component={NlpAccessibility} />
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
