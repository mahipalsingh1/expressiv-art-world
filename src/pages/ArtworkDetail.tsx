import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, User, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ChatWindow } from "@/components/ChatWindow";

export default function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      loadArtwork();
      loadComments();
      if (user) {
        checkFavorite();
      }
    }
  }, [id, user]);

  const loadArtwork = async () => {
    const { data } = await supabase
      .from("artworks")
      .select(`
        *,
        profiles:artist_id (id, full_name, profile_photo, bio, user_type)
      `)
      .eq("id", id)
      .single();

    setArtwork(data);
    setLoading(false);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (full_name, profile_photo)
      `)
      .eq("artwork_id", id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const checkFavorite = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("artwork_id", id)
      .eq("user_id", user.id)
      .single();

    setIsFavorited(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Please login to favorite artworks");
      navigate("/auth");
      return;
    }

    if (isFavorited) {
      await supabase.from("favorites").delete().eq("artwork_id", id).eq("user_id", user.id);
      setIsFavorited(false);
      toast.success("Removed from favorites");
    } else {
      await supabase.from("favorites").insert({ artwork_id: id, user_id: user.id });
      setIsFavorited(true);
      toast.success("Added to favorites");
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast.error("Please login to comment");
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      artwork_id: id,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      toast.error("Failed to post comment");
    } else {
      setNewComment("");
      loadComments();
      toast.success("Comment posted");
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error("Please login to purchase");
      navigate("/auth");
      return;
    }
    navigate(`/checkout/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xl">Artwork not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Artwork Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Artwork Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{artwork.title}</h1>
              <p className="text-xl text-secondary font-bold">${artwork.price}</p>
            </div>

            {artwork.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{artwork.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {artwork.category && (
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{artwork.category}</p>
                </div>
              )}
              {artwork.medium && (
                <div>
                  <p className="text-muted-foreground">Medium</p>
                  <p className="font-medium">{artwork.medium}</p>
                </div>
              )}
              {artwork.dimensions && (
                <div>
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{artwork.dimensions}</p>
                </div>
              )}
              {artwork.year_created && (
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="font-medium">{artwork.year_created}</p>
                </div>
              )}
            </div>

            {/* Artist Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={artwork.profiles?.profile_photo} />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{artwork.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {artwork.profiles?.user_type}
                    </p>
                  </div>
                </div>
                {artwork.profiles?.bio && (
                  <p className="text-sm text-muted-foreground">{artwork.profiles.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button className="flex-1" size="lg" onClick={handleBuyNow}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant={isFavorited ? "secondary" : "outline"}
                  size="lg"
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                </Button>
              </div>
              {user && user.id !== artwork.artist_id && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowChat(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with Seller
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>

          {user && (
            <div className="mb-6">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleComment}>Post Comment</Button>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={comment.profiles?.profile_photo} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">
                        {comment.profiles?.full_name || "Unknown User"}
                      </p>
                      <p className="text-muted-foreground">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {showChat && user && artwork && (
        <ChatWindow
          artworkId={artwork.id}
          sellerId={artwork.artist_id}
          sellerName={artwork.profiles?.full_name || "Artist"}
          sellerPhoto={artwork.profiles?.profile_photo}
          currentUserId={user.id}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
