import type { ShoeSpecifications } from "@/lib/data/types";

const specificationUnits: Record<string, string> = {
  heel_to_toe_drop_mm: "mm",
  stack_height_mm: "mm",
  weight_g: "g",
  weight_oz: "oz",
};

export function formatCurrency(
  value: number,
  currency: string,
  options: { maximumFractionDigits?: number } = {},
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatDataLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatSpecificationValue(key: string, value: unknown) {
  if (typeof value === "number") {
    const unit = specificationUnits[key];
    return unit ? `${value} ${unit}` : new Intl.NumberFormat("en-US").format(value);
  }

  if (typeof value === "string") {
    return formatDataLabel(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return null;
}

export function getDisplaySpecifications(specs: ShoeSpecifications) {
  return Object.entries(specs).flatMap(([key, value]) => {
    const formattedValue = formatSpecificationValue(key, value);

    return formattedValue
      ? [{ key, label: formatDataLabel(key), value: formattedValue }]
      : [];
  });
}

