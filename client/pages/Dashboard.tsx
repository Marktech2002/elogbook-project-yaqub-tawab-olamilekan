import {
  Calendar as CalendarIcon,
  FileEdit,
  CheckCircle2,
  Hourglass,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Lightbulb,
  Menu,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import NewLogEntryModal from "../components/NewLogEntryModal";
import LogbookDetailModal from "../components/LogbookDetailModal";
import Header from "../components/layout/Header";
import { useAuth } from "../hooks/use-auth";
import { useLogbook } from "../hooks/use-logbook";
import { useSupervisor } from "../hooks/use-supervisor";
import { Calendar } from "@/components/ui/calendar";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { entries, stats, isLoading: logbookLoading, refreshData } = useLogbook();
  const { 
    assignedStudents, 
    pendingReviews, 
    supervisorStats, 
    allStudentEntries,
    isLoading: supervisorLoading 
  } = useSupervisor();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Derive role and name with safe fallbacks (profile may be null on first load or if not created yet)
  const role = profile?.role || 'student';
  const firstName = profile?.first_name || (user?.email ? user.email.split('@')[0] : 'User');

  // Refresh data when modal closes (in case a new entry was added)
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    refreshData();
  }, [refreshData]);

  const getUserFullName = useCallback(() => {
    if (!profile) return firstName;
    const { first_name, middle_name, last_name } = profile;
    return [first_name, middle_name, last_name].filter(Boolean).join(' ');
  }, [profile, firstName]);

  const getRoleDisplayName = useCallback(() => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'supervisor_school':
        return 'School Supervisor';
      case 'supervisor_industry':
        return 'Industry Supervisor';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'User';
    }
  }, [role]);

  const statsCards = useMemo(() => {
    if (role === 'student') {
      return [
        { icon: CalendarIcon, title: "Total Weeks Completed", value: Math.ceil(stats.total / 5).toString(), suffix: "/ 24" },
        { icon: FileEdit, title: "Total Log Entries", value: stats.total.toString(), suffix: "Entries" },
        { icon: CheckCircle2, title: "Approved Entries", value: stats.approved.toString(), suffix: "Entries" },
        { icon: Hourglass, title: "Pending Review", value: stats.pending.toString(), suffix: "Entries" },
      ];
    } else if (role === 'supervisor_school') {
      // School supervisor specific stats
      if (supervisorStats) {
        return [
          { icon: CalendarIcon, title: "Students Assigned", value: supervisorStats.studentsCount.toString(), suffix: "Students" },
          { icon: FileEdit, title: "Pending Final Approval", value: supervisorStats.pendingReviews.toString(), suffix: "Entries" },
          { icon: CheckCircle2, title: "Final Approved", value: supervisorStats.completedReviews.toString(), suffix: "Entries" },
          { icon: Hourglass, title: "This Week Reviews", value: supervisorStats.thisWeekReviews.toString(), suffix: "Reviews" },
        ];
      } else {
        return [
          { icon: CalendarIcon, title: "Students Assigned", value: "Loading...", suffix: "Students" },
          { icon: FileEdit, title: "Pending Final Approval", value: "Loading...", suffix: "Entries" },
          { icon: CheckCircle2, title: "Final Approved", value: "Loading...", suffix: "Entries" },
          { icon: Hourglass, title: "This Week Reviews", value: "Loading...", suffix: "Reviews" },
        ];
      }
    } else if (role === 'supervisor_industry') {
      // Industry supervisor stats (existing code)
      if (supervisorStats) {
        return [
          { icon: CalendarIcon, title: "Students Assigned", value: supervisorStats.studentsCount.toString(), suffix: "Students" },
          { icon: FileEdit, title: "Pending Reviews", value: supervisorStats.pendingReviews.toString(), suffix: "Entries" },
          { icon: CheckCircle2, title: "Completed Reviews", value: supervisorStats.completedReviews.toString(), suffix: "Entries" },
          { icon: Hourglass, title: "This Week", value: supervisorStats.thisWeekReviews.toString(), suffix: "Reviews" },
        ];
      } else {
        return [
          { icon: CalendarIcon, title: "Students Assigned", value: "Loading...", suffix: "Students" },
          { icon: FileEdit, title: "Pending Reviews", value: "Loading...", suffix: "Entries" },
          { icon: CheckCircle2, title: "Completed Reviews", value: "Loading...", suffix: "Entries" },
          { icon: Hourglass, title: "This Week", value: "Loading...", suffix: "Reviews" },
        ];
      }
    }
    return [
      { icon: CalendarIcon, title: "Total Activities", value: "0", suffix: "Activities" },
      { icon: FileEdit, title: "Total Reports", value: "0", suffix: "Reports" },
      { icon: CheckCircle2, title: "Completed Tasks", value: "0", suffix: "Tasks" },
      { icon: Hourglass, title: "Pending Items", value: "0", suffix: "Items" },
    ];
  }, [role, stats.total, stats.approved, stats.pending, supervisorStats]);

  const recentActivities = useMemo(() => {
    // For student, generate activities based on real entries
    if (role === 'student' && entries.length > 0) {
      // Sort entries by date, newest first
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      
      // Take the 3 most recent entries
      const recentEntries = sortedEntries.slice(0, 3);
      
      return recentEntries.map(entry => {
        const createdDate = new Date(entry.created_at || '');
        const formattedDate = createdDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        let title = '';
        let description = '';
        
        if (entry.status === 'approved') {
          title = 'Your logbook entry was approved';
          description = `Your entry "${entry.title}" has been approved by your supervisor.`;
        } else if (entry.status === 'pending') {
          title = 'Your logbook entry is awaiting review';
          description = `Your entry "${entry.title}" has been submitted and is awaiting supervisor review.`;
        } else {
          title = 'You saved a draft logbook entry';
          description = `You saved "${entry.title}" as a draft. Remember to submit it for review.`;
        }
        
        return {
          title,
          description,
          date: formattedDate,
          time: formattedTime
        };
      });
    } else if (role === 'supervisor_school' || role === 'supervisor_industry') {
      // Use real pending reviews data if available
      if (pendingReviews.length > 0) {
        return pendingReviews.slice(0, 3).map(review => {
          const createdDate = new Date(review.created_at);
          const formattedDate = createdDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          const formattedTime = createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          
          const studentName = `${review.student.first_name} ${review.student.last_name}`.trim();
          
          if (role === 'supervisor_school') {
            return {
              title: "Logbook entry ready for final approval",
              description: `Student ${studentName}'s entry "${review.title}" has been approved by industry supervisor and is ready for your final review.`,
              date: formattedDate,
              time: formattedTime
            };
          } else {
          return {
            title: "New logbook entry submitted for review",
            description: `Student ${studentName} has submitted a new entry for ${review.date}. Please review and provide feedback.`,
            date: formattedDate,
            time: formattedTime
          };
          }
        });
      } else {
        // Fallback to mock data if no real data
        if (role === 'supervisor_school') {
          return [
            { title: "No entries pending final approval", description: "All industry-approved entries have been reviewed.", date: "Today", time: "Now" },
            { title: "System Ready", description: "Your dashboard is ready for final approval reviews.", date: "Today", time: "Now" },
          ];
        } else {
        return [
          { title: "No pending reviews", description: "All assigned students' entries have been reviewed.", date: "Today", time: "Now" },
          { title: "System Ready", description: "Your dashboard is ready for new student submissions.", date: "Today", time: "Now" },
        ];
        }
      }
    }
    return [];
  }, [role, entries, pendingReviews]);

  const submittedReports = useMemo(() => {
    if (role === 'student' && entries.length > 0) {
      // Sort entries by date, newest first
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      
      // Take the 5 most recent entries
      const recentEntries = sortedEntries.slice(0, 5);
      
      return recentEntries.map(entry => {
        const entryDate = new Date(entry.date);
        const formattedDate = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return {
          id: entry.id,
          date: formattedDate,
          taskSummary: entry.title,
          status: entry.status === 'draft' ? 'Draft' : 'Submitted',
          feedback: entry.status === 'approved' ? 'Approved' : 'Pending',
          feedbackType: entry.status === 'approved' ? 'approved' : 'pending',
          title: entry.title,
          tasksPerformed: entry.task_done,
          supervisorFeedback: entry.comments_from_supervisor,
          images: entry.media_url
        };
      });
    } else if (role === 'supervisor_school' || role === 'supervisor_industry') {
      // Use real student entries data for supervisors (both pending and approved)
      if (allStudentEntries.length > 0) {
        return allStudentEntries.slice(0, 5).map(entry => {
          const entryDate = new Date(entry.date);
          const formattedDate = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          
          const studentName = `${entry.student.first_name} ${entry.student.last_name}`.trim();
          
          if (role === 'supervisor_school') {
            // For school supervisors, show industry supervisor feedback status
            const hasIndustryFeedback = entry.comments_from_supervisor && 
              !entry.comments_from_supervisor.includes('[SCHOOL_APPROVED]') &&
              !entry.comments_from_supervisor.includes('[SCHOOL_REJECTED]');
            
            const hasSchoolFeedback = entry.comments_from_supervisor && 
              (entry.comments_from_supervisor.includes('[SCHOOL_APPROVED]') ||
               entry.comments_from_supervisor.includes('[SCHOOL_REJECTED]'));
            
            let status = "Pending Final Review";
            let feedback = "Industry Approved";
            let feedbackType = "pending";
            
            if (hasSchoolFeedback) {
              if (entry.comments_from_supervisor?.includes('[SCHOOL_APPROVED]')) {
                status = "Final Approved";
                feedback = "Final Approved";
                feedbackType = "approved";
              } else {
                status = "Final Rejected";
                feedback = "Final Rejected";
                feedbackType = "rejected";
              }
            } else if (hasIndustryFeedback) {
              status = "Ready for Final Review";
              feedback = "Industry Approved";
              feedbackType = "pending";
            }
            
            return {
              id: entry.id,
              date: formattedDate,
              taskSummary: `${studentName} - ${entry.title}`,
              status: status,
              feedback: feedback,
              feedbackType: feedbackType,
              title: entry.title,
              tasksPerformed: entry.task_done,
              supervisorFeedback: entry.comments_from_supervisor,
              images: entry.media_url,
              student: entry.student,
              student_id: entry.student_id,
              entryStatus: entry.status
            };
          } else {
            // Industry supervisor view (existing code)
          return {
            id: entry.id,
            date: formattedDate,
            taskSummary: `${studentName} - ${entry.title}`,
            status: entry.status === 'pending' ? "Pending Review" : "Approved",
            feedback: entry.status === 'pending' ? "Pending Review" : "Approved",
            feedbackType: entry.status === 'pending' ? "pending" : "approved",
            title: entry.title,
            tasksPerformed: entry.task_done,
            supervisorFeedback: entry.comments_from_supervisor,
            images: entry.media_url,
            student: entry.student,
            student_id: entry.student_id,
            entryStatus: entry.status
          };
          }
        });
      } else {
        // Show assigned students if no entries
        return assignedStudents.slice(0, 5).map(student => {
          const studentName = `${student.first_name} ${student.last_name}`.trim();
          
          return {
            id: student.id,
            date: "No entries",
            taskSummary: `${studentName} - No recent submissions`,
            status: "No Activity",
            feedback: "No pending items",
            feedbackType: "none",
            title: "No recent activity",
            tasksPerformed: "Student has not submitted any recent entries",
            supervisorFeedback: "",
            images: [],
            student: student,
            student_id: student.id,
            entryStatus: "no_activity"
          };
        });
      }
    }
    return [];
  }, [role, entries, pendingReviews, assignedStudents, allStudentEntries]) as Array<{
    id: string;
    date: string;
    taskSummary: string;
    status: string;
    feedback: string;
    feedbackType: string;
    title: string;
    tasksPerformed: string;
    supervisorFeedback: string;
    images: string[];
    student?: any;
    student_id?: string;
    entryStatus?: string;
  }>;

  // Check if today's entry exists
  const hasTodaysEntry = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return entries.some(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
  }, [entries]);

  // Handle view button click
  const handleViewEntry = useCallback((report: any) => {
    console.log('Viewing entry:', report);
    setSelectedEntry(report);
    setIsDetailModalOpen(true);
  }, []);

  // Only block rendering while session/profile is being resolved
  const isInitialLoading = authLoading || logbookLoading || (supervisorLoading && (role === 'supervisor_school' || role === 'supervisor_industry'));

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-figma-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-figma-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-figma-bg">
      <Header 
        activePath="/dashboard" 
        logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/06a5fef2d74d4e97ef25d5fa5c379c9ecbdcc43a?width=144" 
        userName={getUserFullName()}
        userRole={getRoleDisplayName()}
      />

      <main className="p-4 sm:p-6 max-w-[1400px] mx-auto pt-4">
        <div className="bg-figma-card rounded-[22px] border border-figma-border p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-figma-text-primary mb-2">
              Welcome back, {firstName}!
            </h1>
            <p className="text-figma-text-secondary">
              Here's what's happening with your {role === 'student' ? 'logbook' : 'supervision'} activities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {statsCards.map((card, index) => (
              <div key={index} className="bg-figma-card border border-figma-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <card.icon className="w-6 h-6 text-figma-text-primary" />
                  <span className="font-inter text-base text-figma-text-secondary">{card.title}</span>
                </div>
                <div className="font-inter text-figma-text-primary">
                  <span className="text-3xl font-bold">{card.value}</span>
                  <span className="text-lg font-bold ml-1">{card.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {role === 'student' && !hasTodaysEntry() && (
          <div className="bg-figma-card border border-figma-border rounded-xl p-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-black/10 rounded-full p-3">
                <Lightbulb className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-poppins text-base text-figma-text-primary mb-2">Logbook Submission</h3>
                <p className="font-poppins text-sm text-figma-text-secondary">You haven't submitted your logbook entry for today.</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-6 py-3 rounded font-roboto text-base hover:bg-gray-800 transition-colors"
            >
              Submit Now
            </button>
          </div>
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Recent Activities */}
            <div className="lg:col-span-2 bg-figma-card border border-figma-border rounded-xl">
              <div className="border-b border-figma-border-light p-4">
                <h3 className="font-poppins font-semibold text-base text-figma-text-primary">
                  {role === 'student' ? 'Recent Activities' : 'Recent Supervisions'}
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                  <div key={index}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-poppins text-base text-figma-text-primary mb-2">{activity.title}</h4>
                        <p className="font-poppins text-sm text-figma-text-secondary">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-poppins text-sm text-figma-text-primary">{activity.date}</div>
                        <div className="font-poppins text-sm text-figma-text-secondary">{activity.time}</div>
                      </div>
                    </div>
                    {index < recentActivities.length - 1 && (
                      <div className="h-px bg-figma-border mt-4"></div>
                    )}
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-figma-text-secondary">No recent activities to display.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-figma-card border border-figma-border rounded-xl p-4 flex flex-col">
              <div className="border-b border-figma-border-light pb-4 mb-4">
                <h3 className="font-poppins font-semibold text-base text-figma-text-primary">Calendar</h3>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
                  return date.getTime() !== today.getTime();
                }}
                className="rounded-md"
              />
            </div>
          </div>

          {submittedReports.length > 0 && (
          <div className="bg-figma-card border border-figma-border rounded-3xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                  <h3 className="font-poppins text-base text-figma-text-primary mb-1">
                    {role === 'student' ? 'Recently Submitted Reports' : 'Recent Student Submissions'}
                  </h3>
                  <p className="font-poppins text-base text-figma-text-secondary">
                    {role === 'student' 
                      ? 'View your latest logbook entries, track their feedback status.'
                      : 'Review recent student submissions and provide feedback.'
                    }
                  </p>
              </div>
              <Link to="/logbook-reports" className="flex items-center gap-2 px-4 py-2 border border-figma-border rounded bg-figma-card">
                <span className="font-poppins text-base text-figma-text-primary">See all</span>
                <ArrowRight className="w-4 h-4 text-figma-text-primary" />
              </Link>
            </div>

            <div className="bg-figma-card border border-figma-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="bg-figma-bg border-b border-figma-border px-4 sm:px-6 py-4 grid grid-cols-12 gap-2 sm:gap-4 items-center min-w-[800px]">
                  <div className="col-span-1">
                    <input type="checkbox" className="w-5 h-5 border border-figma-border rounded" />
                  </div>
                  <div className="col-span-2">
                    <span className="font-roboto text-sm sm:text-base text-figma-text-primary">Date</span>
                  </div>
                  <div className="col-span-4">
                      <span className="font-roboto text-sm sm:text-base text-figma-text-primary">
                        {role === 'student' ? 'Task Summary' : 
                         role === 'supervisor_school' ? 'Student & Task Summary' : 'Student & Task Summary'}
                      </span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-roboto text-sm sm:text-base text-figma-text-primary">
                      {role === 'supervisor_school' ? 'Review Status' : 'Status'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-roboto text-sm sm:text-base text-figma-text-primary">
                      {role === 'supervisor_school' ? 'Approval Status' : 'Feedback'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="font-roboto text-sm sm:text-base text-figma-text-primary">Action</span>
                  </div>
                </div>

                {submittedReports.map((report, index) => (
                  <div key={index} className="border-b border-figma-border px-4 sm:px-6 py-4 grid grid-cols-12 gap-2 sm:gap-4 items-center min-w-[800px]">
                    <div className="col-span-1">
                      <input type="checkbox" className="w-5 h-5 border border-figma-border rounded" />
                    </div>
                    <div className="col-span-2">
                      <span className="font-inter text-sm sm:text-base text-figma-text-secondary">{report.date}</span>
                    </div>
                    <div className="col-span-4">
                      <span className="font-inter text-sm sm:text-base text-figma-text-secondary">{report.taskSummary}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-inter text-sm sm:text-base text-figma-text-secondary">{report.status}</span>
                    </div>
                    <div className="col-span-2">
                      <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-inter ${
                        report.feedbackType === 'approved'
                          ? 'bg-figma-success-bg text-figma-success'
                          : report.feedbackType === 'pending'
                          ? 'bg-figma-warning-bg text-figma-warning'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span>{report.feedback}</span>
                        {report.feedbackType === 'approved' ? (
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : report.feedbackType === 'pending' ? (
                          <Hourglass className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : null}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button 
                        onClick={() => handleViewEntry(report)}
                        className="font-inter text-sm sm:text-base text-figma-text-primary underline hover:no-underline"
                      >
                          {role === 'student' ? 'View' : 
                           role === 'supervisor_school' ? 'Final Review' : 'Review'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

      {role === 'student' && (
      <NewLogEntryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedDate={date}
      />
      )}

      {/* Logbook Detail Modal */}
      <LogbookDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        entry={selectedEntry}
        mode="view"
        onSuccess={refreshData}
      />
    </div>
  );
}
