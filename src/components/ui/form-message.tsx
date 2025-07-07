import { cn } from "@/lib/utils";
import React from "react";

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    variant?: "error" | "success" | "warning";
}

const FormMessage = React.forwardRef<
    HTMLParagraphElement,
    FormMessageProps
>(({ className, variant = "error", children, ...props }, ref) => {
    const variantStyles = {
        error: "text-destructive dark:text-red-500",
        success: "text-green-600 dark:text-green-500",
        warning: "text-yellow-600 dark:text-yellow-500",
    };

    if (!children) {
        return null;
    }

    return (
        <p
            ref={ref}
            className={cn(
                "text-sm font-medium",
                variantStyles[variant],
                className
            )}
            {...props}
        >
            {children}
        </p>
    );
});

FormMessage.displayName = "FormMessage";

export { FormMessage }; 