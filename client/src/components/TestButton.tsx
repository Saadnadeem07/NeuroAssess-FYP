import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function TestButton() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startTest = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user) throw new Error("User not authenticated");

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        `${API_URL}/tests`,
        { userId: user._id },
        { headers }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to start test");
      }

      console.log("Test started:", response.data.data);
    } catch (err) {
      console.error("Test error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={startTest} disabled={loading}>
        {loading ? "Starting..." : "Start Test"}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
