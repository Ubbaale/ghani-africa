import { useState } from "react";
import { Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LanguageSelector } from "@/components/language-selector";
import type { UserProfile } from "@shared/schema";
import {
  ArrowLeft,
  Search,
  CheckCircle,
  Star,
  MapPin,
  Package,
  Users,
  Shield,
  Award,
  Store,
  ExternalLink,
} from "lucide-react";

const AFRICAN_COUNTRIES = [
  "All Countries", "Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", "Ethiopia", 
  "Tanzania", "Uganda", "Morocco", "Algeria", "Cameroon", "Ivory Coast", "Senegal"
];

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");

  const { data: suppliers, isLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/suppliers/verified"],
  });

  const filteredSuppliers = suppliers?.filter((supplier) => {
    const matchesSearch = !searchQuery || 
      supplier.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = countryFilter === "All Countries" || 
      supplier.country === countryFilter;
    
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <GradientLogo size="sm" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Verified Suppliers
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Trusted African Suppliers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with verified manufacturers and traders across Africa. 
              All suppliers have been vetted for quality, reliability, and professionalism.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-suppliers"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger data-testid="select-country">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {AFRICAN_COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{suppliers?.length || 0}+</p>
                  <p className="text-sm text-muted-foreground">Verified Suppliers</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <MapPin className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">54</p>
                  <p className="text-sm text-muted-foreground">African Countries</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Package className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">10K+</p>
                  <p className="text-sm text-muted-foreground">Products Available</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="hover-elevate" data-testid={`card-supplier-${supplier.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {(supplier.businessName || "S")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">
                            {supplier.businessName || "Supplier"}
                          </h3>
                          {supplier.verificationLevel === "verified" && (
                            <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {supplier.city ? `${supplier.city}, ` : ""}{supplier.country || "Africa"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {supplier.role === "manufacturer" ? "Manufacturer / Supplier" : "Trader / Business"}
                        </p>
                      </div>
                    </div>
                    
                    {supplier.businessDescription && (
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                        {supplier.businessDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Link href={`/store/${supplier.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`button-view-store-${supplier.id}`}>
                          <Store className="h-4 w-4" />
                          View Store
                        </Button>
                      </Link>
                      <Link href={`/browse?seller=${supplier.id}`}>
                        <Button size="sm" className="gap-2" data-testid={`button-view-products-${supplier.id}`}>
                          <Package className="h-4 w-4" />
                          Products
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Suppliers Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setCountryFilter("All Countries");
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-r from-primary/10 to-amber-500/10">
            <CardContent className="p-8 text-center space-y-4">
              <Award className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-2xl font-bold">Become a Verified Supplier</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Join our network of trusted suppliers. Get verified to build buyer trust, 
                reduce commission rates, and access premium features.
              </p>
              <Link href="/dashboard/subscription">
                <Button size="lg" data-testid="button-become-supplier">
                  Get Verified Today
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
