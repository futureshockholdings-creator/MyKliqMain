import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreatePollDialogProps {
  trigger?: React.ReactNode;
}

export function CreatePollDialog({ trigger }: CreatePollDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("24"); // hours
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPollMutation = useMutation({
    mutationFn: async (pollData: any) => {
      await apiRequest("POST", "/api/polls", pollData);
    },
    onSuccess: async () => {
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/polls');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/polls"] });
      await queryClient.refetchQueries({ queryKey: ["/api/polls", "mine"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      toast({
        title: "Poll created!",
        description: "Your poll has been shared with your kliq on the Headlines",
      });
      handleClose();
    },
    onError: (error) => {
      console.error("Error creating poll:", error);
      toast({
        title: "Failed to create poll",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setTitle("");
    setDescription("");
    setOptions(["", ""]);
    setDuration("24");
  };

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

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(duration));

    createPollMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      options: validOptions,
      expiresAt: expiresAt.toISOString(),
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-create-poll"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!bg-white !text-black border-gray-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="!text-black">Create a New Poll</DialogTitle>
          <DialogDescription className="!text-gray-600">
            Ask your friends a question with multiple choice options
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
              data-testid="input-poll-title"
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
              data-testid="input-poll-description"
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
                    data-testid={`input-poll-option-${index}`}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-remove-option-${index}`}
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
                  data-testid="button-add-option"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="duration" className="!text-black">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="!bg-white !text-black border-gray-300" data-testid="select-poll-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!bg-white border-gray-300">
                <SelectItem value="1" className="!text-black">1 hour</SelectItem>
                <SelectItem value="6" className="!text-black">6 hours</SelectItem>
                <SelectItem value="12" className="!text-black">12 hours</SelectItem>
                <SelectItem value="24" className="!text-black">24 hours</SelectItem>
                <SelectItem value="48" className="!text-black">2 days</SelectItem>
                <SelectItem value="168" className="!text-black">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="!bg-white !text-black border-gray-300 hover:!bg-gray-100"
              data-testid="button-cancel-poll"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPollMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-submit-poll"
            >
              {createPollMutation.isPending ? "Creating..." : "Create Poll"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}