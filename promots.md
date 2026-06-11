   - implement the admin component in this perspective -> admin-facing interface accessible only to users with the admin role . in that need product management, order visibility, and a summary analytics view. 


   - make the main section only scrollable and keep the  toolbar as sticky at top, also leave some space footer space

   - also make the footer as sticky at  the bottom

   - Remove the parent scroll , and make only the table scrollable. the header of the table should be sticky in the respective position of the table

   - fix the null issue where i select all from category filter after  i slect amy other filter
      (after this the issue remains the same, so changed the default value from null to EmptyString).

    - fix the same parent scroll issue in the orders tab also