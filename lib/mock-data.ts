export type CheckoutOutcome = "allowed" | "blocked" | "pending_admin_review" | "pending_document_upload" | "ready_for_payment" | "payment_failed" | "paid";
export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";
export const products = [
 { id:"p1", slug:"guardian-rescue-alarm", name:"Guardian Rescue Alarm", category:"personal_safety_alarm", price:29, status:"active", restricted:false, stock:144, sku:"GRA-100", description:"Compact audible alarm for emergency signaling without aggressive claims." },
 { id:"p2", slug:"securewalk-training-kit", name:"SecureWalk Training Kit", category:"training", price:49, status:"active", restricted:false, stock:61, sku:"SWT-200", description:"Scenario cards and safety planning tools for responsible preparedness." },
 { id:"p3", slug:"arcguard-knuckle-stun-device", name:"ArcGuard Restricted Knuckle Stun Device", category:"knuckle_stun_device", price:119, status:"restricted_review", restricted:true, stock:18, sku:"AKS-310", description:"Restricted self-defense device. Availability depends on destination laws and buyer verification." },
 { id:"p4", slug:"civicshield-safety-light", name:"FryBeam Safety Light", category:"visibility", price:39, status:"active", restricted:false, stock:92, sku:"CSL-400", description:"High-visibility light and whistle bundle for commuting and travel." }
] as const;
export const cart = { items: [{ productId:"p3", qty:1 }, { productId:"p1", qty:1 }], subtotal:148, shipping:12, tax:11.84, total:171.84 };
export const checkoutCases: Record<CheckoutOutcome, { title:string; reason:string; state:string; orderId:string; payment:string; verification:string; fulfillment:string; docs:string[] }> = {
 allowed:{title:"Allowed after automated checks",reason:"Destination and product category are covered by an allow rule.",state:"AZ",orderId:"SF-1001",payment:"not_collected",verification:"passed",fulfillment:"not_started",docs:[]},
 blocked:{title:"Blocked by destination rule",reason:"This item is not available for your destination. Payment is unavailable.",state:"NY",orderId:"SF-1002",payment:"not_collected",verification:"blocked",fulfillment:"blocked",docs:[]},
 pending_admin_review:{title:"Pending admin review",reason:"County-level rule needs manual review before payment.",state:"IL",orderId:"SF-1003",payment:"not_collected",verification:"manual_review",fulfillment:"on_hold",docs:[]},
 pending_document_upload:{title:"Document upload required",reason:"State rule requires government ID plus proof of residence before payment.",state:"CA",orderId:"SF-1004",payment:"not_collected",verification:"documents_required",fulfillment:"on_hold",docs:["Government ID","Proof of residence"]},
 ready_for_payment:{title:"Ready for payment",reason:"Compliance and document review are approved. Continue to payment.",state:"TX",orderId:"SF-1005",payment:"ready",verification:"approved",fulfillment:"awaiting_payment",docs:[]},
 payment_failed:{title:"Payment was not completed",reason:"Payment review was not completed. Eligibility remains approved; retry payment.",state:"TX",orderId:"SF-1006",payment:"failed",verification:"approved",fulfillment:"awaiting_payment",docs:[]},
 paid:{title:"Paid and queued for fulfillment",reason:"Payment review succeeded and fulfillment can begin.",state:"TX",orderId:"SF-1007",payment:"paid",verification:"approved",fulfillment:"processing",docs:[]}
};
export const orders = Object.values(checkoutCases).map((o,i)=>({ ...o, id:o.orderId, customer:["Maya Chen","Jordan Lee","Avery Smith","Sam Rivera","Taylor Brooks","Chris Morgan","Pat Nguyen"][i], total:171.84 }));
export const adminUsers = [{name:"Felix Lin",role:"Owner",status:"active"},{name:"Riley Reviewer",role:"Compliance reviewer",status:"active"},{name:"Morgan Ops",role:"Operations",status:"active"}];
export const complianceRules = [
 {id:"R-001", state:"TX", category:"knuckle_stun_device", outcome:"allowed", coverage:"covered", note:"Age + address verification required."},
 {id:"R-002", state:"NY", category:"knuckle_stun_device", outcome:"blocked", coverage:"covered", note:"Blocked by restricted device rule."},
 {id:"R-003", state:"CA", category:"knuckle_stun_device", outcome:"allowed", coverage:"covered", note:"No destination block configured in local mock data."},
 {id:"R-004", state:"IL", category:"knuckle_stun_device", outcome:"blocked", coverage:"covered", note:"Blocked by local mock destination rule."},
 {id:"R-005", state:"OR", category:"knuckle_stun_device", outcome:"missing", coverage:"missing", note:"Owner launch blocker."}
];
export const verificationTemplates = [{id:"VT-1", name:"Restricted device attestation", category:"knuckle_stun_device", requirements:["18+ attestation","Destination address confirmation","Restricted-product acknowledgement"]},{id:"VT-2",name:"Document review package",category:"knuckle_stun_device",requirements:["Government ID","Proof of residence","Reviewer note"]}];
export const documentReviews = [{id:"DOC-91", order:"SF-1004", customer:"Sam Rivera", type:"Government ID", status:"pending", age:"2h"},{id:"DOC-92",order:"SF-1004",customer:"Sam Rivera",type:"Proof of residence",status:"pending",age:"2h"}];
export const launchGates = [{name:"Restricted product catalog",state:"ready",ownerOnly:false},{name:"Rule coverage for launch states",state:"blocked",ownerOnly:true},{name:"Mock payment settings",state:"ready",ownerOnly:true},{name:"Legal policies published",state:"enabled",ownerOnly:false},{name:"Backup/export configured",state:"blocked",ownerOnly:true}];
export const auditLogs = [{time:"2026-06-10 14:22 UTC", actor:"Riley Reviewer", action:"Rejected document", target:"DOC-88", note:"Address mismatch noted."},{time:"2026-06-10 16:04 UTC", actor:"Felix Lin", action:"Updated launch gate", target:"Rule coverage", note:"OR remains missing."},{time:"2026-06-11 09:10 UTC", actor:"Morgan Ops", action:"Adjusted stock", target:"AKS-310", note:"Cycle count correction +2."}];
export const states = ["AZ","CA","IL","NY","OR","TX"];
