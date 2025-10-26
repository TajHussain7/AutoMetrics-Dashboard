import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, Loader2 } from "lucide-react";
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

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
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
    <Card>
      <CardContent className="p-4 cursor-pointer">
        <h3 className="text-base font-semibold text-slate-800 mb-3">
          Data Upload
        </h3>
        <div className="border-2 border-dashed rounded-xl border-slate-200 hover:border-blue-400 transition-colors duration-300">
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center py-10 px-6 text-center rounded-lg transition-all duration-300",
              isDragActive
                ? "bg-blue-50/80 scale-[0.99]"
                : "bg-white hover:bg-slate-50/80"
            )}
          >
            <input {...getInputProps()} />

            {isProcessing || uploadMutation.isPending ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 text-primary/70 mx-auto animate-spin" />
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Processing your file...
                  </p>
                  <p className="text-xs text-slate-500">
                    Please wait while we analyze your data
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <CloudUpload className="h-12 w-12 text-slate-400 mx-auto" />
                <div>
                  <p className="text-slate-600 mb-2">
                    {isDragActive
                      ? "Drop your travel data file here"
                      : "Drop your travel data files here or click to browse"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Supports .csv, .xls, .xlsx files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
