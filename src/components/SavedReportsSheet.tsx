
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { History, FileClock, Trash2, Calendar, Filter } from 'lucide-react'
import type { SavedReport } from '@/hooks/useSavedReports'

interface SavedReportsSheetProps {
    savedReports: SavedReport[]
    onLoad: (report: SavedReport) => void
    onDelete: (id: string, e: React.MouseEvent) => void
}

export function SavedReportsSheet({ savedReports, onLoad, onDelete }: SavedReportsSheetProps) {
    const [filterDate, setFilterDate] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const filteredReports = useMemo(() => {
        if (!filterDate) return savedReports

        return savedReports.filter(report => {
            // Assuming existing date format might be ISO string
            const reportDate = new Date(report.date)
            const filter = new Date(filterDate)

            // Compare year and month
            return (
                reportDate.getFullYear() === filter.getFullYear() &&
                reportDate.getMonth() === filter.getMonth()
            )
        })
    }, [savedReports, filterDate])

    const handleLoad = (report: SavedReport) => {
        onLoad(report)
        setIsOpen(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <History className="w-4 h-4" />
                    保存されたレポート
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-none w-[50vw]">
                <SheetHeader>
                    <SheetTitle>保存されたレポート</SheetTitle>
                    <SheetDescription>
                        過去に保存したレポートを読み込むことができます。
                    </SheetDescription>
                </SheetHeader>

                {/* Filter Section */}
                <div className="mt-6 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <h4 className="text-sm font-medium text-slate-700">絞り込み</h4>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-date" className="text-xs text-slate-500">
                            年月で検索
                        </Label>
                        <Input
                            id="filter-date"
                            type="month"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
                    {filteredReports.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                            <FileClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>
                                {filterDate
                                    ? '条件に一致するレポートはありません'
                                    : '保存されたレポートはありません'}
                            </p>
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group relative shadow-sm"
                                onClick={() => handleLoad(report)}
                            >
                                <div className="pr-8">
                                    <h4 className="font-semibold text-slate-900 truncate text-base mb-1">{report.name}</h4>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(report.date), 'yyyy/MM/dd HH:mm')}
                                        </span>
                                        <span>
                                            {report.data.clientName || 'クライアント名なし'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-white"
                                    onClick={(e) => onDelete(report.id, e)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
