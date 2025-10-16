import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Search, TrendingUp, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-gallery.jpg";

export default function Home() {
  const navigate = useNavigate();
  const [featuredArtworks, setFeaturedArtworks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFeaturedArtworks();
  }, []);

  const loadFeaturedArtworks = async () => {
    const { data } = await supabase
      .from("artworks")
      .select(`
        *,
        profiles:artist_id (full_name, profile_photo)
      `)
      .eq("status", "approved")
      .eq("is_sold", false)
      .order("created_at", { ascending: false })
      .limit(6);
    
    setFeaturedArtworks(data || []);
  };

  const handleSearch = () => {
    navigate(`/gallery?search=${encodeURIComponent(searchQuery)}`);
  };

  const categories = [
    { name: "Abstract" },
    { name: "Portrait" },
    { name: "Landscape" },
    { name: "Modern" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white animate-fade-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Discover Extraordinary Art
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Explore a curated collection of artworks from talented artists around the world. 
              Buy, sell, and celebrate creativity.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => navigate("/gallery")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Explore Gallery
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth?tab=signup")} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                Start Selling
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search artworks, artists, categories..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => navigate(`/gallery?category=${category.name}`)}
              >
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Artworks</h2>
            <Button variant="outline" onClick={() => navigate("/gallery")}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArtworks.map((artwork) => (
              <Card 
                key={artwork.id}
                className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all"
                onClick={() => navigate(`/artwork/${artwork.id}`)}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{artwork.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    by {artwork.profiles?.full_name || "Unknown Artist"}
                  </p>
                  <p className="text-lg font-bold text-secondary">₹{artwork.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose ArtGallery</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Curated Collection</h3>
              <p className="text-muted-foreground">
                Every artwork is carefully reviewed to ensure quality and authenticity
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Support Artists</h3>
              <p className="text-muted-foreground">
                Connect directly with talented artists and support their creative journey
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
              <p className="text-muted-foreground">
                Safe and secure payment processing with buyer protection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 ArtGallery. Where creativity meets technology.</p>
        </div>
      </footer>
    </div>
  );
}
