import { ProtectedRoute } from "@/components/auth/protected-route";
import FileUpload from "@/components/dashboard/file-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { Upload, FileText, AlertCircle } from "lucide-react";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header title="Upload Data" breadcrumb="File Upload" />
        <main className="flex-1 py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Upload Travel Data
              </h1>
              <p className="text-slate-600">
                Import your travel data files to the system
              </p>
            </div>

            <div className="grid gap-6">
              <FileUpload />

              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-xl text-slate-900">
                      Upload Guidelines
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        File must be in <strong>CSV format</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Required columns:{" "}
                        <strong>
                          Date, Voucher, Customer Name, Route, PNR
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Maximum file size: <strong>10MB</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        4
                      </span>
                      <span>
                        All dates should be in{" "}
                        <strong>YYYY-MM-DD format</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        5
                      </span>
                      <span>
                        Make sure there are{" "}
                        <strong>no duplicate entries</strong>
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
