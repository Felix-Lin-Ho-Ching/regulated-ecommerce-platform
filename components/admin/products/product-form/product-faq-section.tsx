import { useState } from "react";
import { maxProductFAQRows } from "@/lib/products/validation";
import type { AdminProductDetail } from "@/lib/products/service";
import { Field } from "./form-controls";
import { nextProductFormKey, RepeatableList } from "./repeatable-list";
import type { FaqItem } from "./product-form-types";
export function ProductFaqSection({ product }: { product?: AdminProductDetail }) { const [faqs,setFaqs]=useState<FaqItem[]>(()=>(product?.faqs??[]).map((row,i)=>({key:`faq-${i}`,...row}))); return <><input type="hidden" name="faqsSubmitted" value="1"/><RepeatableList title="FAQs" help="Questions customers may ask before buying." addLabel="+ Add FAQ" max={maxProductFAQRows} items={faqs} setItems={setFaqs} emptyLabel="No FAQs yet." makeItem={()=>({key:nextProductFormKey("faq"),editing:true,isNew:true})} summary={(item)=>item.question||"FAQ"}>{(item,index)=><><Field label="Question" name={`faqQuestion${index}`} defaultValue={item.question}/><Field label="Answer" name={`faqAnswer${index}`} defaultValue={item.answer}/><input type="hidden" name={`faqSortOrder${index}`} value={index}/></>}</RepeatableList></>; }
