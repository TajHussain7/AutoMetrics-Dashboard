import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { error } from "@/lib/logger";
import { UploadCloud } from "lucide-react";
import { ProtectedDataView } from "@/components/auth/protected-data-view";
import { useAuth } from "@/contexts/auth-context";

export function FileUploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please register or login to upload files",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // File upload logic here
      toast({
        title: "Upload successful",
        description: "Your file has been uploaded successfully",
      });
    } catch (error_) {
      error("Upload error:", error_);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedDataView>
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ProtectedDataView>
  );
}
