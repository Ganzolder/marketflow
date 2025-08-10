import { PageHeader } from "@/components/page-header";
import { CreativesForm } from "./creatives-form";

export default function CreativesPage() {
  return (
    <div>
      <PageHeader
        title="Creatives Generator"
        description="Leverage AI to generate compelling ad copy for your campaigns. Fill in the details below to get started."
      />
      <CreativesForm />
    </div>
  );
}
