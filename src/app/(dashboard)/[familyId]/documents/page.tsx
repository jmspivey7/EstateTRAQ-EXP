import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { formatDate, cn } from "@/lib/utils";
import {
  FileText,
  File,
  Scale,
  DollarSign,
  Home,
  Shield,
  Receipt,
  FolderOpen,
  Search,
  Upload,
  Filter,
} from "lucide-react";

interface DocumentsPageProps {
  params: { familyId: string };
}

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  legal: { label: "Legal", icon: Scale, color: "bg-purple-500/10 text-purple-400" },
  financial: { label: "Financial", icon: DollarSign, color: "bg-blue-500/10 text-blue-400" },
  property: { label: "Property", icon: Home, color: "bg-green-500/10 text-green-400" },
  insurance: { label: "Insurance", icon: Shield, color: "bg-cyan-500/10 text-cyan-400" },
  tax: { label: "Tax", icon: Receipt, color: "bg-amber-500/10 text-amber-400" },
  estate_planning: { label: "Estate Planning", icon: Scale, color: "bg-indigo-500/10 text-indigo-400" },
  correspondence: { label: "Correspondence", icon: FileText, color: "bg-slate-500/10 text-slate-400" },
  other: { label: "Other", icon: File, color: "bg-gray-500/10 text-gray-400" },
};

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const familyId = params.familyId;

  const allDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.familyId, familyId))
    .orderBy(desc(documents.createdAt));

  // Group by category
  const grouped: Record<string, typeof allDocuments> = {};
  for (const doc of allDocuments) {
    const cat = doc.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(doc);
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div>
      <Header title="Document Vault" subtitle="Securely store and organize family documents" />

      <div className="p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-9 pr-4 py-2 text-sm bg-accent/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
                readOnly
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm border border-border hover:bg-accent transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Category Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            const count = grouped[key]?.length || 0;
            return (
              <div
                key={key}
                className={cn(
                  "rounded-lg border border-border p-3 text-center space-y-1",
                  count > 0 ? "hover:border-primary/30 cursor-pointer" : "opacity-50"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg mx-auto flex items-center justify-center", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium">{config.label}</p>
                <p className="text-lg font-semibold">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Documents by Category */}
        {Object.entries(grouped).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, docs]) => {
              const config = categoryConfig[category] || categoryConfig.other;
              const Icon = config.icon;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center", config.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-sm font-semibold">{config.label}</h2>
                    <span className="text-xs text-muted-foreground">({docs.length})</span>
                  </div>

                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="divide-y divide-border">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {doc.subcategory && <span>{doc.subcategory}</span>}
                                {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                                <span>Uploaded {formatDate(doc.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          {doc.aiTags && doc.aiTags.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-4">
                              {doc.aiTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-1">No documents uploaded yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Upload wills, trusts, deeds, insurance policies, and other important family
              documents to keep them organized and accessible.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
