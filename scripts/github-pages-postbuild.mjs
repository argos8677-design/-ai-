import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "dist", "client");
const indexPath = join(outDir, "index.html");
const redirectScript = `<script type="text/javascript">(function(l){if(l.search[1]==="/"){var decoded=l.search.slice(1).split("&").map(function(s){return s.replace(/~and~/g,"&")}).join("?");window.history.replaceState(null,null,l.pathname.slice(0,-1)+decoded+l.hash)}}(window.location))</script>`;

let index = readFileSync(indexPath, "utf8");
if (!index.includes("l.search[1]===\"/\"")) {
  index = index.replace("<head>", `<head>${redirectScript}`);
  writeFileSync(indexPath, index);
}

copyFileSync(join(process.cwd(), "public", "404.html"), join(outDir, "404.html"));
writeFileSync(join(outDir, ".nojekyll"), "");
