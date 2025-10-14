import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-5xl font-bold mb-8">About ArtGallery</h1>
        <Card className="mb-8">
          <CardContent className="p-8 space-y-4">
            <p className="text-lg">
              ArtGallery is a modern online platform connecting talented artists with art lovers worldwide.
              We provide a secure, elegant space where creativity meets technology.
            </p>
            <p>
              Our mission is to democratize art by making it accessible to everyone while ensuring artists
              receive fair compensation for their work. Every artwork is carefully curated to maintain
              the highest quality standards.
            </p>
          </CardContent>
        </Card>
        <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
        <Card>
          <CardContent className="p-8">
            <p><strong>Email:</strong> contact@artgallery.com</p>
            <p><strong>Support:</strong> support@artgallery.com</p>
            <p><strong>Address:</strong> 123 Art Street, Creative City, CC 12345</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
