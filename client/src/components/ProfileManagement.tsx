import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface ProfileManagementProps {
  userId: string;
  accountType: "patient" | "psychaterist";
}

export default function ProfileManagement({
  userId,
  accountType,
}: ProfileManagementProps) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [expertise, setExpertise] = useState(
    user?.psychiatristProfile?.expertise || ""
  );
  const [bio, setBio] = useState(user?.psychiatristProfile?.bio || "");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const updates = {
        name,
        email,
        ...(accountType === "psychaterist" && {
          psychiatristProfile: {
            expertise,
            bio,
            certificateUrl,
          },
        }),
      };

      const response = await axios.put(`${API_URL}/users/${userId}`, updates, {
        headers,
      });

      if (response.data.success) {
        setMessage("Profile updated successfully!");
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update error:", err);
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Profile Management</h2>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {accountType === "psychaterist" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise</Label>
            <Input
              id="expertise"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certificateUrl">Certificate URL</Label>
            <Input
              id="certificateUrl"
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
            />
          </div>
        </>
      )}
      <Button onClick={handleUpdate} disabled={loading}>
        {loading ? "Updating..." : "Update Profile"}
      </Button>
    </div>
  );
}
