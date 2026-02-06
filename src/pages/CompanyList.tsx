
import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, User, Mail, Trash2, FileText, ChevronRight, Pencil, History, Calendar, FileClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useCompanies, type Company } from '@/hooks/useCompanies'
import { useSavedReports, type SavedReport } from '@/hooks/useSavedReports'

export default function CompanyList() {
    const navigate = useNavigate()
    const { companies, addCompany, updateCompany, deleteCompany } = useCompanies()
    const { savedReports } = useSavedReports()

    // Add Dialog State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newCompany, setNewCompany] = useState<Omit<Company, 'id'>>({
        name: '',
        personInCharge: '',
        email: '',
        url: ''
    })

    // Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)

    // History Sheet State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [selectedCompanyForHistory, setSelectedCompanyForHistory] = useState<Company | null>(null)

    // Group companies by name first letter or just list them? 
    // Let's just list them in a grid for now.

    const handleAddCompany = () => {
        if (!newCompany.name || !newCompany.personInCharge || !newCompany.email) {
            return
        }
        addCompany(newCompany)
        setNewCompany({ name: '', personInCharge: '', email: '', url: '' })
        setIsAddDialogOpen(false)
    }

    const handleEditCompany = (company: Company) => {
        setEditingCompany(company)
        setIsEditDialogOpen(true)
    }

    const handleUpdateCompany = () => {
        if (!editingCompany || !editingCompany.name || !editingCompany.personInCharge || !editingCompany.email) {
            toast.error('すべての項目を入力してください')
            return
        }
        updateCompany(editingCompany.id, {
            name: editingCompany.name,
            personInCharge: editingCompany.personInCharge,
            email: editingCompany.email,
            url: editingCompany.url
        })
        setIsEditDialogOpen(false)
        setEditingCompany(null)
        toast.success('クライアント情報を更新しました')
    }

    const handleViewHistory = (company: Company) => {
        setSelectedCompanyForHistory(company)
        setIsHistoryOpen(true)
    }

    const getCompanyReports = (companyName: string) => {
        return savedReports.filter(report => report.data.clientName === companyName)
    }

    const loadReport = (report: SavedReport) => {
        navigate('/report', {
            state: {
                company: companies.find(c => c.name === report.data.clientName),
                reportData: report.data
            }
        })
    }

    const handleCreateReport = (company: Company) => {
        navigate('/report', { state: { company } })
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">クライアント管理</h1>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                新規登録
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>新規クライアント登録</DialogTitle>
                                <DialogDescription>
                                    新しいクライアントの基本情報を登録します。
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">会社名</Label>
                                    <Input
                                        id="name"
                                        placeholder="株式会社○○"
                                        value={newCompany.name}
                                        onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="person">担当者名</Label>
                                    <Input
                                        id="person"
                                        placeholder="山田 太郎"
                                        value={newCompany.personInCharge}
                                        onChange={(e) => setNewCompany({ ...newCompany, personInCharge: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">メールアドレス</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="client@example.com"
                                        value={newCompany.email}
                                        onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="url">サイトURL (任意)</Label>
                                    <Input
                                        id="url"
                                        placeholder="https://example.com"
                                        value={newCompany.url}
                                        onChange={(e) => setNewCompany({ ...newCompany, url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddCompany}>登録する</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">クライアントが登録されていません</h3>
                            <p className="text-slate-500 mb-6">
                                右上の「新規登録」ボタンから<br />クライアント情報を追加してください。
                            </p>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                                クライアントを登録
                            </Button>
                        </div>
                    ) : (
                        companies.map((company) => (
                            <Card key={company.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-start justify-between gap-2">
                                        <span className="truncate" title={company.name}>{company.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-500 -mt-1 -mr-2"
                                            onClick={() => deleteCompany(company.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                    <div className="flex gap-2 mb-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => handleEditCompany(company)}
                                        >
                                            <Pencil className="w-3 h-3" />
                                            編集
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => handleViewHistory(company)}
                                        >
                                            <History className="w-3 h-3" />
                                            履歴 ({getCompanyReports(company.name).length})
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <User className="w-3.5 h-3.5" />
                                            {company.personInCharge}
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{company.email}</span>
                                    </div>
                                    {company.url && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                            <a href={company.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-blue-600">
                                                {company.url}
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-2">
                                    <Button
                                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleCreateReport(company)}
                                    >
                                        <FileText className="w-4 h-4" />
                                        レポート作成
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>

            </main>

            {/* Edit Company Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>クライアント情報の編集</DialogTitle>
                        <DialogDescription>
                            クライアント情報を修正します。
                        </DialogDescription>
                    </DialogHeader>
                    {editingCompany && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">会社名</Label>
                                <Input
                                    id="edit-name"
                                    value={editingCompany.name}
                                    onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-person">担当者名</Label>
                                <Input
                                    id="edit-person"
                                    value={editingCompany.personInCharge}
                                    onChange={(e) => setEditingCompany({ ...editingCompany, personInCharge: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">メールアドレス</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editingCompany.email}
                                    onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-url">サイトURL (任意)</Label>
                                <Input
                                    id="edit-url"
                                    value={editingCompany.url || ''}
                                    onChange={(e) => setEditingCompany({ ...editingCompany, url: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleUpdateCompany}>更新する</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Sheet */}
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetContent className="sm:max-w-md w-full">
                    <SheetHeader>
                        <SheetTitle>保存されたレポート</SheetTitle>
                        <SheetDescription>
                            {selectedCompanyForHistory?.name} のレポート履歴 (全 {selectedCompanyForHistory ? getCompanyReports(selectedCompanyForHistory.name).length : 0} 件)
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-8 space-y-4 overflow-y-auto max-h-[calc(100vh-150px)] pr-2">
                        {selectedCompanyForHistory && getCompanyReports(selectedCompanyForHistory.name).length === 0 ? (
                            <div className="text-center text-slate-500 py-8">
                                <FileClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>保存されたレポートはありません</p>
                            </div>
                        ) : (
                            selectedCompanyForHistory && getCompanyReports(selectedCompanyForHistory.name).map((report) => (
                                <div
                                    key={report.id}
                                    className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer shadow-sm"
                                    onClick={() => loadReport(report)}
                                >
                                    <h4 className="font-semibold text-slate-900 truncate text-base mb-1">{report.name}</h4>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(report.date), 'yyyy/MM/dd HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div >
    )
}
