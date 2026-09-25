import './globals.css';
import type {ReactNode} from 'react';
export const metadata={title:'Serveone Quotation',description:'PT Serveone MRO Indonesia Quotation Generator'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
