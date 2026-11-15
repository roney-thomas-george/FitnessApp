# PulseFit Pro

Full-stack RBAC Fitness & Nutrition Platform with Client, Trainer, and Admin dashboards.

## Publish on Public GitHub Pages

This repository includes a pre-configured GitHub Actions workflow (`.github/workflows/deploy-gh-pages.yml`) that automatically builds and publishes the dashboard to GitHub Pages.

### 1. Push the code to a GitHub repository
```bash
git init
git add .
git commit -m "Initial commit - PulseFit Pro"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

### 2. Enable GitHub Pages
1. Open your repository on GitHub.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. The workflow runs automatically on every push to `main` (or `master`), or can be triggered manually from the **Actions** tab.
5. Once complete, your public URL (`https://<YOUR_USERNAME>.github.io/<YOUR_REPO>/`) will appear in **Settings → Pages** and in the workflow summary.

### 3. Optional: Live Google Sign-In on GitHub Pages
- **Demo Mode** (Client / Trainer / Admin switchers and local storage persistence) works immediately on your public GitHub Pages URL without extra setup.
- To enable **Sign in with Google** on your live GitHub Pages URL, open **Firebase Console → Authentication → Settings → Authorized domains** and add `<YOUR_USERNAME>.github.io`.
