
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxProps = {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundText?: string;
}

export function Combobox({ 
    options, 
    value, 
    onChange,
    placeholder = "Select an option",
    searchPlaceholder = "Search...",
    notFoundText = "No option found."
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")

  // Sync inputValue with external value prop
  React.useEffect(() => {
    setInputValue(value)
  }, [value])
  
  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue
    onChange(newValue) // Update form state
    setInputValue(newValue) // Sync internal input state
    setOpen(false)
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    // When popover closes, ensure the form state is updated with the current input value
    if (!isOpen) {
        onChange(inputValue);
    }
    setOpen(isOpen);
  }
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue) {
        event.preventDefault();
        onChange(inputValue); // Ensure the latest input is saved
        setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value
            ? options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label ?? value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup>
              {options
                .filter(option => option.label.toLowerCase().includes(inputValue.toLowerCase()))
                .map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value && value.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
