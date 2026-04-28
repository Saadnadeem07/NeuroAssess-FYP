import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

export default function TestButton() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startTest = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user) throw new Error("User not authenticated");

      const response = await api.post("/tests", {});

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to start test");
      }
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
