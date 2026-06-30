import { saveProductCategoryAction, archiveProductCategoryAction, deleteProductCategoryAction } from "@/lib/product-categories/actions";
import { getProductCategories } from "@/lib/product-categories/service";
import { AdminDataTable, AdminShell, SectionHeader, StatusBadge } from "@/components/ui";

export default async function CategoriesAdminPage() {
  const categories = await getProductCategories();
  return <AdminShell title="Categories" currentPath="/admin/categories">
    <SectionHeader eyebrow="Storefront taxonomy" title="Product categories">OWNER/ADMIN can add, edit, archive, and remove storefront categories without changing compliance classes.</SectionHeader>
    <form action={saveProductCategoryAction} className="card mb-6 grid gap-3 p-4 md:grid-cols-5">
      <input className="input" name="name" placeholder="Name" required />
      <input className="input" name="slug" placeholder="slug" />
      <input className="input" name="description" placeholder="Description" />
      <input className="input" name="sortOrder" type="number" placeholder="Sort" defaultValue={0} />
      <select className="input" name="status" defaultValue="ACTIVE"><option>ACTIVE</option><option>INACTIVE</option><option>ARCHIVED</option></select>
      <button className="btn btn-primary md:w-fit" type="submit">Create category</button>
    </form>
    <AdminDataTable columns={["Name", "Slug", "Status", "Products", "Edit", "Archive/Delete"]} rows={categories.map((category) => [
      category.name,
      category.slug,
      <StatusBadge key={`${category.id}-status`} tone={category.status === "ACTIVE" ? "success" : category.status === "ARCHIVED" ? "danger" : "warning"}>{category.status}</StatusBadge>,
      String(category.productCount),
      <form key={`${category.id}-edit`} action={saveProductCategoryAction} className="grid gap-2">
        <input type="hidden" name="id" value={category.id} />
        <input className="input" name="name" defaultValue={category.name} />
        <input className="input" name="slug" defaultValue={category.slug} />
        <input className="input" name="description" defaultValue={category.description} />
        <input className="input" name="sortOrder" type="number" defaultValue={category.sortOrder} />
        <select className="input" name="status" defaultValue={category.status}><option>ACTIVE</option><option>INACTIVE</option><option>ARCHIVED</option></select>
        <button className="btn btn-secondary" type="submit">Save</button>
      </form>,
      <div key={`${category.id}-actions`} className="grid gap-2">
        <form action={archiveProductCategoryAction}><input type="hidden" name="id" value={category.id} /><select className="input" name="reassignToCategoryId"><option value="">No reassignment</option>{categories.filter((item) => item.id !== category.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="btn btn-secondary mt-2" type="submit">Archive</button></form>
        <form action={deleteProductCategoryAction}><input type="hidden" name="id" value={category.id} /><select className="input" name="reassignToCategoryId"><option value="">Prevent if products exist</option>{categories.filter((item) => item.id !== category.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="btn btn-danger mt-2" type="submit">Delete</button></form>
      </div>
    ])} />
  </AdminShell>;
}
