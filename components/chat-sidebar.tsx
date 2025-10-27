"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  BookOpen,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAuthToken } from "@/lib/auth"
import { getDocuments, uploadDocument, deleteDocument, getUserProfile } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
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
  references?: Array<{
    filename: string
    chunk_text: string
    similarity: number
    document_id: string
  }>
  onDocumentsChange?: (count: number) => void
  onLogout: () => void
  onSettings: () => void
  onUploadTrigger?: (triggerFn: () => void) => void
}

export function ChatSidebar({
  isCollapsed,
  onToggle,
  onNewChat,
  references = [],
  onDocumentsChange,
  onLogout,
  onSettings,
  onUploadTrigger,
}: ChatSidebarProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState("docs")
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null)
  const [userName, setUserName] = useState<string>("Korisnik")
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingDocs(true)
      setIsLoadingProfile(true)
      try {
        const token = getAuthToken()
        if (token) {
          const docData = await getDocuments(token)
          setDocuments(docData)

          try {
            const profile = await getUserProfile(token)
            setUserName(profile.name)
          } catch (error) {
            console.error("Failed to load user profile:", error)
          }
        }
      } catch (error) {
        setDocuments([])
      } finally {
        setIsLoadingDocs(false)
        setIsLoadingProfile(false)
      }
    }

    loadData()
  }, [])

  const handleUploadDocument = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    if (onUploadTrigger) {
      onUploadTrigger(handleUploadDocument)
    }
  }, [onUploadTrigger, handleUploadDocument])

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

      setDocuments((prev) => [uploadedDoc, ...prev])

      toast({
        title: "Uspješno",
        description: `Dokument "${file.name}" je uspješno učitan.`,
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Nije moguće učitati dokument.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteDocument = (docId: string, docName: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setDocToDelete({ id: docId, name: docName })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!docToDelete) return

    setDeletingDocId(docToDelete.id)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Niste prijavljeni")
      }

      await deleteDocument(token, docToDelete.id)

      setDocuments((prev) => prev.filter((doc) => doc.id !== docToDelete.id))

      toast({
        title: "Uspješno",
        description: `Dokument "${docToDelete.name}" je uspješno obrisan.`,
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Nije moguće obrisati dokument.",
        variant: "destructive",
      })
    } finally {
      setDeletingDocId(null)
      setDeleteConfirmOpen(false)
      setDocToDelete(null)
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    if (isCollapsed) {
      onToggle()
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
        {!isCollapsed && <h2 className="text-lg font-semibold">Dobar Dan</h2>}
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
                    className={cn(
                      "w-full justify-start gap-2 transition-all duration-200",
                      isUploading
                      ? "bg-[#ffcf53] text-white border-[#ffcf53] hover:bg-[#ffcf53]/90 animate-pulse cursor-not-allowed"
                      : "bg-[#ffcf53] text-white border-[#ffcf53] hover:bg-[#ffcf53]/90 hover:text-white",
                    )}
                    onClick={handleUploadDocument}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isUploading ? "Učitavanje..." : "Dodaj dokument"}
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
                      <h3 className="text-sm font-semibold mb-2">Citirani izvori</h3>
                      {references.length === 0 ? (
                        <div className="text-xs text-muted-foreground">Nema citiranih izvora</div>
                      ) : (
                        <div className="space-y-2">
                          {references.map((ref, index) => (
                            <div
                              key={`${ref.document_id}-${index}`}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50"
                            >
                              <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-sm cursor-default truncate">
                                    {truncateFilename(ref.filename, 25)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>{ref.filename}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                      )}
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

      <div className="p-2">
        {!isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3 px-3 hover:bg-[#F4A460]">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0 gap-1">
                {isLoadingProfile ? (
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                  ) : (
                    <span className="text-sm font-medium">{userName}</span>
                  )}
                  <span className="text-xs text-muted-foreground">Besplatna verzija</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Postavke korisnika
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Odjavi se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 mx-auto hover:bg-[#F4A460]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right" className="w-48">
                  <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Postavke korisnika
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Odjavi se
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Korisnički meni</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši dokument</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da obrišete dokument "{docToDelete?.name}"? Ova akcija se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}