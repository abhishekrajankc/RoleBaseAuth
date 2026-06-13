# RoleBaseAuth

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


### 🛠️ How to Run a Local Production Performance Audit

Local development builds (`ng serve`) include heavy debugging tools and unminified bundles that distort performance metrics. To accurately test production optimizations (like minified scripts, tree-shaking, and critical inlined CSS) locally on Lighthouse, use this staging flow:

 
# 1. Compile the optimized production bundles
```bash
ng build --configuration production
```
# 2. Navigate into the compiled distribution folder
```bash
cd dist/RoleBaseAuth/browser
```

# 3. Serve the static assets using a fallback proxy to support SPA routing links (e.g., /shop)
```bash
npx http-server -p 8080 -P http://127.0.0.1:8080?
```
