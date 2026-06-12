   - implement the admin component in this perspective -> admin-facing interface accessible only to users with the admin role . in that need product management, order visibility, and a summary analytics view. 


   - make the main section only scrollable and keep the  toolbar as sticky at top, also leave some space footer space

   - also make the footer as sticky at  the bottom

   - Remove the parent scroll , and make only the table scrollable. the header of the table should be sticky in the respective position of the table

   - fix the null issue where i select all from category filter after  i slect amy other filter
      (after this the issue remains the same, so changed the default value from null to EmptyString).

    - fix the same parent scroll issue in the orders tab also

- Create centralized AdminStore (signal-based) for products, orders, and shared state

- Create admin routes as lazy child routes (/admin/analytics, /admin/products, /admin/orders)

- Refactor admin component as shell with router-outlet

- Extract analytics into dedicated lazy component

- Extract products into dedicated lazy component (paginated, sortable, debounced search, add/edit/delete, stock stream)

- Build orders page with paginated/sortable table, status filter, date range filter

- Add order detail side-panel with inline status update dropdown

- Wire shared state so status updates reflect immediately


- Create shared product store/service for shop + admin
- Build ProductCardComponent (OnPush, live stock badge)
- Build product catalogue grid with pagination, skeletons, empty/error states
- Add filter bar: category chips, price range slider, in-stock toggle
- Wire filters to URL query params for deep-linking
- Add product detail view (modal/panel) 



- Persists across navigation via a shared CartService (signal-based). A cart icon in the nav shows the live item count. Cart contents survive a page refresh (use localStorage).

- Show cart items with quantity adjustment and removal. Compute the running subtotal, tax (configurable rate), and grand total using a pure pipe. An empty cart redirects to /shop.

 
-  On submit, POST the order to the mock endpoint. Show an optimistic success state immediately, then reconcile or roll back on failure. On confirmed success, clear the cart and navigate to a /shop/order-confirmation/:id page

 
