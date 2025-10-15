import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Send } from "lucide-react";
import { toast } from "sonner";

interface ChatBoxProps {
  artworkId: string;
  sellerId: string;
  sellerName: string;
  onClose: () => void;
}

export function ChatBox({ artworkId, sellerId, sellerName, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadOrCreateConversation();
    }
  }, [user, artworkId]);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadOrCreateConversation = async () => {
    if (!user) return;

    // Try to find existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("artwork_id", artworkId)
      .eq("buyer_id", user.id)
      .single();

    if (existing) {
      setConversation(existing);
    } else {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          artwork_id: artworkId,
          buyer_id: user.id,
          seller_id: sellerId,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to start conversation");
      } else {
        setConversation(newConv);
      }
    }
  };

  const loadMessages = async () => {
    if (!conversation) return;

    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        profiles:sender_id (full_name, profile_photo)
      `)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    if (!conversation) return;

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              profiles:sender_id (full_name, profile_photo)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || !user) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: newMessage,
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] flex flex-col shadow-lg z-50">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <CardTitle className="text-lg">Chat with {sellerName}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.sender_id === user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button onClick={handleSend} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
