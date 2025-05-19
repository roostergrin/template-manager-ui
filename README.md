# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

## Repository Overview

This section provides an overview for newcomers, summarizing how the codebase is organized and the approach taken throughout the project.

### Summary

The repository is a React + TypeScript web application created with Vite. The README describes it as a minimal setup for Vite with React and ESLint rules.

The main entry point is `src/main.tsx`, which bootstraps React, wraps the app in a React Query provider, and renders the `App` component. `src/App.tsx` is the central component. It stores the selected site template and questionnaire data in state, renders the questionnaire form, sitemap builder, and a site provisioning section, and wraps everything in `GithubRepoProvider` for GitHub context state.

Key directories:

- **src/context** – contains `GithubRepoContext.tsx` which stores GitHub owner/repo names for later actions
- **src/services** – wrappers around API endpoints (e.g., `generateContentService`, `createGithubRepoFromTemplateService`, `provisionSiteService`) that use Axios to contact a backend server.
- **src/hooks** – custom hooks that call those services with React Query (e.g., `useGenerateContent`, `useGenerateSitemap`, `useFillForm`) and manage local state such as pages and view controls.
- **src/modelGroups.ts** – defines template "model groups" for sites (e.g., Stinson, Bay Area Orthodontics) including metadata, default sitemaps, demo URLs, and a flag to enable/disable them.
- **src/components** – React components for UI:
  - `QuestionnaireForm` loads and edits questionnaire data, with optional domain scraping via `fillForm` service.
  - `Sitemap` and its subcomponents (`PageCard`, `SitemapSection`, etc.) allow users to build a sitemap interactively. View toggles and layout controls are managed with hooks.
  - `GenerateContentProgress` orchestrates generating page content & global data, creating or updating GitHub repos, and displays progress and status.
  - `ProvisionSiteSection` lets the user provision an S3/CloudFront site from the generated content.
  - Additional selectors (e.g., `SiteSelector`, `DefaultTemplateSelector`) help choose a template.

Supporting data such as example sitemaps live in `exported_sitemaps/`, referenced by `modelGroups.ts`.

### Approach & Key Concepts

1. **React with Hooks and Context**  
   The app uses function components with hooks for state. Global information like GitHub repository settings is shared via `GithubRepoContext`.
2. **React Query for API Calls**  
   Backend requests (e.g., generating content, creating a repo) are handled via React Query's `useMutation`/`useQuery`. Service functions in `src/services/` implement the API interactions.
3. **Local Storage for Generated Sitemaps**  
   `usePages` stores and retrieves generated sitemaps from browser local storage under `generatedSitemaps`.
4. **Template/Model Groups**  
   `src/modelGroups.ts` aggregates default sitemaps and metadata about available site templates. The UI (via `SiteSelector` and `DefaultTemplateSelector`) reads from this configuration to present template choices to the user.
5. **Content Generation Workflow**  
   `GenerateContentProgress` coordinates:
   - requesting page and global content from the backend,
   - optionally creating a new GitHub repo from a template,
   - updating repository data files,
   - offering download links for the generated JSON.
   This component displays step-by-step status via `GenerateContentSection`, `CreateRepoSection`, `GithubUpdateSection`, and `StatusSection`.
6. **Site Provisioning**  
   After content is generated and the repository is prepared, users can provision a site (S3 + CloudFront) through `ProvisionSiteSection`, which calls `useProvisionSite` to hit a backend provisioning API.

### Navigating the Code

- Start with `src/App.tsx` to see high-level component composition.
- Look into `src/components/Sitemap` for the sitemap UI logic.
- Explore `src/services` to understand each backend endpoint.
- Review `src/hooks` for data fetching patterns and how local storage or state is managed.
- `src/modelGroups.ts` and `exported_sitemaps/` show how site templates and default sitemaps are organized.

Overall, the codebase is a front-end tool for generating site content and repos for various templates. It uses React Query for asynchronous operations, a set of forms for user input, and local storage to keep generated data.

