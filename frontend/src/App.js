import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/browse" element={<BrowseEditors/>} />
            <Route path="/editor/:id" element={<EditorProfile/>} />
            <Route path="/how-it-works" element={<HowItWorks/>} />
            <Route path="/trust" element={<TrustSafety/>} />
            <Route path="/success-stories" element={<SuccessStories/>} />
            <Route path="/ai-match" element={<AIMatch/>} />
            <Route path="/legal/:slug" element={<LegalPage/>} />

            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register/>} />
            <Route path="/forgot-password" element={<ForgotPassword/>} />
            <Route path="/reset-password" element={<ResetPassword/>} />

            <Route path="/become-editor" element={<ProtectedRoute><BecomeEditor/></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
            <Route path="/editor/onboarding" element={<ProtectedRoute role="editor"><EditorOnboarding/></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages/></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><Admin/></ProtectedRoute>} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  );
}
