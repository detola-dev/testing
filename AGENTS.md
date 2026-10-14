<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Orders are created only via the `createOrder` server function (server recomputes prices from the DB); never insert orders from the browser.
- Admin login goes through the `adminLogin` server function (username → internal email, rate-limited); admin rights come from `user_roles` + `has_role()` RLS, never client checks.
- Product media lives in the private `product-media` bucket; admin uploads store long-lived signed URLs in `products.media`.
