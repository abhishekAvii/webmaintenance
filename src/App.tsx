
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import CompanyList from './pages/CompanyList'
import ReportGenerator from './pages/ReportGenerator'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<CompanyList />} />
                <Route path="/report" element={<ReportGenerator />} />
            </Routes>
            <Toaster position="top-right" richColors />
        </BrowserRouter>
    )
}

export default App
