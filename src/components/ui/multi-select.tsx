
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "./checkbox"
import { Label } from "./label"
import { ScrollArea } from "./scroll-area"

type MultiSelectProps = {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    className?: string;
    placeholder?: string;
}

export function MultiSelect({ options, selected, onChange, className, placeholder = "Select options..." }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
            <span className="truncate">
                {selected.length > 0
                    ? selected
                        .map(val => options.find(opt => opt.value === val)?.label)
                        .filter(Boolean)
                        .join(", ")
                    : placeholder}
            </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <ScrollArea className="max-h-60">
            <div className="flex flex-col space-y-1 p-1">
                {options.map((option) => (
                    <Label 
                        key={option.value}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer"
                    >
                        <Checkbox
                            checked={selected.includes(option.value)}
                            onCheckedChange={(checked) => {
                                const newSelected = checked
                                ? [...selected, option.value]
                                : selected.filter(v => v !== option.value);
                                onChange(newSelected);
                            }}
                        />
                        <span>{option.label}</span>
                    </Label>
            ))}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
