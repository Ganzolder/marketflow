import { PageHeader } from "@/components/page-header";
import { CalculatorForm } from "./calculator-form";

export default function CalculatorPage() {
  return (
    <div>
      <PageHeader
        title="Promotions Calculator"
        description="Quickly calculate key metrics for your marketing campaigns."
      />
      <CalculatorForm />
    </div>
  )
}
