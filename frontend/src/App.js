import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { applyTheme, getInitialTheme } from "@/components/ThemeToggle";
import AppErrorBoundary from "@/components/AppErrorBoundary";

import Home from "@/pages/Home";
import BrowseEditors from "@/pages/BrowseEditors";
import EditorProfile from "@/pages/EditorProfile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import EditorOnboarding from "@/pages/EditorOnboarding";
import Messages from "@/pages/Messages";
import Admin from "@/pages/Admin";
import LegalPage from "@/pages/Legal";
import HowItWorks from "@/pages/HowItWorks";
import TrustSafety from "@/pages/TrustSafety";
import SuccessStories from "@/pages/SuccessStories";
import AIMatch from "@/pages/AIMatch";
import BecomeEditor from "@/pages/BecomeEditor";
import ErrorPage from "@/pages/ErrorPage";

const HIDE_CHROME = ["/login", "/register", "/forgot-password", "/reset-password"];

function Shell({ children }) {
  const loc = useLocation();
  const hide = HIDE_CHROME.some(p => loc.pathname.startsWith(p));
  return (
    <div className="App">
      {!hide && <Navbar/>}
      <main className="flex-1">{children}</main>
      {!hide && <Footer/>}
    </div>
  );
}

function PrivatePage({ children, role }) {
  return <ProtectedRoute role={role}>{children}</ProtectedRoute>;
}

export default function App() {
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell>
          <AppErrorBoundary>
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route path="/browse" element={<PrivatePage><BrowseEditors/></PrivatePage>} />
              <Route path="/editor/:id" element={<PrivatePage><EditorProfile/></PrivatePage>} />
              <Route path="/how-it-works" element={<PrivatePage><HowItWorks/></PrivatePage>} />
              <Route path="/trust" element={<PrivatePage><TrustSafety/></PrivatePage>} />
              <Route path="/success-stories" element={<PrivatePage><SuccessStories/></PrivatePage>} />
              <Route path="/ai-match" element={<PrivatePage><AIMatch/></PrivatePage>} />
              <Route path="/legal/:slug" element={<PrivatePage><LegalPage/></PrivatePage>} />

              <Route path="/login" element={<Login/>} />
              <Route path="/register" element={<Register/>} />
              <Route path="/forgot-password" element={<ForgotPassword/>} />
              <Route path="/reset-password" element={<ResetPassword/>} />

              <Route path="/become-editor" element={<PrivatePage><BecomeEditor/></PrivatePage>} />
              <Route path="/dashboard" element={<PrivatePage><Dashboard/></PrivatePage>} />
              <Route path="/editor/onboarding" element={<PrivatePage role="editor"><EditorOnboarding/></PrivatePage>} />
              <Route path="/messages" element={<PrivatePage><Messages/></PrivatePage>} />
              <Route path="/admin" element={<PrivatePage role="admin"><Admin/></PrivatePage>} />
              <Route path="/403" element={<ErrorPage code={403} />} />
              <Route path="/404" element={<ErrorPage code={404} />} />
              <Route path="/500" element={<ErrorPage code={500} />} />
              <Route path="*" element={<ErrorPage code={404} />} />
            </Routes>
          </AppErrorBoundary>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  );
}
