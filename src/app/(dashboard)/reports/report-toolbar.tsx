"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EXPORTS = [
  { key: "orders", label: "Orders" },
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "expenses", label: "Expenses" },
  { key: "inventory", label: "Inventory movements" },
  { key: "sales", label: "Daily sales summary" },
];

export function ReportToolbar({ range }: { range: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Select value={range} onValueChange={(value) => router.push(`/reports?range=${value}`)}>
        <SelectTrigger className="w-[150px]" aria-label="Date range" data-tour="reports-range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="365">Last 12 months</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" data-tour="reports-export">
            <Download className="size-4" />
            Export CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Download as CSV</DropdownMenuLabel>
          {EXPORTS.map((item) => (
            <DropdownMenuItem key={item.key} asChild>
              <a href={`/api/reports/export?type=${item.key}&range=${range}`} download>
                {item.label}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
