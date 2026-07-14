import { useState } from "react";
import { maxProductSpecRows } from "@/lib/products/validation";
import type { AdminProductDetail } from "@/lib/products/service";
import { Field } from "./form-controls";
import { nextProductFormKey, RepeatableList } from "./repeatable-list";
import type { SpecItem } from "./product-form-types";
export function ProductSpecificationsSection({ product }: { product?: AdminProductDetail }) { const [specs,setSpecs]=useState<SpecItem[]>(()=>(product?.specs??[]).map((row,i)=>({key:`spec-${i}`,...row}))); return <><input type="hidden" name="specsSubmitted" value="1"/><RepeatableList title="Specifications" help="Technical product details. Example: Label Battery, Value Rechargeable lithium battery." addLabel="+ Add specification" max={maxProductSpecRows} items={specs} setItems={setSpecs} emptyLabel="No specifications yet." makeItem={()=>({key:nextProductFormKey("spec"),editing:true,isNew:true})} summary={(item)=>item.label||"Specification"}>{(item,index)=><><Field label="Group" name={`specGroup${index}`} defaultValue={item.group}/><Field label="Label" name={`specLabel${index}`} defaultValue={item.label}/><Field label="Value" name={`specValue${index}`} defaultValue={item.value}/><input type="hidden" name={`specSortOrder${index}`} value={index}/></>}</RepeatableList></>; }
