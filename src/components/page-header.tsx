import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string | React.ReactNode
  description?: string | React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8", className)}>
      <div className="space-y-1.5 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">{title}</h1>
        {description && <div className="text-muted-foreground">{description}</div>}
      </div>
      {children && <div className="flex shrink-0 gap-2">{children}</div>}
    </div>
  )
}
