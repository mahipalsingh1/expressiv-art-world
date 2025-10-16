import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Package, MapPin, CreditCard } from "lucide-react";

export default function SellerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
    });
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    setProfile(data);
    
    if (data?.user_type === "seller") {
      loadOrders(userId);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !profile || profile.user_type !== "seller") return;

    const channel = supabase
      .channel("seller-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          loadOrders(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const loadOrders = async (userId: string) => {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        artworks (id, title, image_url),
        buyer:buyer_id (id, full_name)
      `)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "confirmed":
        return "bg-blue-500/10 text-blue-500";
      case "shipped":
        return "bg-purple-500/10 text-purple-500";
      case "delivered":
        return "bg-green-500/10 text-green-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-muted text-muted-foreground";
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

  if (!profile || profile.user_type !== "seller") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-xl mb-4">This page is only for sellers</p>
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
        <h1 className="text-4xl font-bold mb-8">Order Requests</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">No order requests yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-[200px_1fr] gap-6">
                    {order.artworks?.image_url && (
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={order.artworks.image_url}
                          alt={order.artworks.title}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/artwork/${order.artwork_id}`)}
                        />
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-xl mb-1">
                          {order.artworks?.title || "Unknown Artwork"}
                        </h3>
                        <p className="text-muted-foreground">
                          Buyer: {order.buyer?.full_name || "Unknown Buyer"}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">Delivery Address</p>
                              <p className="text-sm text-muted-foreground">
                                {order.shipping_address}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.shipping_city}, {order.shipping_state}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.shipping_country} - {order.shipping_postal_code}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <CreditCard className="w-5 h-5 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">Payment</p>
                              <p className="text-sm text-muted-foreground">
                                {order.payment_method}
                              </p>
                            </div>
                          </div>
                          <div className="pt-2">
                            <p className="text-2xl font-bold">₹{order.total_amount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
