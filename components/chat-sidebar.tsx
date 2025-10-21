"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, BookOpen, Upload, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAuthToken } from "@/lib/auth"
import { getDocuments, uploadDocument, deleteDocument } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  user_id: string
  filename: string
  file_type: string
  file_size: number
  file_url: string
  status: string
  chunk_count: number
  error_message: string | null
  created_at: string
}

interface ChatSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  onNewChat: () => void
}

export function ChatSidebar({ isCollapsed, onToggle, onNewChat }: ChatSidebarProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState("docs")
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingDocs(true)
      try {
        const token = getAuthToken()
        if (token) {
          const docData = await getDocuments(token)
          setDocuments(docData)
        }
      } catch (error) {
        setDocuments([])
      } finally {
        setIsLoadingDocs(false)
      }
    }

    loadData()
  }, [])

  const handleUploadDocument = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      "application/pdf",
      "text/plain", // .txt files
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx files
    ]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Greška",
        description: "Molimo učitajte PDF, TXT ili DOCX fajl.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Greška",
        description: "Fajl je prevelik. Maksimalna veličina je 10MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Niste prijavljeni")
      }

      const uploadedDoc = await uploadDocument(token, file)

      // Add the new document to the list
      setDocuments((prev) => [uploadedDoc, ...prev])

      toast({
        title: "Uspješno",
        description: `Dokument "${file.name}" je uspješno učitan.`,
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Failed to upload document:", error)
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Nije moguće učitati dokument.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string, docName: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent button click from triggering

    setDeletingDocId(docId)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Niste prijavljeni")
      }

      await deleteDocument(token, docId)

      // Remove the document from the list
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId))

      toast({
        title: "Uspješno",
        description: `Dokument "${docName}" je uspješno obrisan.`,
      })
    } catch (error) {
      console.error("Failed to delete document:", error)
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Nije moguće obrisati dokument.",
        variant: "destructive",
      })
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    if (isCollapsed) {
      onToggle() // Expand sidebar when clicking on icon in collapsed state
    }
  }

  const truncateFilename = (filename: string, maxLength = 15): string => {
    if (filename.length <= maxLength) return filename
    return filename.substring(0, maxLength) + "..."
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out shrink-0",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Meni</h2>}
      </div>

      <Separator />

      <TooltipProvider>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {!isCollapsed ? (
            <>
              <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2">
                <TabsTrigger value="docs" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Dokumenti
                </TabsTrigger>
                <TabsTrigger value="refs" className="text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Reference
                </TabsTrigger>
              </TabsList>

              <TabsContent value="docs" className="flex-1 mt-0">
                <div className="p-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent"
                    onClick={handleUploadDocument}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Učitavanje..." : "Učitaj dokument"}
                  </Button>
                </div>
                <ScrollArea className="h-full px-2">
                  <div className="space-y-1 py-2">
                    {isLoadingDocs ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2">
                            <Skeleton className="h-4 w-4 shrink-0 bg-gray-200" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full bg-gray-200" />
                              <Skeleton className="h-3 w-16 bg-gray-200" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : documents.length === 0 ? (
                      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        Nema učitanih dokumenata
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium cursor-default">
                                {truncateFilename(doc.filename)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{doc.filename}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            onClick={(e) => handleDeleteDocument(doc.id, doc.filename, e)}
                            disabled={deletingDocId === doc.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="refs" className="flex-1 mt-0">
                <ScrollArea className="h-full px-2">
                  <div className="space-y-1 py-2">
                    <div className="px-3 py-2">
                      <h3 className="text-sm font-semibold mb-2">Brze reference</h3>
                      <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start gap-2 text-left text-sm">
                          <BookOpen className="h-4 w-4 shrink-0" />
                          Vodič za početnike
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-left text-sm">
                          <BookOpen className="h-4 w-4 shrink-0" />
                          API Dokumentacija
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-left text-sm">
                          <BookOpen className="h-4 w-4 shrink-0" />
                          Najbolje prakse
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-left text-sm">
                          <BookOpen className="h-4 w-4 shrink-0" />
                          Često postavljana pitanja
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="px-3 py-2">
                      <h3 className="text-sm font-semibold mb-2">Nedavni izvori</h3>
                      <div className="text-xs text-muted-foreground">Nema citiranih izvora</div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === "docs" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => handleTabClick("docs")}
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Dokumenti</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === "refs" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => handleTabClick("refs")}
                  >
                    <BookOpen className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Reference</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </Tabs>
      </TooltipProvider>
    </aside>
  )
}