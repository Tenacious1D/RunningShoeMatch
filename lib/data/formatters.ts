import type { ShoeSpecifications } from "@/lib/data/types";

const specificationUnits: Record<string, string> = {
  heel_to_toe_drop_mm: "mm",
  general_stack_height_mm: "mm",
  heel_stack_height_mm: "mm",
  forefoot_stack_height_mm: "mm",
  stack_height_mm: "mm",
  weight_g: "g",
  weight_oz: "oz",
};

const specificationLabels: Record<string, string> = {
  heel_to_toe_drop_mm: "Heel-to-toe drop",
  general_stack_height_mm: "Manufacturer-listed general stack height",
  heel_stack_height_mm: "Heel stack height",
  forefoot_stack_height_mm: "Forefoot stack height",
  manufacturer_support_label: "Manufacturer support label",
  support_category: "Running Shoe Match support category",
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
  const specifications: Array<{ key: string; label: string; value: string }> = [];

  if (
    typeof specs.weight_value === "number" &&
    (specs.weight_unit === "g" || specs.weight_unit === "oz")
  ) {
    specifications.push({
      key: "weight",
      label: "Manufacturer-listed weight",
      value: new Intl.NumberFormat("en-US").format(specs.weight_value) + " " + specs.weight_unit,
    });
  }

  specifications.push(...Object.entries(specs).flatMap(([key, value]) => {
    if (key === "weight_value" || key === "weight_unit") return [];

    const formattedValue = formatSpecificationValue(key, value);

    return formattedValue
      ? [{ key, label: specificationLabels[key] ?? formatDataLabel(key), value: formattedValue }]
      : [];
  }));

  return specifications;
}
