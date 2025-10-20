"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Send, Menu, Settings, LogOut, User, ThumbsDown, ThumbsUp } from "lucide-react"
import { isAuthenticated, getAuthToken, removeAuthToken } from "@/lib/auth"
import { sendMessage } from "@/lib/api"
import { ChatSidebar } from "@/components/chat-sidebar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  feedback?: "positive" | "negative" | null
  feedbackMessage?: string
}

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: "Zdravo! Kako mogu da ti pomognem?",
      timestamp: new Date(Date.now() - 600000),
    },
    {
      id: "2",
      role: "assistant",
      content: "Zdravo! Ja sam tvoj AI asistent. Mogu ti pomoći sa različitim pitanjima i zadacima. Šta te zanima?",
      timestamp: new Date(Date.now() - 570000),
      feedback: null,
    },
    {
      id: "3",
      role: "user",
      content: "Možeš li mi objasniti kako funkcioniše upload dokumenata?",
      timestamp: new Date(Date.now() - 540000),
    },
    {
      id: "4",
      role: "assistant",
      content:
        "Naravno! Upload dokumenata je jednostavan proces. Klikni na dugme 'Učitaj dokument' u sidebaru, izaberi PDF, TXT ili DOCX fajl sa svog računara, i sistem će automatski procesirati dokument. Nakon što je dokument procesiran, možeš postavljati pitanja o njegovom sadržaju.",
      timestamp: new Date(Date.now() - 510000),
      feedback: null,
    },
    {
      id: "5",
      role: "user",
      content: "Koliko dokumenata mogu da upload-ujem odjednom?",
      timestamp: new Date(Date.now() - 480000),
    },
    {
      id: "6",
      role: "assistant",
      content:
        "Možeš upload-ovati dokumente jedan po jedan. Svaki dokument se procesira pojedinačno, što omogućava bolju kontrolu i praćenje statusa svakog fajla. Nema ograničenja na ukupan broj dokumenata koje možeš imati u sistemu.",
      timestamp: new Date(Date.now() - 450000),
      feedback: null,
    },
    {
      id: "7",
      role: "user",
      content: "Kako mogu da obrišem dokument koji više ne trebam?",
      timestamp: new Date(Date.now() - 420000),
    },
    {
      id: "8",
      role: "assistant",
      content:
        "Brisanje dokumenta je vrlo jednostavno! U sidebaru, pored svakog dokumenta nalazi se ikonica za brisanje (korpa). Klikni na tu ikonicu i dokument će biti trajno obrisan iz sistema. Obrati pažnju da je ova akcija nepovratna.",
      timestamp: new Date(Date.now() - 390000),
      feedback: null,
    },
    {
      id: "9",
      role: "user",
      content: "Koje vrste fajlova mogu da upload-ujem?",
      timestamp: new Date(Date.now() - 360000),
    },
    {
      id: "10",
      role: "assistant",
      content:
        "Trenutno sistem podržava tri tipa fajlova: PDF (.pdf), tekstualne dokumente (.txt) i Word dokumente (.docx). Maksimalna veličina fajla je 10MB. Ovi formati pokrivaju većinu standardnih dokumenata koje korisnici obično koriste.",
      timestamp: new Date(Date.now() - 330000),
      feedback: null,
    },
    {
      id: "11",
      role: "user",
      content: "Kako mogu da promenim svoje korisničke podatke?",
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: "12",
      role: "assistant",
      content:
        "Za promenu korisničkih podataka, klikni na avatar ikonicu u gornjem desnom uglu i izaberi 'Postavke korisnika'. Tamo možeš promeniti svoje ime i lozinku. Sve promene se čuvaju automatski nakon što klikneš na dugme 'Sačuvaj promjene'.",
      timestamp: new Date(Date.now() - 270000),
      feedback: null,
    },
    {
      id: "13",
      role: "user",
      content: "Da li mogu da pregledam istoriju svojih razgovora?",
      timestamp: new Date(Date.now() - 240000),
    },
    {
      id: "14",
      role: "assistant",
      content:
        "Trenutno sistem čuva samo aktivnu sesiju razgovora. Kada se odjaviš ili osvežiš stranicu, istorija razgovora se briše. Ova funkcionalnost je dizajnirana da obezbedi privatnost i sigurnost tvojih podataka.",
      timestamp: new Date(Date.now() - 210000),
      feedback: null,
    },
    {
      id: "15",
      role: "user",
      content: "Šta znači kada dokument ima status 'processing'?",
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: "16",
      role: "assistant",
      content:
        "Status 'processing' znači da sistem trenutno analizira i indeksira sadržaj tvog dokumenta. Ovaj proces obično traje nekoliko sekundi do minut, zavisno od veličine dokumenta. Nakon što se procesiranje završi, status će se promeniti u 'completed' i moći ćeš postavljati pitanja o sadržaju dokumenta.",
      timestamp: new Date(Date.now() - 150000),
      feedback: null,
    },
    {
      id: "17",
      role: "user",
      content: "Kako funkcioniše feedback sistem?",
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "18",
      role: "assistant",
      content:
        "Feedback sistem ti omogućava da oceniš kvalitet mojih odgovora. Ispod svakog mog odgovora nalaze se dve ikone - thumbs up za pozitivan feedback i thumbs down za negativan feedback. Kada klikneš na jednu od njih, otvara se prozor gde možeš ostaviti dodatnu tekstualnu poruku sa detaljima o svom iskustvu. Tvoj feedback nam pomaže da poboljšamo kvalitet odgovora!",
      timestamp: new Date(Date.now() - 90000),
      feedback: null,
    },
    {
      id: "19",
      role: "user",
      content: "Da li mogu da koristim aplikaciju na mobilnom telefonu?",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "20",
      role: "assistant",
      content:
        "Da, aplikacija je potpuno responzivna i prilagođena za korišćenje na mobilnim uređajima! Na manjim ekranima, sidebar se automatski sakriva i možeš ga otvoriti klikom na meni ikonicu u gornjem levom uglu. Sve funkcionalnosti su dostupne i na mobilnim uređajima, uključujući upload dokumenata, chat i postavke.",
      timestamp: new Date(Date.now() - 30000),
      feedback: null,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [feedbackDialog, setFeedbackDialog] = useState<{
    isOpen: boolean
    messageId: string | null
    type: "positive" | "negative" | null
  }>({
    isOpen: false,
    messageId: null,
    type: null,
  })
  const [feedbackText, setFeedbackText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
  }, [router])

  useEffect(() => {
    if (scrollRef.current) {
      // Use setTimeout to ensure DOM is fully updated before scrolling
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await sendMessage(token, userMessage.content)

      const assistantMessage: Message = {
        id: response.id,
        role: "assistant",
        content: response.content,
        timestamp: new Date(response.created_at),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Greška pri slanju poruke. Molimo pokušajte ponovo.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setInput("")
  }

  const handleLogout = () => {
    console.log("[v0] Logout clicked from navbar")
    removeAuthToken()
    router.push("/login")
  }

  const handleSettings = () => {
    console.log("[v0] Settings clicked from navbar, navigating to /settings")
    router.push("/settings")
  }

  const handleFeedback = (messageId: string, type: "positive" | "negative") => {
    setFeedbackDialog({
      isOpen: true,
      messageId,
      type,
    })
    setFeedbackText("")
  }

  const handleSubmitFeedback = () => {
    if (!feedbackDialog.messageId || !feedbackDialog.type) return

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === feedbackDialog.messageId
          ? {
              ...msg,
              feedback: feedbackDialog.type,
              feedbackMessage: feedbackText.trim() || undefined,
            }
          : msg,
      ),
    )

    console.log(
      `[v0] ${feedbackDialog.type === "positive" ? "Positive" : "Negative"} feedback for message ${feedbackDialog.messageId}:`,
      feedbackText.trim() || "(no message)",
    )

    toast({
      title: "Feedback poslat",
      description: "Hvala na povratnoj informaciji!",
    })

    setFeedbackDialog({ isOpen: false, messageId: null, type: null })
    setFeedbackText("")

    // TODO: Send feedback to API
  }

  const handleCancelFeedback = () => {
    setFeedbackDialog({ isOpen: false, messageId: null, type: null })
    setFeedbackText("")
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNewChat={handleNewChat} />

      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Chat Asistent</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Postavke korisnika
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Odjavi se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-semibold text-balance">Kako mogu da ti pomognem danas?</h2>
                  <p className="text-muted-foreground">Započni razgovor upisivanjem poruke ispod</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3",
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7",
                              message.feedback === "positive" && "text-green-600 hover:text-green-600",
                            )}
                            onClick={() => handleFeedback(message.id, "positive")}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7",
                              message.feedback === "negative" && "text-red-600 hover:text-red-600",
                            )}
                            onClick={() => handleFeedback(message.id, "negative")}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">Ti</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl bg-muted px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4 shrink-0">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Poruka..."
                className="min-h-[52px] max-h-[200px] resize-none pr-12"
                rows={1}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute bottom-2 right-2 h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              AI može praviti greške. Provjerite važne informacije.
            </p>
          </form>
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.isOpen} onOpenChange={(open) => !open && handleCancelFeedback()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {feedbackDialog.type === "positive" ? "Pozitivan feedback" : "Negativan feedback"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Molimo vas da podijelite više detalja o vašem iskustvu (opciono):
            </p>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Unesite vašu povratnu informaciju..."
              className="min-h-[120px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelFeedback}>
              Otkaži
            </Button>
            <Button onClick={handleSubmitFeedback}>Pošalji</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}