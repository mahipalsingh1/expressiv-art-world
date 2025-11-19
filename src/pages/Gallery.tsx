import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Gallery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [artworks, setArtworks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtworks();
  }, [searchQuery, selectedCategory, sortBy]);

  const loadArtworks = async () => {
    setLoading(true);
    let query = supabase
      .from("artworks")
      .select(`
        *,
        profiles:artist_id (full_name, profile_photo)
      `)
      .eq("status", "approved")
      .eq("is_sold", false);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "price_low") {
      query = query.order("price", { ascending: true });
    } else if (sortBy === "price_high") {
      query = query.order("price", { ascending: false });
    }

    const { data } = await query;
    setArtworks(data || []);
    setLoading(false);
  };

  const categories = ["all", "Abstract", "Portrait", "Landscape", "Modern", "Photography"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Art Gallery</h1>

        {/* Filters */}
        <div className="mb-8 grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search artworks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Artworks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No artworks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((artwork) => (
              <Card
                key={artwork.id}
                className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all"
                onClick={() => navigate(`/artwork/${artwork.id}`)}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{artwork.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    by {artwork.profiles?.full_name || "Unknown Artist"}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-secondary">₹{artwork.price}</p>
                    <span className="text-xs text-muted-foreground">{artwork.category}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
