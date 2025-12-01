"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUploadFile } from "@/hooks/use-travel-data";
import { cn } from "@/lib/utils";

export default function FileUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const uploadMutation = useUploadFile();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV, XLS, or XLSX file.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      try {
        await uploadMutation.mutateAsync(file);
        toast({
          title: "File uploaded successfully",
          description: `Processed ${file.name} successfully.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Failed to process file.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [uploadMutation, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    disabled: isProcessing || uploadMutation.isPending,
  });

  return (
    <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardContent className="relative p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <CloudUpload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Data Upload
            </h3>
            <p className="text-xs text-slate-500">
              Import your travel data files
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed rounded-2xl border-slate-200 hover:border-blue-400 transition-all duration-300 overflow-hidden">
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center py-12 px-6 text-center transition-all duration-300 cursor-pointer",
              isDragActive
                ? "bg-blue-50/80 scale-[0.99] border-blue-400"
                : "bg-gradient-to-b from-slate-50/50 to-white hover:from-blue-50/30 hover:to-white"
            )}
          >
            <input {...getInputProps()} />

            {isProcessing || uploadMutation.isPending ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Processing your file...
                  </p>
                  <p className="text-xs text-slate-500">
                    Please wait while we analyze your data
                  </p>
                </div>
                <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse w-2/3" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CloudUpload className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {isDragActive
                      ? "Drop your travel data file here"
                      : "Drop your travel data files here or click to browse"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports .csv, .xls, .xlsx files up to 10MB
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {[".csv", ".xls", ".xlsx"].map((type) => (
                    <span
                      key={type}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
