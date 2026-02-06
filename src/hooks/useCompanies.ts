
import { useState } from 'react'
import { toast } from 'sonner'

export interface Company {
    id: string
    name: string
    personInCharge: string
    email: string
    url?: string
}

export const useCompanies = () => {
    const [companies, setCompanies] = useState<Company[]>(() => {
        const saved = localStorage.getItem('wp_maintenance_companies')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                console.error('Failed to parse saved companies', e)
                return []
            }
        }
        return []
    })

    // Save to localStorage whenever companies changes
    const updateCompanies = (newCompanies: Company[]) => {
        setCompanies(newCompanies)
        localStorage.setItem('wp_maintenance_companies', JSON.stringify(newCompanies))
    }

    const addCompany = (company: Omit<Company, 'id'>) => {
        const newCompany: Company = {
            id: crypto.randomUUID(),
            ...company
        }
        updateCompanies([...companies, newCompany])
        toast.success('会社情報を保存しました')
    }

    const updateCompany = (id: string, updatedData: Omit<Company, 'id'>) => {
        const newCompanies = companies.map(c =>
            c.id === id ? { ...c, ...updatedData } : c
        )
        updateCompanies(newCompanies)
        toast.success('会社情報を更新しました')
    }

    const deleteCompany = (id: string) => {
        const newCompanies = companies.filter(c => c.id !== id)
        updateCompanies(newCompanies)
        toast.success('会社情報を削除しました')
    }

    return {
        companies,
        addCompany,
        updateCompany,
        deleteCompany
    }
}
