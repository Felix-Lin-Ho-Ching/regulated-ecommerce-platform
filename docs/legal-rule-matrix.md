# Legal Rule Matrix

This is a development rule matrix based on one e-commerce stun-gun seller reference: Self Defense Mall's stun-gun laws page.

Production launch still needs counsel review before these rules are used for live checkout, payment, or fulfillment decisions.

## Development stun-gun category

For this project, `knuckle_stun_device` is treated as the store's stun-gun product category, including `prod_knuckle`.

Current blocked states for the seeded development stun-gun category:

- DC
- HI
- MA

All other seeded states are `ALLOW` for this development stun-gun category. Missing rules must continue to fail closed in checkout; only explicit `ALLOW` rules should pass.
