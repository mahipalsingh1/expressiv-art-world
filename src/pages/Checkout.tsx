import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadArtwork();
    });
  }, [id, navigate]);

  const loadArtwork = async () => {
    const { data } = await supabase
      .from("artworks")
      .select(`
        *,
        profiles:artist_id (id, full_name)
      `)
      .eq("id", id)
      .single();

    if (data) {
      setArtwork(data);
    } else {
      toast.error("Artwork not found");
      navigate("/gallery");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !artwork) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from("orders").insert({
        buyer_id: user.id,
        seller_id: artwork.artist_id,
        artwork_id: artwork.id,
        total_amount: artwork.price,
        payment_method: "Cash on Delivery",
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_country: formData.country,
        shipping_postal_code: formData.postalCode,
        status: "pending",
      });

      if (error) throw error;

      // Mark artwork as sold
      await supabase
        .from("artworks")
        .update({ is_sold: true })
        .eq("id", artwork.id);

      toast.success("Order placed successfully with Cash on Delivery!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  if (!artwork) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={artwork.image_url}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{artwork.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {artwork.profiles?.full_name}
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>${artwork.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Payment Method: Cash on Delivery
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Details */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postalCode: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? "Placing Order..." : "Place Order (Cash on Delivery)"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
