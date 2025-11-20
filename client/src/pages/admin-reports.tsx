import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, Ban, Clock, CheckCircle, XCircle, UserX } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  reportedBy: string;
  postId: string;
  postAuthorId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
  post?: {
    id: string;
    content: string;
    mediaUrl?: string;
    createdAt: string;
  };
  postAuthor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [suspensionType, setSuspensionType] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['/api/admin/reports', statusFilter],
    queryFn: () => {
      const statusParam = statusFilter === "all" ? "" : statusFilter;
      return apiRequest("GET", `/api/admin/reports?status=${statusParam}`);
    },
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, updates }: { reportId: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/admin/reports/${reportId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      setSelectedReport(null);
      setAdminNotes("");
      setActionTaken("");
      toast({
        title: "Report updated",
        description: "The report has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update report. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, suspensionType }: { userId: string; suspensionType: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/suspend`, { suspensionType });
    },
    onSuccess: () => {
      setShowSuspendDialog(false);
      setSuspensionType("");
      setSelectedUser(null);
      toast({
        title: "User suspended",
        description: "The user has been suspended successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend user. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleReviewReport = (report: Report, status: 'reviewed' | 'resolved' | 'dismissed') => {
    updateReportMutation.mutate({
      reportId: report.id,
      updates: {
        status,
        adminNotes,
        actionTaken
      }
    });
  };

  const handleSuspendUser = (user: any) => {
    setSelectedUser(user);
    setShowSuspendDialog(true);
  };

  const confirmSuspension = () => {
    if (!selectedUser || !suspensionType) return;
    
    suspendUserMutation.mutate({
      userId: selectedUser.id,
      suspensionType
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'reviewed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Eye className="w-3 h-3 mr-1" />Reviewed</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'hate_speech':
      case 'discrimination':
        return 'text-red-600';
      case 'pornographic':
        return 'text-purple-600';
      case 'harassment':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatReason = (reason: string) => {
    return reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Reports</h1>
          <p className="text-muted-foreground">Review and moderate reported content</p>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Reports</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="all">All Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {statusFilter ? `No ${statusFilter} reports at this time.` : 'No reports have been submitted yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <h3 className={cn("font-semibold", getReasonColor(report.reason))}>
                        {formatReason(report.reason)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Reported {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                {report.description && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{report.description}</p>
                  </div>
                )}

                {/* Reporter Info */}
                {report.reporter && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Reported by:</p>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={report.reporter.profileImageUrl} />
                        <AvatarFallback className="text-xs">
                          {report.reporter.firstName[0]}{report.reporter.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {report.reporter.firstName} {report.reporter.lastName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reported Content */}
                {report.post && (
                  <div className="mb-4 border rounded-lg p-4 bg-red-50">
                    <p className="text-sm font-medium mb-2">Reported content:</p>
                    <div className="space-y-2">
                      {report.post.content && (
                        <p className="text-sm">{report.post.content}</p>
                      )}
                      {report.post.mediaUrl && (
                        <img 
                          src={report.post.mediaUrl} 
                          alt="Reported content" 
                          className="max-w-xs rounded"
                        />
                      )}
                    </div>
                    {report.postAuthor && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={report.postAuthor.profileImageUrl} />
                            <AvatarFallback className="text-xs">
                              {report.postAuthor.firstName[0]}{report.postAuthor.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {report.postAuthor.firstName} {report.postAuthor.lastName}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSuspendUser(report.postAuthor)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-suspend-user-${report.postAuthor?.id}`}
                        >
                          <UserX className="w-3 h-3 mr-1" />
                          Suspend User
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Actions */}
                {report.status === 'pending' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="admin-notes">Admin Notes</Label>
                        <Textarea
                          id="admin-notes"
                          placeholder="Add notes about your review..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="action-taken">Action Taken</Label>
                        <Textarea
                          id="action-taken"
                          placeholder="Describe what action was taken..."
                          value={actionTaken}
                          onChange={(e) => setActionTaken(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleReviewReport(report, 'resolved')}
                        disabled={updateReportMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-resolve-${report.id}`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewReport(report, 'dismissed')}
                        disabled={updateReportMutation.isPending}
                        data-testid={`button-dismiss-${report.id}`}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewReport(report, 'reviewed')}
                        disabled={updateReportMutation.isPending}
                        data-testid={`button-review-${report.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Mark Reviewed
                      </Button>
                    </div>
                  </div>
                )}

                {/* Review Info */}
                {report.status !== 'pending' && (
                  <div className="mt-4 pt-4 border-t">
                    {report.adminNotes && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Admin Notes:</p>
                        <p className="text-sm text-muted-foreground">{report.adminNotes}</p>
                      </div>
                    )}
                    {report.actionTaken && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Action Taken:</p>
                        <p className="text-sm text-muted-foreground">{report.actionTaken}</p>
                      </div>
                    )}
                    {report.reviewedAt && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed on {new Date(report.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suspend User Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Ban className="h-5 w-5 text-red-500" />
              <span>Suspend User</span>
            </DialogTitle>
            <DialogDescription>
              Enter suspension details for the reported user. This action will temporarily restrict their access.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedUser.profileImageUrl} />
                  <AvatarFallback>
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div>
                <Label>Suspension Duration</Label>
                <Select value={suspensionType} onValueChange={setSuspensionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select suspension duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="180d">180 Days</SelectItem>
                    <SelectItem value="permanent">Permanent Ban</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuspendDialog(false);
                    setSuspensionType("");
                    setSelectedUser(null);
                  }}
                  disabled={suspendUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSuspension}
                  disabled={suspendUserMutation.isPending || !suspensionType}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-confirm-suspension"
                >
                  {suspendUserMutation.isPending ? "Suspending..." : "Suspend User"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}