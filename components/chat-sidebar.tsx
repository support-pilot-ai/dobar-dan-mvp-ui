"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { X, FileText, BookOpen, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAuthToken } from "@/lib/auth"
import { getDocuments } from "@/lib/api"

interface Document {
  id: string
  title: string
  type: string
  uploadedAt: Date
}

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
}

export function ChatSidebar({ isOpen, onClose, onNewChat }: ChatSidebarProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState("docs")
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingDocs(true)
      try {
        const token = getAuthToken()
        if (token) {
          try {
            const docData = await getDocuments(token)
            setDocuments(
              docData.map((doc: any) => ({
                id: doc.id,
                title: doc.title,
                type: doc.type,
                uploadedAt: new Date(doc.uploaded_at),
              })),
            )
          } catch (error) {
            console.log("[v0] Using demo documents due to API error")
            setDocuments([
              { id: "1", title: "Demo Dokument.pdf", type: "pdf", uploadedAt: new Date() },
              { id: "2", title: "Primjer Fajl.docx", type: "docx", uploadedAt: new Date() },
            ])
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoadingDocs(false)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const handleUploadDocument = () => {
    console.log("Upload document")
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Meni</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2 lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={handleUploadDocument}
              >
                <Upload className="h-4 w-4" />
                Učitaj dokument
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
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">Nema učitanih dokumenata</div>
                ) : (
                  documents.map((doc) => (
                    <Button key={doc.id} variant="ghost" className="w-full justify-start gap-2 text-left">
                      <FileText className="h-4 w-4 shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="truncate font-medium">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">{doc.type}</div>
                      </div>
                    </Button>
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
        </Tabs>
      </aside>
    </>
  )
}