'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function PlanPrintButton() {
  return (
    <Button variant="outline" className="no-print" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Печать
    </Button>
  );
}
