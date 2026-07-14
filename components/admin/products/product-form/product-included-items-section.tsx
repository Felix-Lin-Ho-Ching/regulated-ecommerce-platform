import { useState } from "react";
import { maxProductIncludedRows } from "@/lib/products/validation";
import type { AdminProductDetail } from "@/lib/products/service";
import { Field } from "./form-controls";
import { nextProductFormKey, RepeatableList } from "./repeatable-list";
import type { IncludedItem } from "./product-form-types";
export function ProductIncludedItemsSection({ product }: { product?: AdminProductDetail }) { const [included,setIncluded]=useState<IncludedItem[]>(()=>(product?.includedItems??[]).map((row,i)=>({key:`included-${i}`,...row}))); return <><input type="hidden" name="includedSubmitted" value="1"/><RepeatableList title="Included items" help="Items included in the box. Example: Charging cable." addLabel="+ Add included item" max={maxProductIncludedRows} items={included} setItems={setIncluded} emptyLabel="No included items yet." makeItem={()=>({key:nextProductFormKey("included"),quantity:1,editing:true,isNew:true})} summary={(item)=>item.label||"Included item"}>{(item,index)=><><Field label="Label" name={`includedLabel${index}`} defaultValue={item.label}/><Field label="Description" name={`includedDescription${index}`} defaultValue={item.description}/><Field label="Quantity" name={`includedQuantity${index}`} defaultValue={item.quantity ?? 1} type="number"/><input type="hidden" name={`includedSortOrder${index}`} value={index}/></>}</RepeatableList></>; }
