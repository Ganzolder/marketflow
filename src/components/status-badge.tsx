import { Badge } from "@/components/ui/badge"
import type { CampaignStatus, ActionStatus } from "@/lib/types"

type StatusBadgeProps = {
  status: CampaignStatus | ActionStatus;
};

const statusTranslations: Record<CampaignStatus | ActionStatus, string> = {
  active: "Активна",
  'in-progress': "В процессе",
  planned: "Запланирована",
  completed: "Завершена",
  paused: "Приостановлена",
  archived: "В архиве",
  rejected: "Отклонена",
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<CampaignStatus | ActionStatus, string> = {
    active: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/50",
    'in-progress': "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700/50",
    planned: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/50",
    completed: "bg-stone-100 text-stone-600 border-stone-200/80 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700/50",
    paused: "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-800/50",
    archived: "bg-neutral-100 text-neutral-500 border-neutral-200/80 dark:bg-neutral-800/30 dark:text-neutral-400 dark:border-neutral-700/50",
    rejected: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800/50",
  };

  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {statusTranslations[status]}
    </Badge>
  );
}
