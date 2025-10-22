"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Send, Settings, LogOut, User, ThumbsDown, ThumbsUp, MessageSquare } from "lucide-react"
import { isAuthenticated, getAuthToken, removeAuthToken } from "@/lib/auth"
import { sendMessage, sendFeedback, getChatHistory } from "@/lib/api"
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
  reference?: Array<{
    filename: string
    chunk_text: string
    similarity: number
    document_id: string
  }>
}

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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

    const loadChatHistory = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          router.push("/login")
          return
        }

        const history = await getChatHistory(token, 8)

        const mappedMessages: Message[] = history.map((item) => ({
          id: item.id,
          role: item.type,
          content: item.content,
          timestamp: new Date(item.created_at),
          feedback: item.feedback === "like" ? "positive" : item.feedback === "dislike" ? "negative" : null,
          feedbackMessage: item.feedback_comment || undefined,
          reference: item.reference || undefined,
        }))

        setMessages(mappedMessages)
      } catch (error) {
        console.error("Failed to load chat history:", error)
      }
    }

    loadChatHistory()
  }, [router])

  useEffect(() => {
    if (scrollRef.current) {
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
        reference: response.reference,
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

  const handleFeedback = async (messageId: string, type: "like" | "dislike") => {
    try {
      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      const message = messages.find((msg) => msg.id === messageId)
      const existingComment = message?.feedbackMessage || ""

      await sendFeedback(token, messageId, {
        feedback: type,
        comment: existingComment,
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                feedback: type === "like" ? "positive" : "negative",
              }
            : msg,
        ),
      )

      toast({
        title: "Feedback poslat",
        description: "Hvala na povratnoj informaciji!",
      })
    } catch (error) {
      console.error("Failed to send feedback:", error)
      toast({
        title: "Greška",
        description: "Nije moguće poslati feedback. Pokušajte ponovo.",
        variant: "destructive",
      })
    }
  }

  const handleCommentFeedback = (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId)
    const existingFeedback =
      message?.feedback === "positive" ? "like" : message?.feedback === "negative" ? "dislike" : null

    setFeedbackDialog({
      isOpen: true,
      messageId,
      type: message?.feedback || null,
    })
    setFeedbackText("")
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackDialog.messageId) return

    try {
      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      const message = messages.find((msg) => msg.id === feedbackDialog.messageId)
      const existingFeedback =
        message?.feedback === "positive" ? "like" : message?.feedback === "negative" ? "dislike" : null

      await sendFeedback(token, feedbackDialog.messageId, {
        feedback: existingFeedback,
        comment: feedbackText.trim(),
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === feedbackDialog.messageId
            ? {
                ...msg,
                feedbackMessage: feedbackText.trim() || undefined,
              }
            : msg,
        ),
      )

      toast({
        title: "Feedback poslat",
        description: "Hvala na povratnoj informaciji!",
      })

      setFeedbackDialog({ isOpen: false, messageId: null, type: null })
      setFeedbackText("")
    } catch (error) {
      console.error("Failed to send feedback:", error)
      toast({
        title: "Greška",
        description: "Nije moguće poslati feedback. Pokušajte ponovo.",
        variant: "destructive",
      })
    }
  }

  const handleCancelFeedback = () => {
    setFeedbackDialog({ isOpen: false, messageId: null, type: null })
    setFeedbackText("")
  }

  const lastAssistantMessage = messages
    .filter((msg) => msg.role === "assistant")
    .reverse()
    .find((msg) => msg.reference && msg.reference.length > 0)

  const currentReferences = lastAssistantMessage?.reference || []

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNewChat={handleNewChat}
        references={currentReferences}
      />

      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
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
                            onClick={() => handleFeedback(message.id, "like")}
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
                            onClick={() => handleFeedback(message.id, "dislike")}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", message.feedbackMessage && "text-blue-600 hover:text-blue-600")}
                            onClick={() => handleCommentFeedback(message.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
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
            <DialogTitle>Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Molimo vas da podijelite više detalja o vašem iskustvu:</p>
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