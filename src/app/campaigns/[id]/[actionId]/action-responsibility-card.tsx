
"use client";

import type { Action } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building2, Briefcase, Bot, UserCheck } from 'lucide-react';
import { EditActionResponsibilityButton } from './edit-action-responsibility-button';

type ResponsibilityItemProps = {
    icon: React.ElementType;
    label: string;
    value?: string;
}

function ResponsibilityItem({ icon: Icon, label, value }: ResponsibilityItemProps) {
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value || '—'}</p>
            </div>
        </div>
    )
}

export function ActionResponsibilityCard({ action, campaignId }: { action: Action; campaignId: string; }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Ответственные лица</CardTitle>
                    <CardDescription>
                        Ключевые участники, задействованные в акции.
                    </CardDescription>
                </div>
                <EditActionResponsibilityButton action={action} campaignId={campaignId} />
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ResponsibilityItem icon={User} label="Ответственный" value={action.responsiblePerson} />
                    <ResponsibilityItem icon={Building2} label="Руководитель по маркетингу" value={action.marketingHead} />
                    <ResponsibilityItem icon={UserCheck} label="Руководитель отдела продаж" value={action.salesHead} />
                    <ResponsibilityItem icon={Briefcase} label="Руководитель по финансам" value={action.financeHead} />
                    <ResponsibilityItem icon={Bot} label="Руководитель по IT" value={action.itHead} />
                    <ResponsibilityItem icon={User} label="Куратор" value={action.curator} />
                </div>
            </CardContent>
        </Card>
    )
}
