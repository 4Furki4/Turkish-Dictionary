import { type ClassValue, clsx } from "clsx";
import DOMPurify from 'isomorphic-dompurify';
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const purifyObject = <T extends Record<string, any>>(obj: T): T => {
  const purifiedObject: Record<string, any> = {};

  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      purifiedObject[key] = DOMPurify.sanitize(obj[key]);
    } else if (Array.isArray(obj[key])) {
      purifiedObject[key] = obj[key].map((item: any) => 
        typeof item === 'object' && item !== null ? purifyObject(item) : item
      );
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      purifiedObject[key] = purifyObject(obj[key]); // Recursively purify nested objects
    } else {
      purifiedObject[key] = obj[key]; // Copy other types as-is
    }
  });

  return purifiedObject as T;
};