import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadFavorites(session.user.id);
    });
  }, [navigate]);

  const loadFavorites = async (userId: string) => {
    const { data } = await supabase
      .from("favorites")
      .select(`
        *,
        artworks:artwork_id (
          *,
          profiles:artist_id (full_name)
        )
      `)
      .eq("user_id", userId);
    setFavorites(data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Favorites</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <Card
              key={fav.id}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate(`/artwork/${fav.artworks.id}`)}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={fav.artworks.image_url}
                  alt={fav.artworks.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{fav.artworks.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {fav.artworks.profiles?.full_name}
                </p>
                <p className="text-lg font-bold text-secondary mt-2">${fav.artworks.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
