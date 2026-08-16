MANA360 FREE CMS patch

Upload these 3 items to the root of the existing GitHub repository:
- wrangler.jsonc
- worker.js
- admin/index.html

After Cloudflare deploys this Worker, add two encrypted secrets in the Worker settings:
GITHUB_TOKEN = your GitHub fine-grained token (Contents: Read and write)
ADMIN_PASSWORD = a strong password you choose for the article admin

Optional variables:
GITHUB_REPO = gullipallivinodkumar-source/mana360
GITHUB_BRANCH = main

Admin URL: https://www.mana360.in/admin/
