import {Suspense} from 'react'; import AppShell from '@/components/AppShell'; import QuotationApp from '@/components/QuotationApp';
export default function Page(){return <AppShell><Suspense fallback={<div className="panel">Loading quotation...</div>}><QuotationApp/></Suspense></AppShell>}
