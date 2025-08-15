
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit } from "lucide-react";
import { PrintEstimateButton } from "./print-estimate-button";
import { PrintOrderButton } from "./print-order-button";
import { PrintReportButton } from "./print-report-button";
import { AiAnalyzerButton } from "./ai-analyzer-button";
import type { Action, Campaign } from "@/lib/types";
import { EditActionButton } from "./edit-action-button";
import { EditActionResponsibilityButton } from "./edit-action-responsibility-button";

export function ActionPageHeaderActions({ action, campaign }: { action: Action; campaign: Campaign }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Действия</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
         <DropdownMenuItem asChild>
            <EditActionButton action={action} campaignId={campaign.id} asChild={true} />
         </DropdownMenuItem>
         <DropdownMenuItem asChild>
            <EditActionResponsibilityButton action={action} campaignId={campaign.id} asChild={true} />
         </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <PrintReportButton action={action} campaign={campaign} />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <PrintEstimateButton action={action} campaign={campaign} />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <PrintOrderButton action={action} campaign={campaign} />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <AiAnalyzerButton action={action} campaign={campaign} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
