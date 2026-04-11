import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { ScrollToTop } from "@/components/ScrollToTop";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const MyPage = lazy(() => import("@/pages/MyPage"));
const Admin = lazy(() => import("@/pages/Admin"));
const VideoUpload = lazy(() => import("@/pages/VideoUpload"));
const MusicianProfile = lazy(() => import("@/pages/MusicianProfile"));
const Drums = lazy(() => import("@/pages/Drums"));
const Piano = lazy(() => import("@/pages/Piano"));
const Bass = lazy(() => import("@/pages/Bass"));
const Guitar = lazy(() => import("@/pages/Guitar"));
const ContentDetail = lazy(() => import("@/pages/ContentDetail"));
const Payment = lazy(() => import("@/pages/Payment"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const PaymentFail = lazy(() => import("@/pages/PaymentFail"));
const MusiciansApplication = lazy(() => import("@/pages/MusiciansApplication"));
const MusicianProfilePage = lazy(() => import("@/pages/MusicianProfilePage"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const TermsPage = lazy(() => import("@/pages/policy/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/policy/PrivacyPage"));
const RefundPage = lazy(() => import("@/pages/policy/RefundPage"));
const SettlementPage = lazy(() => import("@/pages/policy/SettlementPage"));
const BusinessPage = lazy(() => import("@/pages/policy/BusinessPage"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const SettlementMenu = lazy(() => import("@/pages/SettlementMenu"));

function RouteFallback() {
  return <main className="min-h-screen bg-background pt-32 text-white flex items-center justify-center">로딩 중...</main>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/mypage" component={MyPage} />
        <Route path="/musicians-application" component={MusiciansApplication} />
        <Route path="/musician-profile" component={MusicianProfilePage} />
        <Route path="/musician-profile/edit" component={EditProfile} />
        <Route path="/musician-profile/:id" component={MusicianProfilePage} />
        <Route path="/admin" component={Admin} />
        <Route path="/upload" component={VideoUpload} />
        <Route path="/musician" component={MusicianProfile} />
        <Route path="/drums" component={Drums} />
        <Route path="/piano" component={Piano} />
        <Route path="/bass" component={Bass} />
        <Route path="/guitar" component={Guitar} />
        <Route path="/content/:id" component={ContentDetail} />
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/payment/fail" component={PaymentFail} />
        <Route path="/payment/:id" component={Payment} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/refund" component={RefundPage} />
        <Route path="/settlement" component={SettlementPage} />
        <Route path="/business" component={BusinessPage} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/settlements" component={SettlementMenu} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppShell() {
  const [location] = useLocation();

  const hideNavbarRoutes = [
    "/signup",
    "/login",
    "/terms",
    "/privacy",
    "/refund",
    "/settlement",
    "/business",
    "/musician-profile/edit",
    "/reset-password",
    "/musicians-application",
  ];
  const shouldHideNavbar = hideNavbarRoutes.includes(location);

  return (
    <TooltipProvider>
      <Toaster />
      <ScrollToTop />
      {!shouldHideNavbar && <Navbar />}
      <AppRoutes />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter>
          <AppShell />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
