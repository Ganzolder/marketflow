
"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { usePathname } from "next/navigation";

export function PrintOrderButton() {
    const pathname = usePathname();

    const handlePrint = () => {
        window.open(`${pathname}/print`, '_blank');
    }

    return (
        <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Печать приказа
        </Button>
    )
}
