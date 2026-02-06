import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../App.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSavedReports } from '@/hooks/useSavedReports'
import type { ReportData, MaintenanceTask, SavedReport } from '@/hooks/useSavedReports'
import { SavedReportsSheet } from '@/components/SavedReportsSheet'

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  FileText,
  Calendar,
  Send,
  Download,
  CheckCircle2,
  Globe,
  Mail,
  BarChart3,
  Eye,
  Image as ImageIcon,
  Upload,
  X,
  Puzzle,
  HardDrive,
  Save
} from 'lucide-react'


import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'

const defaultTasks: MaintenanceTask[] = [
  { id: 'monthly_patrol', label: '月一回サイト巡回', checked: false },
  { id: 'wordpress_update', label: 'ワードプレス更新', checked: false },
  { id: 'plugin_update', label: 'プラグイン更新', checked: false },
  { id: 'backup', label: 'サイトのバックアップ', checked: false },
  { id: 'report', label: '報告', checked: false },
  { id: 'error_fix', label: 'エラー解消', checked: false },
  { id: 'analysis', label: '解析', checked: false },
  { id: 'text_change', label: 'テキスト変更', checked: false },
  { id: 'image_change', label: 'イメージ変更', checked: false },
  { id: 'database_update', label: 'データベースアップデート', checked: false },
  { id: 'server_maintenance', label: 'サーバメンテナンス', checked: false },
  { id: 'spam_check', label: 'スパムメールcheck', checked: false },
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function ReportGenerator() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialCompany = location.state?.company

  const pdfContentRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Use custom hook for saved reports
  const { savedReports, saveReport, deleteReport: deleteReportFromStorage } = useSavedReports()

  const [newReportName, setNewReportName] = useState('')
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)

  const saveCurrentReport = async () => {
    if (!newReportName.trim()) {
      toast.error('レポート名を入力してください')
      return
    }

    try {
      await saveReport(newReportName, reportData)
      setNewReportName('')
      setIsSaveDialogOpen(false)
      // toast success handles in hook
    } catch (error) {
      toast.error('保存に失敗しました')
      console.error(error)
    }
  }

  const loadReport = (report: SavedReport) => {
    setReportData(report.data)
    toast.success(`レポート「${report.name}」を読み込みました`)
  }

  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  const confirmDelete = () => {
    if (reportToDelete) {
      deleteReportFromStorage(reportToDelete)
      setReportToDelete(null)
    }
  }

  const deleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setReportToDelete(id)
  }

  const [reportData, setReportData] = useState<ReportData>({
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    periodStart: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    periodEnd: format(new Date(), 'yyyy-MM-dd'),
    clientName: initialCompany?.name || '',
    clientEmail: initialCompany?.email || '',
    siteUrl: initialCompany?.url || '',
    tasks: defaultTasks,
    comment: initialCompany?.personInCharge ? `担当者: ${initialCompany.personInCharge} 様` : '',
    analyticsSummary: '',
    claritySummary: '',
    pluginUpdateList: '',
    backupFileName: '',
    analyticsImage: null,
    clarityImage: null
  })

  useEffect(() => {
    if (initialCompany) {
      toast.info(`${initialCompany.name} のレポートを作成します`)
      const dateStr = format(new Date(), 'yyyy年MM月')
      setNewReportName(`${dateStr} ${initialCompany.name}様`)
    }
  }, [initialCompany])

  const handleTaskChange = (taskId: string, checked: boolean) => {
    setReportData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, checked } : task
      )
    }))
  }

  const handleInputChange = (field: keyof ReportData, value: string) => {
    setReportData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (field: 'analyticsImage' | 'clarityImage', file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setReportData(prev => ({
          ...prev,
          [field]: {
            name: file.name,
            dataUrl: dataUrl,
            size: file.size
          }
        }))
        toast.success(`${file.name} がアップロードされました`)
      }
      reader.readAsDataURL(file)
    } else if (file) {
      toast.error('画像ファイルのみアップロード可能です')
    }
  }

  const removeImage = (field: 'analyticsImage' | 'clarityImage') => {
    setReportData(prev => ({ ...prev, [field]: null }))
    toast.info('画像が削除されました')
  }

  // Convert logo to data URL for reliable rendering
  const getLogoDataUrl = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } else {
          reject(new Error('Failed to get canvas context'))
        }
      }
      img.onerror = () => reject(new Error('Failed to load logo'))
      img.src = '/logo.png'
    })
  }

  const generatePDF = async () => {
    if (!pdfContentRef.current) return

    setIsGenerating(true)
    try {
      // Create a clone of the report element
      const originalElement = pdfContentRef.current
      const element = originalElement.cloneNode(true) as HTMLElement

      // Style the clone to ensure it renders correctly off-screen
      // We append it to body to ensure it's always "visible" to html2canvas regardless of the preview state
      element.style.position = 'fixed'
      element.style.left = '-10000px'
      element.style.top = '0'
      element.style.zIndex = '-1000'
      // Ensure the width matches the A4 print width
      element.style.width = '190mm'

      document.body.appendChild(element)

      try {
        // Pre-load logo as data URL to avoid CORS issues
        let logoDataUrl: string
        try {
          logoDataUrl = await getLogoDataUrl()
        } catch (e) {
          console.warn('Could not load logo, continuing without it', e)
          logoDataUrl = ''
        }

        // Replace logo src with data URL temporarily on the CLONE
        const logoImgs = element.querySelectorAll('img[src="/logo.png"]')
        logoImgs.forEach((img) => {
          if (logoDataUrl) {
            (img as HTMLImageElement).src = logoDataUrl
          }
        })

        // Wait for all images in the CLONE to load
        const images = element.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                  resolve()
                } else {
                  img.onload = () => resolve()
                  img.onerror = () => {
                    console.error('Image failed to load:', img.src)
                    resolve()
                  }
                  // Timeout after 3 seconds
                  setTimeout(() => {
                    resolve()
                  }, 3000)
                }
              })
          )
        )

        // Small delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 500))

        // --- PDF ALIGNMENT FIX ---
        // html2canvas often renders text slightly higher than browsers in flex containers.
        // We'll add a small top padding to text inside list items in the CLONE only.
        const listItems = element.querySelectorAll('.flex.items-center')
        listItems.forEach((item) => {
          const span = item.querySelector('span')
          if (span) {
            span.style.paddingTop = '2px'
          }
        })
        // -------------------------

        // --- INTELLIGENT PAGE BREAK LOGIC ---
        // Calculate px per mm based on the container width (190mm)
        const pxPerMm = element.offsetWidth / 190
        // A4 height (297mm) - margins (20mm total) = 277mm usable height per page
        const pageHeightPx = 277 * pxPerMm

        // Find all elements that should not be broken (marked with 'pdf-keep' class)
        // We sort them by DOM position to process them somewhat sequentially, 
        // though strictly valid DOM order isn't guaranteed by querySelectorAll in all browsers, it's usually fine.
        // We use ALL descendants with pdf-keep.
        const keepElements = Array.from(element.querySelectorAll('.pdf-keep')) as HTMLElement[]

        for (const child of keepElements) {
          // Force layout update to get correct positions after previous shifts
          const elementRect = element.getBoundingClientRect()
          const childRect = child.getBoundingClientRect()

          const relativeTop = childRect.top - elementRect.top
          const relativeBottom = relativeTop + childRect.height

          const startPage = Math.floor(relativeTop / pageHeightPx)
          const endPage = Math.floor(relativeBottom / pageHeightPx)

          // If the element crosses a page boundary
          if (startPage !== endPage) {
            const nextPageStart = (startPage + 1) * pageHeightPx
            const pushDownAmount = nextPageStart - relativeTop

            // Add spacing to push the element to the start of the next page
            // We adding a border-top instead of margin to avoid margin collapse issues
            child.style.marginTop = `${pushDownAmount + 20}px`
          }
        }
        // ------------------------------------

        // Capture the clone with html2canvas
        const canvas = await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        })

        const imgData = canvas.toDataURL('image/png')

        const pdf = new jsPDF('p', 'mm', 'a4')

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const margin = 10
        const contentWidth = pdfWidth - margin * 2

        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = contentWidth / imgWidth
        const scaledHeight = imgHeight * ratio

        // Calculate how many pages needed
        let heightLeft = scaledHeight
        let position = 0
        let pageCount = 0

        try {
          // Add first page
          pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, scaledHeight)
          heightLeft -= (pdfHeight - margin * 2)
          pageCount++

          // Add additional pages if needed
          while (heightLeft > 0) {
            position = heightLeft - scaledHeight + margin
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, scaledHeight)
            heightLeft -= (pdfHeight - margin * 2)
            pageCount++
          }
        } catch (addError) {
          console.error('Error in pdf.addImage:', addError)
          throw new Error(`PDF Image Add Error: ${addError instanceof Error ? addError.message : String(addError)}`)
        }

        // Add footer with page numbers to all pages
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i)
          pdf.setFontSize(8)
          pdf.setTextColor(150, 150, 150)
          pdf.text(`${i} / ${pageCount}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' })
        }

        // Use a safe, ASCII-only filename
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
        const safeFilename = `report_${timestamp}.pdf`

        // Check if the output is valid
        if (pdf.getNumberOfPages() === 0) {
          throw new Error('PDF has 0 pages')
        }

        // Generate Blob first
        const blob = pdf.output('blob')

        // Convert Blob to Base64 using FileReader (most reliable method)
        const reader = new FileReader()
        reader.readAsDataURL(blob)

        reader.onloadend = () => {
          const base64data = reader.result as string

          // Create hidden form
          const form = document.createElement('form')
          form.method = 'POST'
          form.enctype = 'multipart/form-data'
          form.action = 'http://localhost:3001/api/download-pdf'
          form.target = '_blank'

          const inputBase64 = document.createElement('input')
          inputBase64.type = 'hidden'
          inputBase64.name = 'pdfBase64'
          inputBase64.value = base64data
          form.appendChild(inputBase64)

          const inputFileName = document.createElement('input')
          inputFileName.type = 'hidden'
          inputFileName.name = 'fileName'
          inputFileName.value = safeFilename
          form.appendChild(inputFileName)

          document.body.appendChild(form)
          form.submit()
          document.body.removeChild(form)

          toast.success(`PDF出力完了: ${safeFilename}`)
        }

      } finally {
        // ALWAYS remove the clone, even if error occurs
        document.body.removeChild(element)
      }

    } catch (error) {
      console.error('PDF Generation Error:', error)
      toast.error(`PDF生成中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }


  const sendEmail = async () => {
    if (!reportData.clientEmail) {
      toast.error('クライアントのメールアドレスを入力してください')
      return
    }

    if (!pdfContentRef.current) {
      toast.error('PDFコンテンツが見つかりません')
      return
    }

    setIsGenerating(true)
    try {
      // Generate PDF first (same logic as generatePDF but return base64 instead of downloading)
      const originalElement = pdfContentRef.current
      const element = originalElement.cloneNode(true) as HTMLElement

      element.style.position = 'fixed'
      element.style.left = '-10000px'
      element.style.top = '0'
      element.style.zIndex = '-1000'
      element.style.width = '190mm'

      document.body.appendChild(element)

      try {
        // Pre-load logo
        let logoDataUrl: string
        try {
          logoDataUrl = await getLogoDataUrl()
        } catch (e) {
          console.warn('Could not load logo', e)
          logoDataUrl = ''
        }

        const logoImgs = element.querySelectorAll('img[src="/logo.png"]')
        logoImgs.forEach((img) => {
          if (logoDataUrl) {
            (img as HTMLImageElement).src = logoDataUrl
          }
        })

        // Wait for images
        const images = element.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                  resolve()
                } else {
                  img.onload = () => resolve()
                  img.onerror = () => resolve()
                  setTimeout(() => resolve(), 3000)
                }
              })
          )
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        // PDF alignment fix
        const listItems = element.querySelectorAll('.flex.items-center')
        listItems.forEach((item) => {
          const span = item.querySelector('span')
          if (span) {
            span.style.paddingTop = '2px'
          }
        })

        // Page break logic
        const pxPerMm = element.offsetWidth / 190
        const pageHeightPx = 277 * pxPerMm
        const keepElements = Array.from(element.querySelectorAll('.pdf-keep')) as HTMLElement[]

        for (const child of keepElements) {
          const elementRect = element.getBoundingClientRect()
          const childRect = child.getBoundingClientRect()
          const relativeTop = childRect.top - elementRect.top
          const relativeBottom = relativeTop + childRect.height
          const startPage = Math.floor(relativeTop / pageHeightPx)
          const endPage = Math.floor(relativeBottom / pageHeightPx)

          if (startPage !== endPage) {
            const nextPageStart = (startPage + 1) * pageHeightPx
            const pushDownAmount = nextPageStart - relativeTop
            child.style.marginTop = `${pushDownAmount + 20}px`
          }
        }

        // Capture with html2canvas
        const canvas = await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const margin = 10
        const contentWidth = pdfWidth - margin * 2

        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = contentWidth / imgWidth
        const scaledHeight = imgHeight * ratio

        let heightLeft = scaledHeight
        let position = 0
        let pageCount = 0

        // Add pages
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, scaledHeight)
        heightLeft -= (pdfHeight - margin * 2)
        pageCount++

        while (heightLeft > 0) {
          position = heightLeft - scaledHeight + margin
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', margin, position, contentWidth, scaledHeight)
          heightLeft -= (pdfHeight - margin * 2)
          pageCount++
        }

        // Add page numbers
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i)
          pdf.setFontSize(8)
          pdf.setTextColor(150, 150, 150)
          pdf.text(`${i} / ${pageCount}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' })
        }

        const filename = `WP_Maintenance_Report_${reportData.clientName || 'Client'}_${format(new Date(reportData.reportDate), 'yyyyMMdd')}.pdf`

        // Get PDF as base64
        const pdfBase64 = pdf.output('dataurlstring')

        // Send to backend
        const response = await fetch('http://localhost:3001/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientEmail: reportData.clientEmail,
            clientName: reportData.clientName,
            periodStart: reportData.periodStart,
            periodEnd: reportData.periodEnd,
            pdfBase64: pdfBase64,
            fileName: filename,
          }),
        })

        const result = await response.json()

        if (result.success) {
          toast.success('メールが正常に送信されました！')
        } else {
          toast.error(result.message || 'メール送信に失敗しました')
        }

      } finally {
        document.body.removeChild(element)
      }

    } catch (error) {
      console.error('Email sending error:', error)
      toast.error(`メール送信中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }


  const completedTasksCount = reportData.tasks.filter(t => t.checked).length
  const progressPercentage = (completedTasksCount / reportData.tasks.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Button>
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">AVII WPメンテナンス報告</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Saved Reports Menu */}
            {/* Saved Reports Menu */}
            <SavedReportsSheet
              savedReports={savedReports}
              onLoad={loadReport}
              onDelete={deleteReport}
            />

            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'プレビューを閉じる' : 'プレビュー'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-8 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Form Section */}
          <div className="space-y-6">
            {/* Client Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                  クライアント情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">クライアント名</Label>
                    <Input
                      id="clientName"
                      placeholder="株式会社○○"
                      value={reportData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">サイトURL</Label>
                    <Input
                      id="siteUrl"
                      placeholder="https://example.com"
                      value={reportData.siteUrl}
                      onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">クライアントメールアドレス</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={reportData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date Range Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  報告期間
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportDate">報告日</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={reportData.reportDate}
                    onChange={(e) => handleInputChange('reportDate', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodStart">期間開始</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={reportData.periodStart}
                      onChange={(e) => handleInputChange('periodStart', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodEnd">期間終了</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={reportData.periodEnd}
                      onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Tasks Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  更新内容
                  <span className="ml-auto text-sm font-normal text-slate-500">
                    {completedTasksCount}/{reportData.tasks.length} 完了
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {reportData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={task.id}
                        checked={task.checked}
                        onCheckedChange={(checked) => handleTaskChange(task.id, checked as boolean)}
                      />
                      <Label
                        htmlFor={task.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {task.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plugin Update List Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Puzzle className="w-5 h-5 text-blue-600" />
                  プラグイン更新リスト
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="pluginUpdateList">更新したプラグイン名（改行区切りで入力）</Label>
                  <Textarea
                    id="pluginUpdateList"
                    placeholder="例：&#10;Yoast SEO&#10;Contact Form 7&#10;WooCommerce"
                    value={reportData.pluginUpdateList}
                    onChange={(e) => handleInputChange('pluginUpdateList', e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Backup File Name Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                  バックアップ情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="backupFileName">バックアップファイル名</Label>
                  <Input
                    id="backupFileName"
                    placeholder="例：backup_2026-01-30.zip"
                    value={reportData.backupFileName}
                    onChange={(e) => handleInputChange('backupFileName', e.target.value)}
                  />
                  <p className="text-xs text-slate-500">クライアントに表示するバックアップファイル名を入力してください</p>
                </div>
              </CardContent>
            </Card>

            {/* Analytics & Clarity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  解析レポート
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Analytics */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Google Analytics レポート画像
                  </Label>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('analyticsImage', e.target.files?.[0] || null)}
                      className="hidden"
                      id="analyticsImage"
                    />
                    <Label
                      htmlFor="analyticsImage"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">画像を選択</span>
                    </Label>
                  </div>

                  {reportData.analyticsImage && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-2 px-3 py-1.5">
                          <ImageIcon className="w-3 h-3" />
                          <span className="max-w-[200px] truncate">{reportData.analyticsImage.name}</span>
                          <span className="text-xs text-slate-400">({formatFileSize(reportData.analyticsImage.size)})</span>
                          <button
                            onClick={() => removeImage('analyticsImage')}
                            className="ml-1 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      </div>
                      <div className="border rounded-lg overflow-hidden max-h-48 bg-slate-50 flex justify-center">
                        <img
                          src={reportData.analyticsImage.dataUrl}
                          alt="Google Analytics"
                          className="h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="analyticsSummary">サマリー（オプション）</Label>
                    <Textarea
                      id="analyticsSummary"
                      placeholder="アクセス数、ユーザー数、ページビューなどのサマリーを入力..."
                      value={reportData.analyticsSummary}
                      onChange={(e) => handleInputChange('analyticsSummary', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Microsoft Clarity */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    Microsoft Clarity レポート画像
                  </Label>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('clarityImage', e.target.files?.[0] || null)}
                      className="hidden"
                      id="clarityImage"
                    />
                    <Label
                      htmlFor="clarityImage"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">画像を選択</span>
                    </Label>
                  </div>

                  {reportData.clarityImage && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-2 px-3 py-1.5">
                          <ImageIcon className="w-3 h-3" />
                          <span className="max-w-[200px] truncate">{reportData.clarityImage.name}</span>
                          <span className="text-xs text-slate-400">({formatFileSize(reportData.clarityImage.size)})</span>
                          <button
                            onClick={() => removeImage('clarityImage')}
                            className="ml-1 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      </div>
                      <div className="border rounded-lg overflow-hidden max-h-48 bg-slate-50 flex justify-center">
                        <img
                          src={reportData.clarityImage.dataUrl}
                          alt="Microsoft Clarity"
                          className="h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="claritySummary">サマリー（オプション）</Label>
                    <Textarea
                      id="claritySummary"
                      placeholder="ヒートマップ、セッションレコード、ユーザービヘイビアなどのサマリーを入力..."
                      value={reportData.claritySummary}
                      onChange={(e) => handleInputChange('claritySummary', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  コメント
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="追加のコメントや備考を入力..."
                  value={reportData.comment}
                  onChange={(e) => handleInputChange('comment', e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" size="lg">
                    <Save className="w-5 h-5" />
                    保存
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>レポートを保存</DialogTitle>
                    <DialogDescription>
                      現在のレポート内容をブラウザに保存します。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="reportName" className="mb-2 block">
                      レポート名
                    </Label>
                    <Input
                      id="reportName"
                      value={newReportName}
                      onChange={(e) => setNewReportName(e.target.value)}
                      placeholder="例：2月分 株式会社○○様"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={saveCurrentReport}>保存する</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Download className="w-5 h-5" />
                {isGenerating ? '生成中...' : 'PDFを生成'}
              </Button>
              <Button
                onClick={sendEmail}
                variant="outline"
                className="flex-1 gap-2"
                size="lg"
              >
                <Send className="w-5 h-5" />
                メールを送信
              </Button>
            </div>
          </div>

          {/* Preview Section - Always render for PDF generation */}
          {/* We use z-index -1 and absolute positioning to hide it behind the main content when not in preview mode */}
          {/* This ensures html2canvas can capture it correctly without it being "off-screen" which some browsers clip */}
          <div className={`${showPreview ? "sticky top-24 z-10" : "absolute top-0 left-0 -z-10 opacity-0 pointer-events-none h-0 overflow-hidden"}`}>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">レポートプレビュー</span>
                <span className="text-xs text-slate-400">複数ページ対応</span>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-200px)] p-4 bg-slate-100">
                {/* PDF Content - This is what gets captured */}
                <div
                  ref={pdfContentRef}
                  className="bg-white w-[190mm] mx-auto p-8 shadow-sm"
                  style={{
                    minHeight: 'auto',
                    fontFamily: '"Noto Sans JP", "Hiragino Sans", "Meiryo", sans-serif'
                  }}
                >
                  {/* Company Header with Logo */}
                  <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-blue-600">
                    <div className="flex items-center gap-4">
                      <img
                        src="/logo.png"
                        alt="AVII IMAGE WORKS"
                        className="w-16 h-16 object-contain"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">AVII IMAGE WORKS</h3>
                        <p className="text-sm text-slate-500">WordPress Maintenance Service</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                        <p className="text-xs opacity-80">報告日</p>
                        <p className="text-base font-bold">
                          {format(new Date(reportData.reportDate), 'yyyy年MM月dd日')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Report Title */}
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      WordPress メンテナンス報告書
                    </h1>
                    <p className="text-slate-500">WordPress Maintenance Report</p>
                  </div>

                  {/* Client Info */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-3">クライアント情報</h2>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">クライアント名</p>
                          <p className="font-medium text-slate-900">{reportData.clientName || '---'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">サイトURL</p>
                          <p className="font-medium text-slate-900">{reportData.siteUrl || '---'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Period */}
                  <div className="mb-6 pdf-keep">
                    <h2 className="text-lg font-bold text-slate-800 mb-3">報告期間</h2>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-blue-600 text-center">
                        {reportData.periodStart} ～ {reportData.periodEnd}
                      </p>
                    </div>
                  </div>

                  {/* Maintenance Tasks */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-3">実施したメンテナンス</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {reportData.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border pdf-keep ${task.checked
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-200 opacity-50'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${task.checked ? 'bg-green-500' : 'bg-slate-300'
                            }`}>
                            {task.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${task.checked ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                            {task.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plugin Update List */}
                  {reportData.pluginUpdateList.trim() && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-3">更新したプラグイン</h2>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <ul className="space-y-1">
                          {reportData.pluginUpdateList.split('\n').filter(line => line.trim()).map((plugin, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-slate-700 pdf-keep">
                              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </span>
                              <span className="leading-none pt-[1px]">{plugin.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Backup File Name */}
                  {reportData.backupFileName && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-3">バックアップ情報</h2>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600 mb-1">バックアップファイル名</p>
                        <p className="text-lg font-mono font-medium text-blue-800">{reportData.backupFileName}</p>
                      </div>
                    </div>
                  )}

                  {/* Analytics Report */}
                  {(reportData.analyticsSummary || reportData.analyticsImage || reportData.claritySummary || reportData.clarityImage) && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-3">解析レポート</h2>

                      {/* Google Analytics */}
                      {(reportData.analyticsSummary || reportData.analyticsImage) && (
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold text-slate-700 mb-2">Google Analytics</h3>
                          {reportData.analyticsImage && (
                            <div className="border rounded-lg overflow-hidden mb-2 bg-slate-50 flex justify-center">
                              <img
                                src={reportData.analyticsImage.dataUrl}
                                alt="Google Analytics"
                                className="max-w-full object-contain"
                                style={{ maxHeight: '400px' }}
                              />
                            </div>
                          )}
                          {reportData.analyticsSummary && (
                            <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-700">
                              {reportData.analyticsSummary}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Microsoft Clarity */}
                      {(reportData.claritySummary || reportData.clarityImage) && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-2">Microsoft Clarity</h3>
                          {reportData.clarityImage && (
                            <div className="border rounded-lg overflow-hidden mb-2 bg-slate-50 flex justify-center">
                              <img
                                src={reportData.clarityImage.dataUrl}
                                alt="Microsoft Clarity"
                                className="max-w-full object-contain"
                                style={{ maxHeight: '400px' }}
                              />
                            </div>
                          )}
                          {reportData.claritySummary && (
                            <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-700">
                              {reportData.claritySummary}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comments */}
                  {reportData.comment && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-3">コメント</h2>
                      <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-700">
                        {reportData.comment}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-slate-500 mb-2">
                          本報告書はWordPressメンテナンスの実施内容を報告するものです。
                        </p>
                        <p className="text-xs text-slate-400">
                          Generated by WP Maintenance Report Generator
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">AVII IMAGE WORKS</p>
                          <p className="text-xs text-slate-500">WordPress Maintenance Service</p>
                        </div>
                        <img
                          src="/logo.png"
                          alt="AVII IMAGE WORKS"
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>レポートを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。保存されたレポートは永久に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ReportGenerator
