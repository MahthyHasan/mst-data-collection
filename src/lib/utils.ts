import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDiff(oldObj: any, newObj: any) {
  const oldDiff: Record<string, any> = {};
  const newDiff: Record<string, any> = {};
  const changedFields: string[] = [];

  const ignoreKeys = ['_id', '__v', 'createdAt', 'updatedAt', 'recordedBy', 'registeredBy', 'id'];

  // Convert to plain objects if they are mongoose documents
  const plainOld = oldObj && typeof oldObj.toObject === 'function' ? oldObj.toObject() : oldObj || {};
  const plainNew = newObj && typeof newObj.toObject === 'function' ? newObj.toObject() : newObj || {};

  const allKeys = Array.from(new Set([...Object.keys(plainOld), ...Object.keys(plainNew)]));

  for (const key of allKeys) {
    if (ignoreKeys.includes(key)) continue;

    const val1 = plainOld[key];
    const val2 = plainNew[key];

    // If both are null/undefined/empty string, consider them identical
    if (
      (val1 === undefined || val1 === null || val1 === '') &&
      (val2 === undefined || val2 === null || val2 === '')
    ) {
      continue;
    }

    // Handle date comparison
    const time1 = val1 instanceof Date ? val1.getTime() : (typeof val1 === 'string' && !isNaN(Date.parse(val1)) ? new Date(val1).getTime() : null);
    const time2 = val2 instanceof Date ? val2.getTime() : (typeof val2 === 'string' && !isNaN(Date.parse(val2)) ? new Date(val2).getTime() : null);
    if (time1 !== null && time2 !== null && time1 === time2) {
      continue;
    }

    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      changedFields.push(key);
      oldDiff[key] = val1;
      newDiff[key] = val2;
    }
  }

  return { oldDiff, newDiff, changedFields };
}

