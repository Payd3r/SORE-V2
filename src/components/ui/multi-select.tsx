"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

const multiSelectVariants = cva(
    "m-1",
    {
        variants: {
            variant: {
                default:
                    "border-foreground/10 text-foreground bg-card-foreground/10 hover:bg-card-foreground/20",
                secondary:
                    "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface MultiSelectProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiSelectVariants> {
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
    onValueChange: (value: string[]) => void;
    defaultValue?: string[];
    placeholder?: string;
    animation?: number;
    maxCount?: number;
    asChild?: boolean;
    className?: string;
}

export const MultiSelect = React.forwardRef<
    HTMLInputElement,
    MultiSelectProps
>(
    (
        {
            options,
            onValueChange,
            variant,
            defaultValue = [],
            placeholder = "Select options",
            animation,
            maxCount,
            asChild,
            className,
            ...props
        },
        ref
    ) => {
        const [selectedValues, setSelectedValues] =
            React.useState<string[]>(defaultValue);
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
        const [isAnimating, setIsAnimating] = React.useState(false);

        React.useEffect(() => {
            if (JSON.stringify(selectedValues) !== JSON.stringify(defaultValue)) {
                onValueChange(selectedValues);
            }
        }, [selectedValues, onValueChange, defaultValue]);

        const handleInputKeyDown = (
            event: React.KeyboardEvent<HTMLInputElement>
        ) => {
            if (event.key === "Enter") {
                setIsPopoverOpen(true);
            } else if (event.key === "Backspace" && !event.currentTarget.value) {
                const newSelectedValues = [...selectedValues];
                newSelectedValues.pop();
                setSelectedValues(newSelectedValues);
            }
        };

        const toggleOption = (value: string) => {
            const newSelectedValues = selectedValues.includes(value)
                ? selectedValues.filter((v) => v !== value)
                : [...selectedValues, value];
            setSelectedValues(newSelectedValues);
        };

        return (
            <Command
                onKeyDown={handleInputKeyDown}
                className="overflow-visible bg-transparent"
            >
                <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <div className="flex flex-wrap gap-1">
                        {selectedValues.map((value) => {
                            const option = options.find((o) => o.value === value);
                            const Icon = option?.icon;
                            return (
                                <Badge
                                    key={value}
                                    variant={variant}
                                    className={cn("data-[state=active]:hover:bg-card-foreground/30", isAnimating && "animate-bounce")}
                                    style={{
                                        animationDuration: `${animation}s`,
                                    }}
                                >
                                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                                    {option?.label}
                                    <X
                                        className="ml-2 h-4 w-4 cursor-pointer"
                                        onClick={() => toggleOption(value)}
                                    />
                                </Badge>
                            );
                        })}
                        <CommandPrimitive.Input
                            ref={ref}
                            placeholder={placeholder}
                            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                            onFocus={() => setIsPopoverOpen(true)}
                            onBlur={() => setIsPopoverOpen(false)}
                        />
                    </div>
                </div>
                <div className="relative mt-2">
                    {isPopoverOpen && (
                        <CommandList className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => toggleOption(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <X className={cn("h-4 w-4")} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandList>
                    )}
                </div>
            </Command>
        );
    }
);

MultiSelect.displayName = "MultiSelect"; 