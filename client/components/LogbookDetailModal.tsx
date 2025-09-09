import { useState, useEffect } from "react";
import { 
  X, 
  Save, 
  CheckCircle, 
  Loader2, 
  Eye,
  Edit
} from "lucide-react";
import { LogbookService } from "../lib/services/logbook.service";
import { useAuth } from "../hooks/use-auth";
import { useNotifications } from "../hooks/use-notifications";
import { notificationService } from "../lib/services/notification.service";

interface LogbookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any;
  mode?: "view" | "edit";
  onSuccess?: () => void;
}

export default function LogbookDetailModal({
  isOpen,
  onClose,
  entry,
  mode = "view",
  onSuccess,
}: LogbookDetailModalProps) {
  const { profile } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailedEntry, setDetailedEntry] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedTasksPerformed, setEditedTasksPerformed] = useState("");
  const [supervisorComment, setSupervisorComment] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);

  // Determine if user is a supervisor
  const isSupervisor = profile?.role === "supervisor_school" || profile?.role === "supervisor_industry";
  const isIndustrySupervisor = profile?.role === "supervisor_industry";

  useEffect(() => {
    if (isOpen && entry?.id) {
      fetchDetailedEntry();
    }
  }, [isOpen, entry?.id]);

  useEffect(() => {
    if (detailedEntry) {
      setEditedTitle(detailedEntry.title || "");
      setEditedTasksPerformed(detailedEntry.task_done || "");
      setSupervisorComment(detailedEntry.comments_from_supervisor || "");
    }
  }, [detailedEntry]);

  const fetchDetailedEntry = async () => {
    if (!entry?.id) return;
    
    setIsLoading(true);
    try {
      const data = await LogbookService.getLogbookEntryById(entry.id);
      setDetailedEntry(data);
    } catch (error) {
      console.error("Error fetching detailed entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSave = async () => {
    if (!detailedEntry?.id) return;

    setIsSaving(true);
    try {
      if (isEditing) {
        // Student editing their own entry
        await LogbookService.updateLogbookEntry(detailedEntry.id, {
          title: editedTitle,
          task_done: editedTasksPerformed,
        });
        
        // Show success message
        if (typeof window !== "undefined" && (window as any).toast) {
          (window as any).toast.success("Logbook entry updated successfully!");
        }
        
    setIsEditing(false);
        await fetchDetailedEntry();
        onSuccess?.();
      } else if (isSupervisor && reviewAction === "approve") {
        // Supervisor approving entry
        await LogbookService.updateLogbookEntry(detailedEntry.id, {
          status: "approved",
          comments_from_supervisor: supervisorComment,
        });

        // Create notification for student
        if (detailedEntry.student_id) {
          await notificationService.notifyEntryReviewed(
            detailedEntry.student_id,
            "approved",
            supervisorComment
          );
        }

        // Show success message
        if (typeof window !== "undefined" && (window as any).toast) {
          (window as any).toast.success("Entry approved successfully!");
        }

        // Reset review state
        setReviewAction(null);
        setSupervisorComment("");
        await fetchDetailedEntry();
        onSuccess?.();
        refreshNotifications();
      } else if (isSupervisor && reviewAction === "reject") {
        // Supervisor rejecting entry
        await LogbookService.updateLogbookEntry(detailedEntry.id, {
          status: "approved", // Keep as approved but mark as rejected in comments
          comments_from_supervisor: supervisorComment,
        });

        // Create notification for student
        if (detailedEntry.student_id) {
          await notificationService.notifyEntryReviewed(
            detailedEntry.student_id,
            "rejected",
            supervisorComment
          );
        }

        // Show success message
        if (typeof window !== "undefined" && (window as any).toast) {
          (window as any).toast.success("Entry rejected successfully!");
        }

        // Reset review state
        setReviewAction(null);
        setSupervisorComment("");
        await fetchDetailedEntry();
        onSuccess?.();
        refreshNotifications();
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      if (typeof window !== "undefined" && (window as any).toast) {
        (window as any).toast.error("Failed to save entry. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
    setIsEditing(false);
      setEditedTitle(detailedEntry?.title || "");
      setEditedTasksPerformed(detailedEntry?.task_done || "");
    } else if (isSupervisor) {
      setReviewAction(null);
      setSupervisorComment(detailedEntry?.comments_from_supervisor || "");
    }
  };

  const canEdit = detailedEntry?.status === "draft" || detailedEntry?.status === "pending";
  const canReview = isSupervisor && detailedEntry?.status === "pending";
  const isApproved = detailedEntry?.status === "approved";

  // Display data based on current state
  const displayEntry = detailedEntry || entry;
  const displayDate = displayEntry?.date ? formatDate(displayEntry.date) : "Loading...";
  const displayTitle = isEditing ? editedTitle : displayEntry?.title || "Loading...";
  const displayTasksPerformed = isEditing ? editedTasksPerformed : displayEntry?.task_done || "Loading...";
  const displayFeedback = displayEntry?.comments_from_supervisor || "No feedback provided yet.";
  const displayImages = displayEntry?.media_url || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-[5px]"
        onClick={onClose}
      />
      
      {/* Modal - positioned on the right side */}
      <div className="relative w-[500px] h-full bg-figma-card border-l border-figma-border shadow-[3px_4px_24px_0_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-figma-border">
          <div>
            <h2 className="font-poppins text-xl text-[#111827]">
              {isSupervisor ? "Review Logbook Entry" : "Logbook Entry Details"}
            </h2>
            <p className="font-poppins text-sm text-figma-text-secondary mt-1">{displayDate}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Edit button for students */}
            {!isEditing && canEdit && !isLoading && !isSupervisor && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-[16px] py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-poppins text-sm"
              >
                Edit
              </button>
            )}
            
          <button 
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-7 h-7 text-figma-text-primary" />
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-85px)] overflow-y-auto">
          <div className="p-6 space-y-6 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600 font-poppins">Loading entry details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Student Information (for supervisors) */}
                {isSupervisor && displayEntry?.student && (
                  <div className="bg-figma-bg p-4 rounded-lg border border-figma-border">
                    <h3 className="font-poppins font-semibold text-base text-figma-text-primary mb-3">Student Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-figma-text-secondary">Name:</span>
                        <span className="ml-2 font-medium text-figma-text-primary">
                          {displayEntry.student.first_name} {displayEntry.student.last_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-figma-text-secondary">Matric No:</span>
                        <span className="ml-2 font-medium text-figma-text-primary">
                          {displayEntry.student.metric_no || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-figma-text-secondary">Department:</span>
                        <span className="ml-2 font-medium text-figma-text-primary">
                          {displayEntry.student.department || "Not provided"}
                        </span>
                      </div>
                    </div>
            </div>
                )}

            {/* Title */}
              <div className="space-y-2">
                  <label className="block font-poppins text-base text-figma-text-primary font-medium">
                  Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full px-4 py-4 rounded-lg border border-figma-border bg-[#F8F8F8] text-figma-text-primary font-poppins text-base focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSaving}
                  />
                ) : (
                    <div className="w-full px-4 py-4 rounded-lg bg-[#F8F8F8] text-figma-text-primary font-poppins text-base">
                      {displayTitle}
                  </div>
                )}
              </div>

              {/* Tasks Performed */}
                <div className="space-y-2">
                  <label className="block font-poppins text-base text-figma-text-primary font-medium">
                    Tasks Performed
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedTasksPerformed}
                      onChange={(e) => setEditedTasksPerformed(e.target.value)}
                      rows={7}
                      className="w-full px-4 py-4 rounded-lg border border-figma-border bg-[#F8F8F8] text-figma-text-primary font-poppins text-[17px] focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="w-full px-4 py-4 rounded-lg bg-[#F8F8F8] text-figma-text-primary font-poppins text-[17px] whitespace-pre-wrap">
                      {displayTasksPerformed}
                    </div>
                  )}
                </div>

                {/* Images */}
                {displayImages && displayImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-figma-text-primary font-medium">
                      Attached Images
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {displayImages.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-figma-border"
                        />
                      ))}
              </div>
            </div>
                )}

                {/* Supervisor Review Section */}
                {isSupervisor && (
                  <div className="border-t border-figma-border pt-6">
                    <h3 className="font-poppins text-lg text-figma-text-primary mb-4">Review Entry</h3>
                    
                    {/* Review Actions */}
                    <div className="mb-4">
                      <label className="block font-poppins text-base text-figma-text-primary font-medium mb-2">
                        Review Decision
              </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setReviewAction("approve")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors font-poppins text-sm ${
                            reviewAction === "approve"
                              ? "bg-green-50 border-green-500 text-green-700"
                              : "border-figma-border hover:border-green-500 hover:bg-green-50"
                          }`}
                          disabled={isSaving || isApproved}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {profile?.role === 'supervisor_school' ? 'Final Approve' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setReviewAction("reject")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors font-poppins text-sm ${
                            reviewAction === "reject"
                              ? "bg-red-50 border-red-500 text-red-700"
                              : "border-figma-border hover:border-red-500 hover:bg-red-50"
                          }`}
                          disabled={isSaving || isApproved}
                        >
                          <X className="w-4 h-4" />
                          {profile?.role === 'supervisor_school' ? 'Final Reject' : 'Reject'}
                        </button>
              </div>
            </div>

                    {/* Comment Input */}
                    <div className="mb-4">
                      <label className="block font-poppins text-base text-figma-text-primary font-medium mb-2">
                        Feedback Comments
                      </label>
                      <textarea
                        value={supervisorComment}
                        onChange={(e) => setSupervisorComment(e.target.value)}
                        rows={4}
                        placeholder="Provide feedback on this entry..."
                        className="w-full px-4 py-4 rounded-lg border border-figma-border bg-[#F8F8F8] text-figma-text-primary font-poppins text-base placeholder:text-figma-text-secondary focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                        disabled={isSaving || isApproved}
                      />
                    </div>

                    {/* Current Status */}
                    <div className="mb-4">
                      <label className="block font-poppins text-base text-figma-text-primary font-medium mb-2">
                        Current Status
                      </label>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium font-poppins ${
                        displayEntry?.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : displayEntry?.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {displayEntry?.status === "approved" ? "Approved" : 
                         displayEntry?.status === "pending" ? "Pending Review" : 
                         displayEntry?.status || "Unknown"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Feedback (for students) */}
                {!isSupervisor && displayFeedback && (
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-figma-text-primary font-medium">
                      Supervisor Feedback
                    </label>
                    <div className="bg-figma-bg p-4 rounded-lg border border-figma-border">
                      <p className="text-figma-text-primary font-poppins text-base">{displayFeedback}</p>
                    </div>
                  </div>
            )}

          {/* Action Buttons */}
                {(isEditing || (isSupervisor && reviewAction === "approve") || (isSupervisor && reviewAction === "reject")) && (
                  <div className="flex gap-3 pt-4 border-t border-figma-border">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded hover:bg-gray-800 transition-colors font-poppins text-base disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                <button 
                  onClick={handleCancel}
                      disabled={isSaving}
                      className="px-6 py-2.5 border border-figma-border text-figma-text-primary rounded hover:bg-gray-50 transition-colors font-poppins text-base disabled:opacity-50"
                >
                  Cancel
                </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}