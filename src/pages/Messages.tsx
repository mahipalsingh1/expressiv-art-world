import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, User } from "lucide-react";
import { ChatWindow } from "@/components/ChatWindow";

export default function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        artworks:artwork_id (id, title, image_url),
        buyer_profile:buyer_id (full_name, profile_photo),
        seller_profile:seller_id (full_name, profile_photo)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    setConversations(data || []);
  };

  const handleConversationClick = (conv: any) => {
    const otherUser =
      conv.buyer_id === user.id ? conv.seller_profile : conv.buyer_profile;
    const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;

    setSelectedChat({
      artworkId: conv.artwork_id,
      sellerId: otherUserId,
      sellerName: otherUser?.full_name || "Unknown User",
      sellerPhoto: otherUser?.profile_photo,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                Start a conversation with an artist by visiting their artwork
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conv) => {
              const otherUser =
                conv.buyer_id === user.id
                  ? conv.seller_profile
                  : conv.buyer_profile;

              return (
                <Card
                  key={conv.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleConversationClick(conv)}
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
                        <p className="font-semibold">
                          {otherUser?.full_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {conv.artworks?.title}
                        </p>
                      </div>
                      {conv.artworks?.image_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={conv.artworks.image_url}
                            alt={conv.artworks.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedChat && (
        <ChatWindow
          artworkId={selectedChat.artworkId}
          sellerId={selectedChat.sellerId}
          sellerName={selectedChat.sellerName}
          sellerPhoto={selectedChat.sellerPhoto}
          currentUserId={user.id}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
}
