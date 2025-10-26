import { ProtectedRoute } from "@/components/auth/protected-route";
import FileUpload from "@/components/dashboard/file-upload";
import { Card } from "@/components/ui/card";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Upload Travel Data</h1>
        <div className="grid gap-6">
          <FileUpload />
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Guidelines</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>File must be in CSV format</li>
              <li>
                Required columns: Date, Voucher, Customer Name, Route, PNR
              </li>
              <li>Maximum file size: 10MB</li>
              <li>All dates should be in YYYY-MM-DD format</li>
              <li>Make sure there are no duplicate entries</li>
            </ul>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
