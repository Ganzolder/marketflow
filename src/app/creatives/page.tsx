import { PageHeader } from "@/components/page-header";
import { CreativesForm } from "./creatives-form";

export default function CreativesPage() {
  return (
    <div>
      <PageHeader
        title="Генератор креативов"
        description="Используйте ИИ для создания убедительных рекламных текстов для ваших кампаний. Заполните детали ниже, чтобы начать."
      />
      <CreativesForm />
    </div>
  );
}
