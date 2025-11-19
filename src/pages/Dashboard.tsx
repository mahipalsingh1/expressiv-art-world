import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    medium: "",
    dimensions: "",
    yearCreated: "",
    imageUrl: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
      loadArtworks(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const loadArtworks = async (userId: string) => {
    const { data } = await supabase
      .from("artworks")
      .select("*")
      .eq("artist_id", userId)
      .order("created_at", { ascending: false });
    setArtworks(data || []);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError, data } = await supabase.storage
        .from("artworks")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("artworks")
        .getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.imageUrl) {
      toast.error("Please upload an image");
      return;
    }

    const artworkData: any = {
      artist_id: user.id,
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      image_url: formData.imageUrl,
      category: formData.category,
      medium: formData.medium || null,
      dimensions: formData.dimensions || null,
      year_created: formData.yearCreated ? parseInt(formData.yearCreated) : null,
      status: "approved" as const,
    };

    try {
      if (editingArtwork) {
        const { error } = await supabase
          .from("artworks")
          .update(artworkData)
          .eq("id", editingArtwork.id);
        if (error) throw error;
        toast.success("Artwork updated");
      } else {
        const { error } = await supabase.from("artworks").insert(artworkData);
        if (error) throw error;
        toast.success("Artwork uploaded successfully!");
      }

      setIsDialogOpen(false);
      resetForm();
      loadArtworks(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (artwork: any) => {
    setEditingArtwork(artwork);
    setFormData({
      title: artwork.title,
      description: artwork.description || "",
      price: artwork.price.toString(),
      category: artwork.category,
      medium: artwork.medium || "",
      dimensions: artwork.dimensions || "",
      yearCreated: artwork.year_created?.toString() || "",
      imageUrl: artwork.image_url,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return;

    const { error } = await supabase.from("artworks").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Artwork deleted");
      loadArtworks(user.id);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "",
      medium: "",
      dimensions: "",
      yearCreated: "",
      imageUrl: "",
    });
    setEditingArtwork(null);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  if (profile.user_type !== "seller") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-xl mb-4">This dashboard is only for sellers</p>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Artworks</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Artwork
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingArtwork ? "Edit Artwork" : "Upload New Artwork"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Artwork Image *</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    {formData.imageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, imageUrl: "" })}
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Abstract">Abstract</SelectItem>
                        <SelectItem value="Portrait">Portrait</SelectItem>
                        <SelectItem value="Landscape">Landscape</SelectItem>
                        <SelectItem value="Modern">Modern</SelectItem>
                        <SelectItem value="Photography">Photography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medium">Medium</Label>
                    <Input
                      id="medium"
                      placeholder="Oil on canvas, Digital, etc."
                      value={formData.medium}
                      onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      placeholder="24x36 inches"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year Created</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2024"
                      value={formData.yearCreated}
                      onChange={(e) => setFormData({ ...formData, yearCreated: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={uploading}>
                  {editingArtwork ? "Update Artwork" : "Upload Artwork"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <Card key={artwork.id} className="overflow-hidden group">
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img
                  src={artwork.image_url}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleEdit(artwork)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(artwork.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{artwork.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">₹{artwork.price}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">
                    {artwork.status}
                  </span>
                  {artwork.is_sold && (
                    <span className="text-xs text-destructive font-semibold">SOLD</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {artworks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-xl text-muted-foreground mb-4">No artworks yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Upload your first artwork to start selling
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
