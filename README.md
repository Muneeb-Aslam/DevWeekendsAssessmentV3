# Log Analyzer

Upload a server log file and get a summary: parsed vs skipped lines, status codes, top endpoints, and slowest requests.

## Test live

1. Open [https://assessmentv3.vercel.app](https://assessmentv3.vercel.app)
2. Drag and drop a log file (or click to browse)
3. Click **Analyze log**
4. Review the results below the upload panel

## Run locally

**Requirements:** Node.js 20+

```bash
pnpm install
pnpm dev

```

Open [http://localhost:3000](http://localhost:3000) and upload a log file the same way as above.

## Sample log files

Included in [`sample-logs-files/`](sample-logs-files/):

| File                                    |
| --------------------------------------- |
| `00-manual-smoke-test.log`              |
| `01-standard-access.log`                |
| `02-mixed-timestamps.log`               |
| `03-durations-and-status-anomalies.log` |
| `04-json-mixed-format.log`              |
| `05-malformed-noise.log`                |
| `06-high-volume.log`                    |
| `07-all-use-cases-mixed.log`            |

**Accepted formats:** `.log`, `.txt`, `.json`, `.csv` — max **10MB**

## Generate new test logs (optional)

```bash
pnpm generate-log              # 5,000-line high-volume file
pnpm generate-log:all          # all use cases in one file
pnpm generate-log:large        # 20,000 lines
```
