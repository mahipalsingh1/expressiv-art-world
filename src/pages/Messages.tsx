import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User, MessageCircle } from "lucide-react";

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadConversations(session.user.id);
    });
  }, [navigate]);

  const loadConversations = async (userId: string) => {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        artworks (id, title, image_url),
        buyer:buyer_id (id, full_name, profile_photo),
        seller:seller_id (id, full_name, profile_photo),
        messages (content, created_at)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    setConversations(data || []);
    setLoading(false);
  };

  const getOtherUser = (conversation: any) => {
    if (!user) return null;
    return conversation.buyer_id === user.id
      ? conversation.seller
      : conversation.buyer;
  };

  const getLastMessage = (conversation: any) => {
    if (!conversation.messages || conversation.messages.length === 0)
      return "No messages yet";
    const sorted = conversation.messages.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0]?.content || "No messages yet";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Messages</h1>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">No conversations yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl space-y-4">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              return (
                <Card
                  key={conversation.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    navigate(`/artwork/${conversation.artwork_id}`)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={otherUser?.profile_photo} />
                        <AvatarFallback>
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {otherUser?.full_name || "Unknown User"}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-sm text-muted-foreground">
                            {conversation.artworks?.title}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {getLastMessage(conversation)}
                        </p>
                      </div>
                      {conversation.artworks?.image_url && (
                        <img
                          src={conversation.artworks.image_url}
                          alt={conversation.artworks.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
