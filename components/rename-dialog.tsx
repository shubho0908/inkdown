"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  type: "file" | "folder";
  onRename: (newName: string) => void;
}

interface RenameDialogFormProps {
  currentName: string;
  type: "file" | "folder";
  onRename: (newName: string) => void;
  onOpenChange: (open: boolean) => void;
}

function RenameDialogForm({ currentName, type, onRename, onOpenChange }: RenameDialogFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = (inputRef.current?.value ?? "").trim();
    if (trimmed && trimmed !== currentName) {
      onRename(trimmed);
    }
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rename {type}</DialogTitle>
        <DialogDescription>Enter a new name for this {type}.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              ref={inputRef}
              defaultValue={currentName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Rename</Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  type,
  onRename,
}: RenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {open ? (
          <RenameDialogForm
            key={currentName}
            currentName={currentName}
            type={type}
            onRename={onRename}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
