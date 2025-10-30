"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Send, ThumbsDown, ThumbsUp, MessageSquare, Upload } from "lucide-react"
import { isAuthenticated, getAuthToken, removeAuthToken } from "@/lib/auth"
import { sendMessage, sendFeedback, getChatHistory, getUserProfile } from "@/lib/api"
import { ChatSidebar } from "@/components/chat-sidebar"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [documentCount, setDocumentCount] = useState(0)
  const [triggerUpload, setTriggerUpload] = useState<(() => void) | null>(null)
  const [userInitials, setUserInitials] = useState("Ti")
  const [userName, setUserName] = useState("")
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

  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0]?.substring(0, 2).toUpperCase() || "Ti"
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const loadUserProfile = async () => {
      const token = getAuthToken()
      if (!token) return

      try {
        const profile = await getUserProfile(token)
        if (profile.name) {
          setUserInitials(getInitials(profile.name))
          setUserName(profile.name)
        }
      } catch (error) {
        console.error("Failed to load user profile:", error)
      }
    }

    const loadChatHistory = async () => {
      setIsLoadingHistory(true)
      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      const history = await getChatHistory(token, 6)

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
      setIsLoadingHistory(false)
    }

    loadUserProfile()
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current && documentCount > 0) {
        textareaRef.current.focus()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [documentCount, messages.length])

  useEffect(() => {
    if (!isLoading && textareaRef.current && documentCount > 0) {
      textareaRef.current.focus()
    }
  }, [isLoading, documentCount])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputElement = target.tagName === "INPUT" || target.tagName === "TEXTAREA"

      if (feedbackDialog.isOpen) return

      if (target === textareaRef.current) return

      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key.length > 1 && e.key !== "Enter" && e.key !== "Backspace") return

      if (isInputElement) return

      if (textareaRef.current && documentCount > 0 && !isLoading) {
        textareaRef.current.focus()
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => document.removeEventListener("keydown", handleGlobalKeyDown)
  }, [documentCount, isLoading, feedbackDialog.isOpen])

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
    console.log("[v0] Logout clicked from sidebar")
    removeAuthToken()
    router.push("/login")
  }

  const handleSettings = () => {
    console.log("[v0] Settings clicked from sidebar, navigating to /settings")
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
        variant: "success",
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
        variant: "success",
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

  const handleDocumentsChange = (count: number) => {
    setDocumentCount(count)
  }

  const handleUploadTrigger = useCallback((triggerFn: () => void) => {
    setTriggerUpload(() => triggerFn)
  }, [])

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Uspješno kopirano!",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to copy message:", error)
      toast({
        title: "Greška",
        description: "Nije moguće kopirati poruku. Pokušajte ponovo.",
        variant: "destructive",
      })
    }
  }

  const lastAssistantMessage = messages
    .filter((msg) => msg.role === "assistant")
    .reverse()
    .find((msg) => msg.reference && msg.reference.length > 0)

  const currentReferences = lastAssistantMessage?.reference || []

  const hasDocuments = documentCount > 0
  const inputPlaceholder = hasDocuments ? "Postavi pitanje..." : "Prvo učitaj dokument..."

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNewChat={handleNewChat}
        references={currentReferences}
        onDocumentsChange={handleDocumentsChange}
        onUploadTrigger={handleUploadTrigger}
        onLogout={handleLogout}
        onSettings={handleSettings}
        userName={userName}
      />

      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef}>
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                  <h1 className="text-5xl font-bold text-balance">Dobar Dan 👋</h1>
                  <div className="space-y-4 text-left">
                    <p className="text-lg font-medium text-foreground">Evo kako početi:</p>
                    <div className="space-y-3">
                      <p className="text-base font-semibold text-foreground">Koraci:</p>
                      <ol className="space-y-2 text-base text-muted-foreground list-decimal list-inside">
                        <li>Dodaj jedan ili više dokumenata (PDF, Word, TXT)</li>
                        <li>Sačekaj par sekundi da se obradi</li>
                        <li>Postavi pitanje vezano za dokument</li>
                        <li>Dobij odgovor sa izvorima</li>
                      </ol>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="bg-[#ffcf53] hover:bg-[#ffcf53]/90 text-white gap-2"
                      onClick={() => triggerUpload?.()}
                    >
                      <Upload className="h-5 w-5" />
                      Dodaj dokument
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {isLoadingHistory ? (
                  <>
                    {/* First skeleton - User message (right side) */}
                    <div className="flex gap-4 justify-end">
                      <div className="flex flex-col gap-2 max-w-[80%]">
                        <div className="rounded-2xl bg-primary/10 px-4 py-3">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px] mt-2" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    </div>

                    {/* Second skeleton - AI message (left side) */}
                    <div className="flex gap-4 justify-start">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="flex flex-col gap-2 max-w-[80%]">
                        <div className="rounded-2xl bg-muted px-4 py-3">
                          <Skeleton className="h-4 w-[300px]" />
                          <Skeleton className="h-4 w-[280px] mt-2" />
                          <Skeleton className="h-4 w-[250px] mt-2" />
                        </div>
                      </div>
                    </div>

                    {/* Third skeleton - User message (right side) */}
                    <div className="flex gap-4 justify-end">
                      <div className="flex flex-col gap-2 max-w-[80%]">
                        <div className="rounded-2xl bg-primary/10 px-4 py-3">
                          <Skeleton className="h-4 w-[220px]" />
                          <Skeleton className="h-4 w-[180px] mt-2" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    </div>
                  </>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex gap-4 mb-6", message.role === "user" ? "justify-end" : "justify-start")}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">DD</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-2 max-w-[80%]">
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground",
                            )}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          {message.role === "assistant" && (
                            <div className="flex items-center justify-between px-2">
                              <div className="flex items-center gap-2">
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
                                  className={cn(
                                    "h-7 w-7",
                                    message.feedbackMessage && "text-blue-600 hover:text-blue-600",
                                  )}
                                  onClick={() => handleCommentFeedback(message.id)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleCopyMessage(message.content)}
                              >
                                Kopiraj
                              </Button>
                            </div>
                          )}
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-4 mb-6">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">DD</AvatarFallback>
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
                  </>
                )}
              </>
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
                placeholder={inputPlaceholder}
                className="min-h-[52px] max-h-[200px] resize-none pr-12"
                rows={1}
                disabled={isLoading || !hasDocuments}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading || !hasDocuments}
                className="absolute bottom-2 right-2 h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              Odgovori mogu biti pogrešni. Provjeri važne informacije!
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