# Print Shop Admin - Clean Install

If you get `Cannot find module 'node-releases/data/processed/envs.json'`, run a **standalone install**:

```powershell
# 1. Go to this app (NOT the root)
cd "e:\OneDrive\Desktop\NEX 2.0\apps\print-shop-admin"

# 2. Delete local node_modules and lock file
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 3. Also delete ROOT node_modules (they conflict)
Remove-Item -Recurse -Force "..\..\node_modules" -ErrorAction SilentlyContinue

# 4. Install HERE only (standalone, no workspace hoisting)
npm install

# 5. Run
npm run dev
```

This gives the app its own dependency tree with `node-releases@2.0.27` correctly installed.
