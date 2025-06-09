import { Brain } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading your dashboard...",
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-250">
      <div className="text-center">
        <Brain className="h-12 w-12 text-sky-500 mx-auto animate-pulse" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">{message}</h2>
      </div>
    </div>
  );
}
