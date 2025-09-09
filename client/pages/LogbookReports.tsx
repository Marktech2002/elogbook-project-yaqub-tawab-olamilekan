import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Eye, Edit, Trash2, Search, Filter, Download, ChevronDown } from "lucide-react";
import Header from "../components/layout/Header";
import LogbookDetailModal from "../components/LogbookDetailModal";
import { useAuth } from "../hooks/use-auth";
import { useLogbook } from "../hooks/use-logbook";
import { useSupervisor } from "../hooks/use-supervisor";

export default function LogbookReports() {
  const { profile } = useAuth();
  const { entries, stats, isLoading: logbookLoading, refreshData } = useLogbook();
  const { 
    assignedStudents, 
    pendingReviews, 
    allStudentEntries,
    isLoading: supervisorLoading 
  } = useSupervisor();
  
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped'); // Default to grouped view for supervisors

  // Determine role and data source
  const role = profile?.role || 'student';
  const isSupervisor = role === 'supervisor_school' || role === 'supervisor_industry';

  // Get data based on role - FIXED: Use allStudentEntries for supervisors
  const dataSource = useMemo(() => {
    if (isSupervisor) {
      // For supervisors, show all student entries, not just pending reviews
      console.log('Debug - Using allStudentEntries for supervisor:', allStudentEntries);
      return allStudentEntries || [];
    }
    console.log('Debug - Using entries for student:', entries);
    return entries || [];
  }, [isSupervisor, allStudentEntries, entries]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = dataSource;
    console.log('Debug - DataSource before filtering:', filtered);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item: any) => {
        if (isSupervisor && item.student) {
          // For supervisors, search in student name and task title
          const studentName = `${item.student.first_name || ''} ${item.student.last_name || ''}`.toLowerCase();
          const taskTitle = (item.title || '').toLowerCase();
          return studentName.includes(searchTerm.toLowerCase()) || taskTitle.includes(searchTerm.toLowerCase());
        } else {
          // For students, search in title and tasks
          const title = (item.title || '').toLowerCase();
          const tasks = (item.task_done || '').toLowerCase();
          return title.includes(searchTerm.toLowerCase()) || tasks.includes(searchTerm.toLowerCase());
        }
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item: any) => {
        const itemStatus = item.status || item.entryStatus;
        console.log('Debug - Item status:', itemStatus, 'Filter:', statusFilter);
        return itemStatus === statusFilter;
      });
    }

    console.log('Debug - Filtered data:', filtered);
    return filtered;
  }, [dataSource, searchTerm, statusFilter, isSupervisor]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Group data by student for supervisor view
  const groupedByStudent = useMemo(() => {
    if (!isSupervisor || viewMode !== 'grouped') return null;
    
    const grouped = filteredData.reduce((acc: any, entry: any) => {
      const studentId = entry.student_id || entry.student?.id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: entry.student,
          entries: []
        };
      }
      acc[studentId].entries.push(entry);
      return acc;
    }, {});
    
    return Object.values(grouped);
  }, [filteredData, isSupervisor, viewMode]);

  // Toggle student expansion
  const toggleStudent = (studentId: string) => {
    setExpandedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Toggle all students
  const toggleAllStudents = () => {
    if (expandedStudents.length === groupedByStudent?.length) {
      setExpandedStudents([]);
    } else {
      setExpandedStudents(groupedByStudent?.map((group: any) => group.student.id) || []);
    }
  };

  // Handle action button click
  const handleActionClick = (action: string, entry: any) => {
    console.log('Action clicked:', action, 'Entry:', entry);
    
    if (action === 'view') {
      // Prepare entry data for the modal
      const modalEntry = isSupervisor ? {
        ...entry,
        // Ensure we have all required fields for supervisor review
        id: entry.id,
        title: entry.title || 'No title',
        task_done: entry.task_done || 'No tasks described',
        date: entry.date || entry.created_at,
        status: entry.status || 'pending',
        comments_from_supervisor: entry.comments_from_supervisor || '',
        media_url: entry.media_url || [],
        student: entry.student || {},
        student_id: entry.student_id || entry.student?.id
      } : entry;
      
      setSelectedEntry(modalEntry);
      setIsDetailModalOpen(true);
    }
  };

  // Get status display info
  const getStatusInfo = (status: string, isSupervisorView: boolean = false) => {
    if (isSupervisorView) {
      switch (status) {
        case 'pending':
          return { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' };
        case 'approved':
          return { text: 'Approved', color: 'bg-green-100 text-green-800' };
        case 'rejected':
          return { text: 'Rejected', color: 'bg-red-100 text-red-800' };
        default:
          return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
      }
    } else {
      switch (status) {
        case 'draft':
          return { text: 'Draft', color: 'bg-gray-100 text-gray-800' };
        case 'pending':
          return { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' };
        case 'approved':
          return { text: 'Approved', color: 'bg-green-100 text-green-800' };
        default:
          return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
      }
    }
  };

  // Get display name for supervisor view
  const getDisplayName = (item: any) => {
    if (isSupervisor && item.student) {
      const firstName = item.student.first_name || '';
      const lastName = item.student.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown Student';
    }
    return 'Your Entry';
  };

  // Get display title for supervisor view
  const getDisplayTitle = (item: any) => {
    if (isSupervisor) {
      return item.title || 'No title provided';
    }
    return item.title || 'Untitled';
  };

  // Get display date
  const getDisplayDate = (item: any) => {
    const date = item.date || item.created_at;
    if (!date) return 'No date';
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isLoading = logbookLoading || (supervisorLoading && isSupervisor);

  // Debug stats calculation for supervisors
  const supervisorStats = useMemo(() => {
    if (!isSupervisor) return null;
    
    const totalEntries = allStudentEntries?.length || 0;
    const pendingCount = allStudentEntries?.filter(entry => entry.status === 'pending').length || 0;
    const approvedCount = allStudentEntries?.filter(entry => entry.status === 'approved').length || 0;
    const draftCount = allStudentEntries?.filter(entry => entry.status === 'draft').length || 0;
    
    console.log('Debug - Supervisor Stats:', { totalEntries, pendingCount, approvedCount, draftCount });
    
    return {
      totalEntries,
      pendingCount,
      approvedCount,
      draftCount,
      studentsCount: assignedStudents?.length || 0
    };
  }, [isSupervisor, allStudentEntries, assignedStudents]);

  return (
    <div className="min-h-screen bg-figma-bg">
      <Header 
        activePath="/logbook-reports" 
        logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/06a5fef2d74d4e97ef25d5fa5c379c9ecbdcc43a?width=144" 
        userName={`${profile?.first_name} ${profile?.last_name}`.trim()}
        userRole={role === 'student' ? 'Student' : role === 'supervisor_school' ? 'School Supervisor' : role === 'supervisor_industry' ? 'Industry Supervisor' : 'User'}
      />

      <main className="p-4 sm:p-6 max-w-[1400px] mx-auto pt-4">
        <div className="bg-figma-card rounded-[22px] border border-figma-border p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-figma-text-primary">
                  {isSupervisor ? 'Student Submissions' : 'Logbook Reports'}
                </h1>
                <p className="text-figma-text-secondary">
                  {isSupervisor 
                    ? 'Review and manage student logbook submissions'
                    : 'Track your logbook entries and supervisor feedback'
                  }
                </p>
              </div>
            </div>
            
            {!isSupervisor && (
              <Link
                to="/new-entry"
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
            New Entry
              </Link>
            )}
        </div>

          {/* Debug Info - Remove this in production */}
          {/* <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info (Remove in production):</h3>
            <p className="text-sm text-yellow-700">
              Role: {role} | Is Supervisor: {String(isSupervisor)} | 
              Data Source Length: {dataSource?.length || 0} | 
              Filtered Data Length: {filteredData?.length || 0}
            </p>
            {isSupervisor && (
              <p className="text-sm text-yellow-700">
                All Student Entries: {allStudentEntries?.length || 0} | 
                Pending Reviews: {pendingReviews?.length || 0} | 
                Assigned Students: {assignedStudents?.length || 0}
              </p>
            )}
          </div> */}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {isSupervisor ? (
              // Supervisor stats - FIXED: Use calculated stats
              <>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">
                    {supervisorStats?.studentsCount || 0}
                  </div>
                  <div className="text-figma-text-secondary">Students Assigned</div>
                </div>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">
                    {supervisorStats?.pendingCount || 0}
                  </div>
                  <div className="text-figma-text-secondary">Pending Reviews</div>
                </div>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">
                    {supervisorStats?.approvedCount || 0}
                  </div>
                  <div className="text-figma-text-secondary">Approved</div>
                </div>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">
                    {supervisorStats?.totalEntries || 0}
                  </div>
                  <div className="text-figma-text-secondary">Total Entries</div>
                </div>
              </>
            ) : (
              // Student stats
              <>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">{stats?.total || 0}</div>
                  <div className="text-figma-text-secondary">Total Entries</div>
                </div>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">{stats?.approved || 0}</div>
                  <div className="text-figma-text-secondary">Approved</div>
                </div>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">{stats?.pending || 0}</div>
                  <div className="text-figma-text-secondary">Pending</div>
                </div>
                <div className="bg-figma-card border border-figma-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-figma-text-primary">{stats?.draft || 0}</div>
                  <div className="text-figma-text-secondary">Drafts</div>
              </div>
              </>
            )}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                placeholder={isSupervisor ? "Search students or tasks..." : "Search entries..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              </div>

            <div className="flex gap-2">
              {/* View Mode Toggle for Supervisors */}
              {isSupervisor && (
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-black text-white' 
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      viewMode === 'grouped' 
                        ? 'bg-black text-white' 
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Grouped by Student
                  </button>
                </div>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Status</option>
                {isSupervisor ? (
                  <>
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="draft">Draft</option>
                  </>
                ) : (
                  <>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </>
                )}
              </select>
              
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No entries match your filters.' 
                  : isSupervisor 
                    ? 'No student submissions found.' 
                    : 'No logbook entries found.'
                }
              </p>
              {/* Additional debug info */}
              <p className="text-gray-400 text-sm mt-2">
                Debug: DataSource has {dataSource?.length || 0} items
              </p>
            </div>
          ) : (
            <>
              {/* Grouped View for Supervisors */}
              {isSupervisor && viewMode === 'grouped' && groupedByStudent && (
                <div className="space-y-4 mb-6">
                  {/* Group Controls */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-figma-text-primary">
                      Students ({groupedByStudent.length})
                    </h3>
                    <button
                      onClick={toggleAllStudents}
                      className="text-sm text-figma-text-primary hover:text-black transition-colors"
                    >
                      {expandedStudents.length === groupedByStudent.length ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>

                  {/* Student Groups */}
                  {groupedByStudent.map((studentGroup: any) => {
                    const student = studentGroup.student;
                    const isExpanded = expandedStudents.includes(student.id);
                    const pendingCount = studentGroup.entries.filter((entry: any) => entry.status === 'pending').length;
                    const approvedCount = studentGroup.entries.filter((entry: any) => entry.status === 'approved').length;
                    const draftCount = studentGroup.entries.filter((entry: any) => entry.status === 'draft').length;
                    
                    return (
                      <div key={student.id} className="border border-figma-border rounded-lg overflow-hidden">
                        {/* Student Header */}
                        <div 
                          className="p-4 bg-figma-bg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleStudent(student.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-figma-text-primary">
                                {student.first_name} {student.last_name}
                              </h3>
                              <div className="text-sm text-figma-text-secondary mt-1">
                                <span>Matric: {student.metric_no || 'N/A'}</span>
                                <span className="mx-2">•</span>
                                <span>Dept: {student.department || 'N/A'}</span>
                                <span className="mx-2">•</span>
                                <span>{studentGroup.entries.length} total entries</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {/* Status Summary */}
                              <div className="flex items-center gap-3 text-sm">
                                {pendingCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {pendingCount} Pending
                                  </span>
                                )}
                                {approvedCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {approvedCount} Approved
                                  </span>
                                )}
                                {draftCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {draftCount} Draft
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-figma-text-secondary">
                                <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Student Entries */}
                        {isExpanded && (
                          <div className="border-t border-figma-border">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b border-figma-border">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                                      Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                                      Task Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-figma-border">
                                  {studentGroup.entries.map((entry: any, index: number) => {
                                    const itemStatus = entry.status || entry.entryStatus || 'unknown';
                                    return (
                                      <tr key={entry.id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-figma-text-secondary">
                                          {getDisplayDate(entry)}
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm font-medium text-figma-text-primary">
                                            {getDisplayTitle(entry)}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            itemStatus === 'approved'
                                              ? 'bg-green-100 text-green-800'
                                              : itemStatus === 'pending'
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : itemStatus === 'draft'
                                              ? 'bg-gray-100 text-gray-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {itemStatus === 'approved' 
                                              ? 'Approved' 
                                              : itemStatus === 'pending' 
                                              ? 'Pending Review' 
                                              : itemStatus === 'draft'
                                              ? 'Draft'
                                              : itemStatus || 'Unknown'
                                            }
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <button
                                            onClick={() => handleActionClick('view', entry)}
                                            className="text-figma-text-primary hover:text-black transition-colors"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List View (Original Table) */}
              {(!isSupervisor || viewMode === 'list') && (
                <div className="bg-figma-card border border-figma-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-figma-bg border-b border-figma-border">
                        <tr>
                          {isSupervisor && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                              Student
                            </th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                            {isSupervisor ? 'Task Title' : 'Title'}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-figma-text-secondary uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-figma-border">
                        {currentData.map((item: any, index: number) => {
                          const itemStatus = item.status || item.entryStatus;
                          return (
                            <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                              {isSupervisor && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-figma-text-primary">
                                    {getDisplayName(item)}
                                  </div>
                                  {item.student?.metric_no && (
                                    <div className="text-sm text-figma-text-secondary">
                                      {item.student.metric_no}
                                    </div>
                                  )}
                                </td>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-figma-text-secondary">
                                {getDisplayDate(item)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-figma-text-primary">
                                  {getDisplayTitle(item)}
                                </div>
                                {!isSupervisor && item.task_done && (
                                  <div className="text-sm text-figma-text-secondary truncate max-w-xs">
                                    {item.task_done}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  itemStatus === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : itemStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : itemStatus === 'draft'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {itemStatus === 'approved' 
                                    ? 'Approved' 
                                    : itemStatus === 'pending' 
                                    ? 'Pending Review' 
                                    : itemStatus === 'draft'
                                    ? 'Draft'
                                    : itemStatus || 'Unknown'
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleActionClick('view', item)}
                                    className="text-figma-text-primary hover:text-black transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {!isSupervisor && itemStatus === 'draft' && (
                                    <button
                                      onClick={() => handleActionClick('edit', item)}
                                      className="text-figma-text-primary hover:text-black transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  {!isSupervisor && itemStatus === 'draft' && (
                                    <button
                                      onClick={() => handleActionClick('delete', item)}
                                      className="text-red-600 hover:text-red-800 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

            {/* Pagination - Only show for list view */}
            {totalPages > 1 && (!isSupervisor || viewMode === 'list') && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Note for grouped view */}
            {isSupervisor && viewMode === 'grouped' && (
              <div className="mt-6 text-center text-sm text-gray-500">
                💡 <strong>Grouped View:</strong> All entries are shown grouped by student. Use the expand/collapse controls to manage visibility.
              </div>
            )}
        </div>
      </main>

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