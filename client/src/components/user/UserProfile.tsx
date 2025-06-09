import { useAuth } from "@/context/AuthContext";
import ProfileManagement from "../ProfileManagement";

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
      <div className="bg-sky-50 p-6 rounded-2xl border border-sky-250">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Profile Information
        </h3>
        <ProfileManagement userId={user._id} accountType="patient" />
      </div>
    </div>
  );
}
