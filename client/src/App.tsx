import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import axios from "axios";

// Import Navigation directly to ensure it's always available
import Navigation from "./components/Navigation";

// API connectivity check component
const ApiConnectivityCheck = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  // Extract the base URL without the /api suffix
  const baseUrl = apiUrl
    ? apiUrl.replace(/\/api$/, "")
    : "http://localhost:5000";

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        console.log("Checking API connection to:", `${baseUrl}/health`);
        // Use the base URL for the health check, not the API URL
        const response = await axios.get(`${baseUrl}/health`, {
          timeout: 15000, // Increase timeout to 15 seconds
        });
        if (response.data.status === "ok") {
          setIsConnected(true);
          setError(null);
        } else {
          setIsConnected(false);
          setError("API is not responding correctly");
        }
      } catch (err) {
        console.error("API connection error:", err);
        let errorMessage = "Cannot connect to API";

        // Provide more specific error messages
        if (axios.isAxiosError(err)) {
          if (err.code === "ECONNABORTED") {
            errorMessage = "API connection timeout - server may be down";
          } else if (err.response) {
            errorMessage = `API error: ${err.response.status} ${err.response.statusText}`;
          } else if (err.request) {
            errorMessage =
              "No response from API server - check if it's running";
          }
        }

        setIsConnected(false);
        setError(errorMessage);
      }
    };

    checkApiConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkApiConnection, 30000);
    return () => clearInterval(interval);
  }, [baseUrl]);

  if (isConnected === null) {
    return null; // Still checking
  }

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50">
        <div className="flex items-center">
          <div className="py-1">
            <svg
              className="h-6 w-6 text-red-500 mr-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold">API Connection Error</p>
            <p className="text-sm">{error || "Cannot connect to API"}</p>
          </div>
        </div>
      </div>
    );
  }

  return null; // Connected successfully, no need to show anything
};

//buttons page to access all pages from 1 page
const Buttons = lazy(() => import("./pages/Dummy Buttons"));

// Lazy load other components
const HeroSection = lazy(() => import("./components/HeroSection"));
const FeaturesSection = lazy(() => import("./components/FeaturesSection"));
const FAQSection = lazy(() => import("./components/FAQSection"));
const CTASection = lazy(() => import("./components/Footer"));
const HowItWorks = lazy(() => import("./components/HowItWorks"));

// Auth components
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/auth/AdminRegister"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const OTPVerification = lazy(() => import("./pages/auth/OTPVerification"));
const PageNotFound = lazy(() => import("./pages/auth/PageNotFound"));

// Role-based Dashboard components
const PatientDashboard = lazy(
  () => import("./pages/dashboard/PatientDashboard")
);
const PsychiatristDashboard = lazy(
  () => import("./pages/dashboard/PsychiatristDashboard")
);
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
//const AdminDashboard2 = lazy(() => import("./components/AdminDashboard"));

// Patient-specific pages
const InitialTestPage = lazy(() => import("./pages/patient/InitialTestPage"));
const LearningPlanPage = lazy(() => import("./pages/patient/LearningPlanPage"));
const ReportsPage = lazy(() => import("./pages/patient/ReportsPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Landing page layout
const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Suspense fallback={<LoadingSpinner />}>
        <main>
          <div id="home">
            <HeroSection />
          </div>
          <div id="about">
            <FeaturesSection />
          </div>
          <div id="services">
            <HowItWorks />
          </div>
          <div id="faq">
            <FAQSection />
          </div>
          <div id="contact">
            <CTASection />
          </div>
        </main>
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <ApiConnectivityCheck />
          <Suspense fallback={<LoadingSpinner />}>
            <div className="min-h-screen">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                <Route path="/verify-otp" element={<OTPVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* //all old pages */}

                <Route path="/buttons" element={<Buttons />} />

                {/* Role-based Dashboard routes - These are new dashboards ✅*/}
                <Route
                  path="/patient/dashboard"
                  element={<PatientDashboard />}
                />
                <Route
                  path="/psychiatrist/dashboard"
                  element={<PsychiatristDashboard />}
                />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                {/* <Route path="/admin/dashboard2" element={<AdminDashboard2 />} /> */}

                {/* Patient-specific routes */}
                <Route
                  path="/patient/initial-test"
                  element={<InitialTestPage />}
                />
                <Route
                  path="/patient/learning-plan"
                  element={<LearningPlanPage />}
                />
                <Route path="/patient/reports" element={<ReportsPage />} />

                {/* Default dashboard route - redirects to appropriate dashboard based on role */}
                <Route path="/dashboard" element={<PatientDashboard />} />

                {/* Catch-all route for 404 */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </div>
          </Suspense>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
