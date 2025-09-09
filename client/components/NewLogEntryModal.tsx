import { X, Bold, Underline, Italic, Upload, Image, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLogbook } from "../hooks/use-logbook";
import { useUpload } from "../hooks/use-upload";
import { useAuth } from "../hooks/use-auth";
import { LogbookStatus } from "../types/database.types";
import { z } from "zod";
import { useToast } from "../hooks/use-toast";

interface NewLogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: Date;
}

// Validation schema for form
const entrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  task_done: z.string().min(1, "Task description is required").max(2000, "Task description must be less than 2000 characters"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
});

type EntryFormData = z.infer<typeof entrySchema>;

export default function NewLogEntryModal({ isOpen, onClose, onSuccess, selectedDate: propSelectedDate }: NewLogEntryModalProps) {
  const { createLogbookEntry, isLoading: isLogbookLoading } = useLogbook();
  const { uploadMultipleImages, isUploading, progress, error: uploadError } = useUpload();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState("");
  const [tasksPerformed, setTasksPerformed] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [errors, setErrors] = useState<Partial<EntryFormData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionType, setSubmissionType] = useState<'draft' | 'submit'>('draft');

  // Update date when prop changes
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate.toISOString().split('T')[0]);
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [propSelectedDate]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setTasksPerformed("");
      // Always use propSelectedDate if available, else today (as ISO string)
      setSelectedDate(
        propSelectedDate
          ? propSelectedDate.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setErrors({});
      setServerError(null);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setSubmissionStatus('idle');
    }
  }, [isOpen, selectedDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Create file previews
  useEffect(() => {
    if (!selectedFiles.length) return;
    
    const newPreviewUrls: string[] = [];
    selectedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      newPreviewUrls.push(url);
    });
    
    setPreviewUrls(newPreviewUrls);
    
    // Cleanup function to revoke object URLs
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  if (!isOpen) return null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and filter by file type and size
      const files = Array.from(e.target.files).filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 25 * 1024 * 1024; // 25MB
        
        if (!validTypes.includes(file.type)) {
          setServerError('Invalid file type. Only JPG, JPEG, and PNG files are allowed.');
          return false;
        }
        
        if (file.size > maxSize) {
          setServerError('File too large. Maximum file size is 25MB.');
          return false;
        }
        
        return true;
      });
      
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);
      setServerError(null);
    }
  };

  // Remove a file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    setPreviewUrls(urls => urls.filter((_, i) => i !== index));
  };

  // Trigger file input click
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      entrySchema.parse({ 
        title, 
        task_done: tasksPerformed,
        date: selectedDate,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<EntryFormData> = {};
        error.errors.forEach(err => {
          const path = err.path[0] as keyof EntryFormData;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (type: 'draft' | 'submit') => {
    setSubmissionType(type);
    
    if (!validateForm()) return;
    
    setServerError(null);
    setSubmissionStatus('submitting');

    try {
      console.log('Starting submission process...');
      
      // Check if user exists
      if (!user) {
        console.error('No user found in auth context');
        throw new Error('User not authenticated. Please log in again.');
      }
      
      console.log('Current user ID:', user.id);
      
      // 1. Upload images if there are any
      let mediaUrls: string[] = [];
      if (selectedFiles.length > 0) {
        console.log(`Uploading ${selectedFiles.length} files to Cloudinary...`);
        const uploaded = await uploadMultipleImages(selectedFiles);
        if (uploaded) {
          mediaUrls = uploaded;
          console.log('Files uploaded successfully:', mediaUrls);
        } else {
          console.error('Upload failed to return URLs');
          throw new Error("Image upload failed to return URLs.");
        }
      }

      // 2. Determine day name
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dateObj = new Date(selectedDate);
      dateObj.setUTCHours(0, 0, 0, 0); // Ensure consistent date parsing
      const dayOfWeek = dateObj.getUTCDay();
      const dayName = dayNames[dayOfWeek];
      
      // 3. Create logbook entry
      // Use 'pending' instead of 'submitted' to match the database enum
      const status: LogbookStatus = type === 'draft' ? 'draft' : 'pending';
      
      const entryData = {
        student_id: user?.id || '',
        date: selectedDate, // YYYY-MM-DD
        day_name: dayName as any,
        title,
        task_done: tasksPerformed,
        media_url: mediaUrls.length > 0 ? mediaUrls : undefined, // Save URL array, or undefined if empty
        status,
      };
      
      console.log('Saving logbook entry with data:', entryData);
      const result = await createLogbookEntry(entryData);
      console.log('Logbook entry creation result:', result);
      
      // Show success toast
      toast({
        title: "Success!",
        description: `Logbook entry ${type === 'draft' ? 'saved as draft' : 'submitted for review'}.`,
        variant: "default",
      });

      setSubmissionStatus('success');
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (err: any) {
      console.error("Error submitting entry:", err);
      const message = err.message || "Failed to create logbook entry";
      setServerError(message.includes("upload") ? `Upload Error: ${message}` : message);
      setSubmissionStatus('error');
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to save logbook entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get current date in readable format
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Determine if form is in progress
  const isInProgress = submissionStatus === 'submitting' || isUploading || isLogbookLoading;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-[5px]"
        onClick={isInProgress ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-[500px] h-full bg-figma-card border-l border-figma-border shadow-[3px_4px_24px_0_rgba(0,0,0,0.15)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-figma-border">
          <h2 className="font-poppins text-xl text-[#111827]">New Log Entry</h2>
          <button 
            onClick={isInProgress ? undefined : onClose}
            className={`w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors ${
              isInProgress ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isInProgress}
          >
            <X className="w-7 h-7 text-figma-text-primary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-85px)] overflow-y-auto">
          <div className="p-6 space-y-6 flex-1">
            {serverError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                {serverError}
              </div>
            )}

            {/* Date Field */}
            <div className="space-y-2">
              <label className="block font-poppins text-base text-figma-text-primary">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-lg bg-figma-bg border-0 text-figma-text-primary font-poppins text-base"
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                disabled={isInProgress}
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date}</p>
              )}
            </div>

            {/* Title Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-poppins text-lg text-figma-text-primary">
                  Title
                </label>
                <span className="font-poppins text-lg text-figma-text-primary">
                  {title.length}/200
                </span>
              </div>
              <input
                type="text"
                placeholder="Input Title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                className={`w-full px-4 py-4 rounded-lg border ${
                  errors.title ? "border-red-500" : "border-figma-border"
                } bg-[#F8F8F8] text-figma-text-primary font-poppins text-base placeholder:text-figma-text-primary focus:outline-none focus:ring-2 focus:ring-black/20`}
                disabled={isInProgress}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Tasks Performed Field */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-poppins text-lg text-figma-text-primary">
                    Tasks Performed
                  </label>
                  <span className="font-poppins text-lg text-figma-text-primary">
                    {tasksPerformed.length}/2000
                  </span>
                </div>
                <textarea
                  placeholder="What did you do today?"
                  value={tasksPerformed}
                  onChange={(e) => setTasksPerformed(e.target.value.slice(0, 2000))}
                  rows={7}
                  className={`w-full px-4 py-4 rounded-lg border ${
                    errors.task_done ? "border-red-500" : "border-figma-border"
                  } bg-[#F8F8F8] text-figma-text-primary font-poppins text-[17px] placeholder:text-figma-text-secondary focus:outline-none focus:ring-2 focus:ring-black/20 resize-none`}
                  disabled={isInProgress}
                />
                {errors.task_done && (
                  <p className="text-red-500 text-sm">{errors.task_done}</p>
                )}
              </div>

              {/* Text Formatting Buttons */}
              <div className="flex items-center gap-6 pr-6">
                <button className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded transition-colors" disabled={isInProgress}>
                  <Bold className="w-5 h-5 text-[#1C1B1F]" />
                </button>
                <button className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded transition-colors" disabled={isInProgress}>
                  <Underline className="w-5 h-5 text-[#1C1B1F]" />
                </button>
                <button className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded transition-colors" disabled={isInProgress}>
                  <Italic className="w-5 h-5 text-[#1C1B1F]" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-figma-border"></div>

            {/* Add Media Section */}
            <div className="space-y-4">
              <label className="block font-poppins text-base text-figma-text-primary font-medium">
                Add Media
              </label>
              
              {/* File input (hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, image/jpg"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isInProgress}
              />
              
              {/* Upload area */}
              {previewUrls.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-[172px] px-4 py-3 border-2 border-dashed border-figma-border bg-figma-bg rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={isInProgress ? undefined : openFileDialog}
                >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-[#1C1B1F]" />
                  </div>
                  <div className="space-y-3">
                    <p className="font-poppins text-base">
                        <span className="text-figma-text-secondary/70">Drag and Drop or </span>
                      <span className="text-black font-bold">Click to Upload</span>
                    </p>
                    <p className="font-poppins text-sm text-figma-text-secondary/70">
                      <span className="font-bold text-black">Supported Format:</span>
                      <span className="font-bold text-figma-text-secondary/70"> </span>
                      <span>IMG, JPG, JPEG. </span>
                      <span className="font-bold text-black">Max Size:</span>
                      <span className="font-bold text-figma-text-secondary/70"> </span>
                      <span>25MB</span>
                    </p>
                  </div>
                </div>
              </div>
              ) : (
                <div className="border border-figma-border rounded-xl overflow-hidden">
                  {/* Preview grid */}
                  <div className="grid grid-cols-2 gap-2 p-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-figma-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isInProgress}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {/* Add more images button */}
                    <button
                      type="button"
                      onClick={openFileDialog}
                      className="flex flex-col items-center justify-center h-32 bg-figma-bg border border-dashed border-figma-border rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isInProgress}
                    >
                      <Image className="w-6 h-6 text-figma-text-secondary mb-2" />
                      <span className="text-sm text-figma-text-secondary">Add more</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-figma-text-secondary">Uploading images...</span>
                  <span className="text-sm text-figma-text-secondary">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="w-full h-px bg-figma-border"></div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0">
            <div className="flex gap-3">
              <button 
                onClick={() => handleSubmit('draft')}
                className={`flex-1 h-14 px-6 py-2.5 border border-black bg-transparent text-black font-poppins text-base hover:bg-gray-50 transition-colors ${
                  isInProgress ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isInProgress}
              >
                {isInProgress && submissionType === 'draft' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save as Draft'
                )}
              </button>
              <button 
                onClick={() => handleSubmit('submit')}
                className={`flex-1 h-14 px-6 py-2.5 bg-black text-white font-poppins text-base hover:bg-gray-800 transition-colors ${
                  isInProgress ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isInProgress}
              >
                {isInProgress && submissionType === 'submit' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
