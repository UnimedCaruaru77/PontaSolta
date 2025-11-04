'use client'

import { Suspense } from 'react'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'

function KanbanContent() {
    return (
        <div className="min-h-screen bg-dark-900">
            <div className="p-6">
                <h1>Kanban Test</h1>
            </div>
        </div>
    )
}

export default function KanbanPage() {
    return (
        <AuthenticatedLayout>
            <Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
                </div>
            }>
                <KanbanContent />
            </Suspense>
        </AuthenticatedLayout>
    )
}