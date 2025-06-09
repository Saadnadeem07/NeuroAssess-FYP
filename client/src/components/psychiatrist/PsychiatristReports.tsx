import { FileText } from "lucide-react";

export default function PsychiatristReports() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Reports</h1>
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center justify-center flex-col gap-4 py-8">
          <FileText className="h-12 w-12 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            No Reports Available
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            You don't have any patient reports yet. Reports will be generated
            after patient assessments and sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
