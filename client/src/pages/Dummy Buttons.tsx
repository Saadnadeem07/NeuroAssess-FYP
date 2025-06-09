"use client";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NavigationHub() {
  const navigate = useNavigate();

  return (
    // <div className="min-h-screen flex flex-col items-center justify-center bg-blue-200 space-y-4">
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-200 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <h1 className="text-2xl font-semibold mb-6 text-blue-700">
          Navigation Hub
        </h1>

        <Button
          className="bg-blue-500 text-white"
          onClick={() => navigate("/")}
        >
          Home Page
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/register")}
        >
          Register Yourself user/psy
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/forgot-password")}
        >
          forgot-password
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/reset-password")}
        >
          reset-password
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/verify-otp")}
        >
          Verify-otp
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/verify-otp")}
        >
          Dashboard Basit
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/dashboard2")}
        >
          Dashboard Saad
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/user-dashboard")}
        >
          Users Dashboard by Saad
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/psy-dashboard")}
        >
          Psychiatrist Dashboard by Saad
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/psy-details")}
        >
          Show All Psy to user
        </Button>

        <Button
          className="bg-blue-500  text-white"
          onClick={() => navigate("/psy-dashboard2")}
        >
          each specific psy details
        </Button>
      </div>
    </div>
  );
}
