import { db } from "@/lib/db";
import { realEstate } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Home, MapPin, DollarSign, TrendingUp, Building2 } from "lucide-react";

interface RealEstatePageProps {
  params: { familyId: string };
}

export default async function RealEstatePage({ params }: RealEstatePageProps) {
  const familyId = params.familyId;

  const properties = await db
    .select()
    .from(realEstate)
    .where(eq(realEstate.familyId, familyId));

  const activeProperties = properties.filter((p) => !p.isSold);
  const soldProperties = properties.filter((p) => p.isSold);

  const totalValue = activeProperties.reduce(
    (sum, p) => sum + parseFloat(p.currentValue || "0"),
    0
  );
  const totalPurchasePrice = activeProperties.reduce(
    (sum, p) => sum + parseFloat(p.purchasePrice || "0"),
    0
  );
  const totalAppreciation = totalValue - totalPurchasePrice;
  const totalAcreage = activeProperties.reduce(
    (sum, p) => sum + parseFloat(p.acreage || "0"),
    0
  );

  const propertyTypeColors: Record<string, string> = {
    residential: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    vacation: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    ranch: "bg-green-500/10 text-green-400 border-green-500/20",
    commercial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    land: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    farm: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  };

  return (
    <div>
      <Header title="Real Estate" subtitle="Property portfolio and valuations" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Portfolio Value"
            value={formatCurrency(totalValue)}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            label="Total Appreciation"
            value={formatCurrency(totalAppreciation)}
            change={
              totalPurchasePrice > 0
                ? `${((totalAppreciation / totalPurchasePrice) * 100).toFixed(1)}% return`
                : undefined
            }
            changeType={totalAppreciation >= 0 ? "positive" : "negative"}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            label="Active Properties"
            value={String(activeProperties.length)}
            icon={<Home className="w-5 h-5" />}
          />
          <StatCard
            label="Total Acreage"
            value={totalAcreage > 0 ? `${totalAcreage.toLocaleString()} acres` : "N/A"}
            icon={<MapPin className="w-5 h-5" />}
          />
        </div>

        {/* Property Grid */}
        {activeProperties.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Active Properties</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeProperties.map((property) => {
                const value = parseFloat(property.currentValue || "0");
                const purchasePrice = parseFloat(property.purchasePrice || "0");
                const appreciation = value - purchasePrice;
                const appreciationPct =
                  purchasePrice > 0 ? (appreciation / purchasePrice) * 100 : 0;
                const colorClass =
                  propertyTypeColors[property.propertyType.toLowerCase()] ||
                  "bg-muted text-muted-foreground border-border";

                return (
                  <div
                    key={property.id}
                    className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    {/* Property Header */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-base font-semibold truncate">
                            {property.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {[property.city, property.state]
                                .filter(Boolean)
                                .join(", ") || property.address || "No address"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                            colorClass
                          )}
                        >
                          {property.propertyType}
                        </span>
                      </div>

                      {property.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {property.description}
                        </p>
                      )}
                    </div>

                    {/* Value Section */}
                    <div className="px-5 py-3 bg-muted/30 border-t border-border">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Current Value</p>
                          <p className="text-sm font-semibold">{formatCurrency(value)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Purchase Price</p>
                          <p className="text-sm font-medium text-muted-foreground">
                            {purchasePrice > 0 ? formatCurrency(purchasePrice) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Appreciation</p>
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              appreciation >= 0 ? "text-green-500" : "text-red-400"
                            )}
                          >
                            {appreciation >= 0 ? "+" : ""}
                            {formatCurrency(appreciation)}
                            <span className="text-xs ml-1 font-normal">
                              ({appreciationPct >= 0 ? "+" : ""}
                              {appreciationPct.toFixed(1)}%)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer details */}
                    <div className="px-5 py-2.5 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                      {property.acreage && parseFloat(property.acreage) > 0 && (
                        <span>{parseFloat(property.acreage).toLocaleString()} acres</span>
                      )}
                      {property.lastAppraisalDate && (
                        <span>Appraised {formatDate(property.lastAppraisalDate)}</span>
                      )}
                      {property.purchaseDate && (
                        <span>Purchased {formatDate(property.purchaseDate)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Home className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-1">No properties added yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add real estate properties to track valuations, appreciation, and manage your
              property portfolio.
            </p>
          </div>
        )}

        {/* Sold Properties */}
        {soldProperties.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-muted-foreground">Sold Properties</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {soldProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between px-5 py-3.5 opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <Home className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{property.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Sold {property.saleDate ? formatDate(property.saleDate) : ""}
                          {property.salePrice
                            ? ` for ${formatCurrency(property.salePrice)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
