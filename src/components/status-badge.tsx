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
    active: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
    'in-progress': "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
    planned: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50",
    completed: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50",
    paused: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50",
    archived: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50",
    rejected: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50",
  };

  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {statusTranslations[status]}
    </Badge>
  );
}
