import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RegisterCustomer from "@/pages/RegisterCustomer";
import RegisterTranslator from "@/pages/RegisterTranslator";
import RegisterNotary from "@/pages/RegisterNotary";
import Dashboard from "@/pages/Dashboard";
import VerifyEmail from "@/pages/VerifyEmail";
import PendingApproval from "@/pages/PendingApproval";
import Notaries from "@/pages/Notaries";
import NotaryDetail from "@/pages/NotaryDetail";
import Translators from "@/pages/Translators";
import TranslatorDetail from "@/pages/TranslatorDetail";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import AdminPanel from "@/pages/AdminPanel";
import TranslationRequestForm from "@/pages/TranslationRequestForm";
import RequestDetail from "@/pages/RequestDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/register/customer" component={RegisterCustomer} />
      <Route path="/register/translator" component={RegisterTranslator} />
      <Route path="/register/notary" component={RegisterNotary} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/notaries" component={Notaries} />
      <Route path="/notaries/:id" component={NotaryDetail} />
      <Route path="/translators" component={Translators} />
      <Route path="/translators/:id" component={TranslatorDetail} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/:tab" component={AdminPanel} />
      <Route path="/translation-request" component={TranslationRequestForm} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
