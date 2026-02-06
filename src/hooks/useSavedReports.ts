import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { get, set } from 'idb-keyval'

export interface MaintenanceTask {
    id: string
    label: string
    checked: boolean
}

export interface AttachedImage {
    name: string
    dataUrl: string
    size: number
}

export interface ReportData {
    reportDate: string
    periodStart: string
    periodEnd: string
    clientName: string
    clientEmail: string
    siteUrl: string
    tasks: MaintenanceTask[]
    comment: string
    analyticsSummary: string
    claritySummary: string
    pluginUpdateList: string
    backupFileName: string
    analyticsImage: AttachedImage | null
    clarityImage: AttachedImage | null
}

export interface SavedReport {
    id: string
    name: string
    date: string
    data: ReportData
}

const STORAGE_KEY = 'wp_maintenance_saved_reports'

export const useSavedReports = () => {
    const [savedReports, setSavedReports] = useState<SavedReport[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load reports on mount
    useEffect(() => {
        get<SavedReport[]>(STORAGE_KEY).then((val) => {
            if (val) {
                setSavedReports(val)
            }
            setIsLoading(false)
        }).catch(err => {
            console.error('Failed to load reports:', err)
            setIsLoading(false)
        })
    }, [])

    const updateStorage = async (reports: SavedReport[]) => {
        try {
            await set(STORAGE_KEY, reports)
        } catch (e) {
            console.error('Failed to save to storage', e)
            toast.error('ストレージへの保存に失敗しました')
            throw e
        }
    }

    const saveReport = async (name: string, data: ReportData) => {
        const newReport: SavedReport = {
            id: crypto.randomUUID(),
            name: name,
            date: new Date().toISOString(),
            data: data
        }

        const updatedReports = [newReport, ...savedReports]
        setSavedReports(updatedReports) // Optimistic UI update

        try {
            await updateStorage(updatedReports)
            toast.success('レポートを保存しました')
            return true
        } catch (e) {
            // Revert on failure
            setSavedReports(savedReports)
            throw e
        }
    }

    const deleteReport = async (id: string) => {
        const updatedReports = savedReports.filter(r => r.id !== id)
        setSavedReports(updatedReports) // Optimistic UI update

        try {
            await updateStorage(updatedReports)
            toast.success('レポートを削除しました')
        } catch (e) {
            setSavedReports(savedReports)
        }
    }

    return {
        savedReports,
        saveReport,
        deleteReport,
        isLoading
    }
}
