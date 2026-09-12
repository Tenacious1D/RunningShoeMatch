import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/data/formatters";
import { listAdminShoes } from "@/lib/data/admin";

export default async function AdminShoesPage() {
  const shoes = await listAdminShoes();

  return (
    <main>
      <AdminPageHeader title="Shoes" description="A read-only catalog view. Editing controls will be added after mutation authorization and audit requirements are defined." />
      <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3">Brand</th>
              <th scope="col" className="px-5 py-3">Shoe</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3">Visibility</th>
              <th scope="col" className="px-5 py-3">Specification review</th>
              <th scope="col" className="px-5 py-3 text-right">Metrics</th>
              <th scope="col" className="px-5 py-3 text-right">Retailer links</th>
              <th scope="col" className="px-5 py-3">MSRP</th>
              <th scope="col" className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shoes.map((shoe) => (
              <tr key={shoe.id}>
                <td className="px-5 py-4 text-muted-foreground">{shoe.brandName}</td>
                <th scope="row" className="px-5 py-4 font-semibold">{shoe.modelName}</th>
                <td className="px-5 py-4"><Badge variant={shoe.status === "active" ? "success" : "neutral"}>{shoe.status}</Badge></td>
                <td className="px-5 py-4"><Badge variant={shoe.isPublic ? "success" : "neutral"}>{shoe.isPublic ? "Public" : "Non-public"}</Badge></td>
                <td className="px-5 py-4"><Badge variant="outline">{shoe.specificationReview.replaceAll("_", " ")}</Badge></td>
                <td className="px-5 py-4 text-right tabular-nums">{shoe.metricCount}</td>
                <td className="px-5 py-4 text-right tabular-nums">{shoe.retailerLinkCount}</td>
                <td className="px-5 py-4">{shoe.msrp === null ? "Not set" : formatCurrency(shoe.msrp, shoe.currency)}</td>
                <td className="px-5 py-4 text-right"><Badge variant="outline">Edit later</Badge></td>
              </tr>
            ))}
            {!shoes.length ? <tr><td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">No shoes found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
