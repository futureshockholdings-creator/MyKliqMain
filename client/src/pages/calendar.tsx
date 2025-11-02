import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Edit, Bell, User, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";

type CalendarNote = {
  id: string;
  kliqId: string;
  userId: string;
  noteDate: string;
  title: string;
  description: string | null;
  remindKliq: boolean;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
};

type Event = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  eventDate: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
};

const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  noteDate: z.string().min(1, "Date is required"),
  remindKliq: z.boolean().default(false),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

export default function Calendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const calendarDays = viewMode === "month"
    ? eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })
    : eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch calendar notes for the current view
  const { data: notes = [], isLoading: notesLoading } = useQuery<CalendarNote[]>({
    queryKey: ['/api/calendar/notes', viewMode === "month" ? format(monthStart, 'yyyy-MM-dd') : format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = viewMode === "month" ? format(monthStart, 'yyyy-MM-dd') : format(weekStart, 'yyyy-MM-dd');
      const endDate = viewMode === "month" ? format(monthEnd, 'yyyy-MM-dd') : format(weekEnd, 'yyyy-MM-dd');
      const response = await fetch(`/api/calendar/notes?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch calendar notes');
      return response.json();
    },
  });

  // Fetch events
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Get current user
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      description: "",
      noteDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      remindKliq: false,
    },
  });

  useEffect(() => {
    if (selectedDate) {
      form.setValue('noteDate', format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, form]);

  useEffect(() => {
    if (editingNote) {
      form.reset({
        title: editingNote.title,
        description: editingNote.description || "",
        noteDate: editingNote.noteDate,
        remindKliq: editingNote.remindKliq,
      });
    }
  }, [editingNote, form]);

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      return await apiRequest("POST", "/api/calendar/notes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/notes'] });
      toast({ title: "Note created successfully!" });
      setIsAddDialogOpen(false);
      setIsSheetOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NoteFormData> }) => {
      return await apiRequest("PUT", `/api/calendar/notes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/notes'] });
      toast({ title: "Note updated successfully!" });
      setEditingNote(null);
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/calendar/notes/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/notes'] });
      toast({ title: "Note deleted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NoteFormData) => {
    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, data });
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(viewMode === "month" ? subMonths(currentDate, 1) : new Date(currentDate.setDate(currentDate.getDate() - 7)));
  };

  const handleNextMonth = () => {
    setCurrentDate(viewMode === "month" ? addMonths(currentDate, 1) : new Date(currentDate.setDate(currentDate.getDate() + 7)));
  };

  const getNotesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return notes.filter(note => note.noteDate === dateStr);
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return format(eventDate, 'yyyy-MM-dd') === dateStr;
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsSheetOpen(true);
  };

  const handleAddNote = () => {
    setEditingNote(null);
    form.reset({
      title: "",
      description: "",
      noteDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      remindKliq: false,
    });
    setIsAddDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Kliq Calendar
            </h1>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                data-testid="button-month-view"
              >
                Month
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                data-testid="button-week-view"
              >
                Week
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth} data-testid="button-prev">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold" data-testid="text-current-month">
              {format(currentDate, viewMode === "month" ? 'MMMM yyyy' : 'MMM dd, yyyy')}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} data-testid="button-next">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayNotes = getNotesForDate(day);
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = viewMode === "month" ? isSameMonth(day, currentDate) : true;
            const isTodayDate = isToday(day);

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-24 p-2 border rounded-lg text-left transition-colors hover:bg-accent
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${isTodayDate ? 'border-primary border-2 bg-primary/5' : 'border-border'}
                `}
                data-testid={`day-cell-${format(day, 'yyyy-MM-dd')}`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                
                {/* Events */}
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 mb-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 truncate flex items-center gap-1"
                    title={event.title}
                  >
                    <CalendarDays className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}

                {/* Notes */}
                {dayNotes.map(note => (
                  <div
                    key={note.id}
                    className="text-xs p-1 mb-1 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 truncate flex items-center gap-1"
                    title={note.title}
                  >
                    {note.remindKliq && <Bell className="h-3 w-3 flex-shrink-0" />}
                    <span className="truncate">{note.title}</span>
                  </div>
                ))}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Button
              onClick={handleAddNote}
              className="w-full"
              data-testid="button-add-note"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>

            {/* Events for this day */}
            {selectedDate && getEventsForDate(selectedDate).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Events
                </h3>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className="p-3 border rounded-lg bg-blue-500/10 border-blue-500/30">
                      <div className="font-medium">{event.title}</div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {event.author.firstName} {event.author.lastName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes for this day */}
            {selectedDate && getNotesForDate(selectedDate).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <div className="space-y-2">
                  {getNotesForDate(selectedDate).map(note => (
                    <div key={note.id} className="p-3 border rounded-lg bg-purple-500/10 border-purple-500/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {note.title}
                            {note.remindKliq && (
                              <Bell className="h-3 w-3 text-primary" title="Kliq will be reminded" />
                            )}
                          </div>
                          {note.description && (
                            <p className="text-sm text-muted-foreground mt-1">{note.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {note.author.firstName} {note.author.lastName}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingNote(note);
                              setIsSheetOpen(false);
                              setIsAddDialogOpen(true);
                            }}
                            data-testid={`button-edit-${note.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            data-testid={`button-delete-${note.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && getNotesForDate(selectedDate).length === 0 && getEventsForDate(selectedDate).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No notes or events for this day
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Note Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Sarah's surgery" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any additional details..."
                        rows={3}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noteDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remindKliq"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Remind Kliq</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Send a notification to all kliq members on this day
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-remind-kliq"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingNote(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  data-testid="button-save"
                >
                  {editingNote ? 'Update' : 'Create'} Note
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
