
"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { deleteAction, type DeleteFormState } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Удаление...
        </>
      ) : (
        "Удалить"
      )}
    </Button>
  );
}

export function DeleteActionButton({
  actionId,
  campaignId,
}: {
  actionId: string;
  campaignId: string;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const initialState: DeleteFormState = { message: "", error: false };
  const [state, dispatch] = useActionState(deleteAction, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: state.message,
        });
      } else {
        toast({
          title: "Успех",
          description: state.message,
        });
        setOpen(false);
      }
    }
  }, [state, toast]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    // Reset state when dialog is closed
    if (!isOpen) {
        // A slight delay to allow closing animation before state reset
        setTimeout(() => {
            // This is a bit of a hack to reset the action state.
            // A more robust solution would involve a dedicated reset action type in the reducer.
            if (state.message) {
              // This condition prevents resetting on initial mount
               dispatch(new FormData()); 
            }
        }, 150);
    }
    setOpen(isOpen);
  };


  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={handleTriggerClick}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Удалить акцию</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
          <AlertDialogDescription>
            Это действие нельзя отменить. Акция и все связанные с ней данные
            будут безвозвратно удалены.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={dispatch}>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="actionId" value={actionId} />
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <SubmitButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
