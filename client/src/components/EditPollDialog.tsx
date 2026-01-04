import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: string[];
  expiresAt: string;
}

interface EditPollDialogProps {
  poll: Poll;
  trigger?: React.ReactNode;
}

export function EditPollDialog({ poll, trigger }: EditPollDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || "");
  const [options, setOptions] = useState<string[]>(poll.options);
  const [extendDuration, setExtendDuration] = useState(false);
  const [duration, setDuration] = useState("24");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTitle(poll.title);
      setDescription(poll.description || "");
      setOptions([...poll.options]);
      setExtendDuration(false);
    }
  }, [open, poll]);

  const updatePollMutation = useMutation({
    mutationFn: async (pollData: any) => {
      await apiRequest("PATCH", `/api/polls/${poll.id}`, pollData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/polls", "mine"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"], type: 'active' });
      toast({
        title: "Poll updated!",
        description: "Your poll has been updated",
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error updating poll:", error);
      toast({
        title: "Failed to update poll",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const validOptions = options.filter(opt => opt.trim().length > 0);
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a poll title",
        variant: "destructive",
      });
      return;
    }

    if (validOptions.length < 2) {
      toast({
        title: "Options required",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {
      title: title.trim(),
      description: description.trim() || null,
      options: validOptions,
    };

    if (extendDuration) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(duration));
      updateData.expiresAt = expiresAt.toISOString();
    }

    updatePollMutation.mutate(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-500 hover:bg-blue-50"
            data-testid={`button-edit-poll-${poll.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!bg-white !text-black border-gray-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="!text-black">Edit Poll</DialogTitle>
          <DialogDescription className="!text-gray-600">
            Update your poll question and options
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="!text-black">Title</Label>
            <Input
              id="title"
              placeholder="What's your question?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="!bg-white !text-black border-gray-300 placeholder:text-gray-500"
              data-testid="input-edit-poll-title"
            />
          </div>

          <div>
            <Label htmlFor="description" className="!text-black">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add more context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="!bg-white !text-black border-gray-300 placeholder:text-gray-500 resize-none"
              rows={2}
              data-testid="input-edit-poll-description"
            />
          </div>

          <div>
            <Label className="!text-black">Options</Label>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="!bg-white !text-black border-gray-300 placeholder:text-gray-500"
                    data-testid={`input-edit-poll-option-${index}`}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-remove-edit-option-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full !bg-white !text-black border-gray-300"
                  data-testid="button-add-edit-option"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Current expiry:</span>{" "}
              {new Date(poll.expiresAt) > new Date() 
                ? `Expires in ${formatDistanceToNow(new Date(poll.expiresAt))}`
                : "Expired"
              }
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={extendDuration}
                onCheckedChange={setExtendDuration}
                id="extend-duration"
              />
              <Label htmlFor="extend-duration" className="!text-black cursor-pointer">
                Extend duration
              </Label>
            </div>
            {extendDuration && (
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="!bg-white !text-black border-gray-300" data-testid="select-edit-poll-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!bg-white border-gray-300">
                  <SelectItem value="1" className="!text-black">1 hour from now</SelectItem>
                  <SelectItem value="6" className="!text-black">6 hours from now</SelectItem>
                  <SelectItem value="12" className="!text-black">12 hours from now</SelectItem>
                  <SelectItem value="24" className="!text-black">24 hours from now</SelectItem>
                  <SelectItem value="48" className="!text-black">2 days from now</SelectItem>
                  <SelectItem value="168" className="!text-black">1 week from now</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="!bg-white !text-black border-gray-300 hover:!bg-gray-100"
              data-testid="button-cancel-edit-poll"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updatePollMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-submit-edit-poll"
            >
              {updatePollMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
