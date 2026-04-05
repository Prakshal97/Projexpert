"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Award, Share2, Download, CheckCircle, Quote } from "lucide-react"
import Link from "next/link"

function CertificateContent() {
  const searchParams = useSearchParams()
  const name = searchParams.get("name") || "Sarah Developer"
  const project = searchParams.get("project") || "Full Stack Web Development"
  const score = searchParams.get("score") || "92"
  const dateObj = new Date()
  const date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 selection:bg-primary/30 print:p-0 print:bg-white print:block">
      <div className="max-w-4xl w-full flex justify-between items-center mb-8 print:hidden">
        <Link href="/dashboard">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" /> Share on LinkedIn
          </Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Certificate Frame */}
      <div id="certificate-node" className="relative w-full max-w-4xl bg-white text-slate-800 p-2 md:p-8 rounded-sm shadow-2xl overflow-hidden print:shadow-none print:p-0 print:w-[100vw] print:max-w-none print:h-[95vh] print:rounded-none print:m-0 print:block">
        <div className="relative border-[12px] border-slate-100 p-8 md:p-16 h-full w-full flex flex-col items-center text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] print:p-8 print:border-8">
          
          {/* Top Logo Area */}
          <div className="flex items-center space-x-2 border-b-2 border-slate-200 pb-4 mb-10 w-full justify-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-widest text-slate-900 uppercase">ProjExpert</span>
          </div>

          <h3 className="text-xl md:text-2xl font-medium tracking-widest text-slate-500 uppercase mb-4">
            Certificate of Completion
          </h3>
          
          <h1 className="text-4xl md:text-6xl font-serif text-slate-800 font-bold mb-6 italic">
            This certifies that
          </h1>

          <div className="border-b-2 border-primary pb-2 mb-8 w-3/4 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-bold text-primary">{name}</h2>
          </div>

          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
            has successfully completed the Virtual Internship Task: <br/>
            <strong className="text-slate-800 font-semibold text-2xl mt-2 block">{project}</strong>
          </p>

          <div className="flex flex-col items-center bg-slate-50 rounded-xl p-6 mb-12 shadow-inner border border-slate-200 w-full max-w-md">
            <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold mb-1">AI Assessed Performance Score</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-black text-green-600">{score}</span>
              <span className="text-2xl font-bold text-slate-400">/ 100</span>
            </div>
            <div className="flex items-center gap-1 mt-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle className="w-3 h-3" /> Superior Excellence
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between w-full mt-auto pt-8 items-end">
            <div className="flex flex-col flex-1 items-center">
              <span className="font-serif text-2xl mb-1 text-slate-700" style={{ fontFamily: 'cursive' }}>Alex (AI)</span>
              <div className="w-48 h-[1px] bg-slate-300 mb-2"></div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">AI Senior Developer</span>
            </div>
            
            {/* QR Code Placeholder wrapper */}
            <div className="flex flex-col shrink-0 items-center mx-4">
              <div className="w-24 h-24 bg-white border border-slate-200 shadow-sm p-1 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100 to-slate-200 opacity-50"></div>
                {/* Simulated QR Code squares */}
                 <div className="grid grid-cols-4 grid-rows-4 w-full h-full gap-0.5 z-10">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`bg-slate-800 ${i % 3 === 0 ? 'opacity-20' : i % 5 === 0 ? 'opacity-100' : 'opacity-80'} rounded-sm`}></div>
                    ))}
                 </div>
              </div>
              <span className="text-[10px] uppercase text-slate-400 mt-2 tracking-widest font-bold">Verify Credential</span>
            </div>

            <div className="flex flex-col flex-1 items-center">
              <span className="text-lg mb-2 text-slate-700 font-mono tracking-widest">{date}</span>
              <div className="w-48 h-[1px] bg-slate-300 mb-2"></div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Date of Issuance</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <CertificateContent />
    </Suspense>
  )
}
