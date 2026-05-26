# How to run:

npm run dev
or
pnpm dev

# Stack choice:

I have experience in web MERN + Next.js. Its easier for me to do in Next.js. And It is easy to test out web app using live link instead have to installing diff. dependecies and tools to run others stuff.

# One real edge case:

In the parse-line.ts, parseLogLine function(line# 184) is handling multiple cases. Blank lines skipping, fault lines handling and json lines. If they are not there all lines are treated as simple log line.

# AI usage:

Majority components are written by AI. But I have added few checks to parse leading whitespaces, skipping multi-lines etc.

# Honest gap:

There are few gaps in this app. If I get to work on this. I have following points to add in this project.

# File Uploader

1. I will add a text area to support copy paste the logs.
2. I will add a support to upload json file.
3. I will add an option to preview the uploaded file.
4. I will add a support to handle relatively large files through batching to avoid blocking main thread.

# Analyzer:

1. I will add a helper functions to parse multiline log.
2. I will add an option to support to extract the body/query/params from log.
3. I will add a support for microservices logs like parse the logs of which service, its a external comm. or internal within microservices, data parser, error extraction for better readability, monitoring etc.
