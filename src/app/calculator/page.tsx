import { PageHeader } from "@/components/page-header";
import { CalculatorForm } from "./calculator-form";

export default function CalculatorPage() {
  return (
    <div>
      <PageHeader
        title="Калькулятор продвижения"
        description="Быстро рассчитывайте ключевые метрики для ваших маркетинговых кампаний."
      />
      <CalculatorForm />
    </div>
  )
}
