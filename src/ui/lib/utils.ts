import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging class names with Tailwind CSS.
 * Combines clsx for conditional classes and tailwind-merge to
 * intelligently merge Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Creates a variant map for consistent component styling.
 * Based on shadcn/ui patterns.
 */
export function createVariants<T extends Record<string, string>>(
	variants: T,
): T {
	return variants;
}
