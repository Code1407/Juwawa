#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

// PNG signature (8 bytes)
const PNG_SIG = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
// PNG IEND (12 bytes)
const PNG_IEND = Buffer.from([0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function parseArgs(argv) {
  // encrypt.js <webMobileDir> --key xxx --sig yyy --includeAllBundles true/false --exts png,PNG
  if (argv.length < 3) {
    die("Usage: node encrypt.js <webMobileDir> --key <key> --sig <sig> --includeAllBundles true|false --exts png,PNG");
  }
  const out = {
    webMobileDir: argv[2],
    key: "",
    sig: "",
    includeAllBundles: false,
    exts: "png",
  };

  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--key") out.key = argv[++i] || "";
    else if (a === "--sig") out.sig = argv[++i] || "";
    else if (a === "--includeAllBundles") {
      const v = (argv[++i] || "").toLowerCase();
      out.includeAllBundles = (v === "true" || v === "1" || v === "yes");
    } else if (a === "--exts") out.exts = argv[++i] || "png";
  }

  if (!out.key || !out.sig) die("[RES-ENC] missing --key or --sig");
  return out;
}

function isPngFileByHeader(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 8) return false;
  return buf.subarray(0, 8).equals(PNG_SIG);
}

function isAlreadyEncrypted(buf, sigBuf) {
  if (!Buffer.isBuffer(buf) || buf.length < sigBuf.length) return false;
  return buf.subarray(0, sigBuf.length).equals(sigBuf);
}

function preProcessPng(buf) {
  // remove png signature 8 bytes
  let body = buf.subarray(8);
  // remove iend 12 bytes if present
  if (body.length >= 12) {
    const tail = body.subarray(body.length - 12);
    if (tail.equals(PNG_IEND)) {
      body = body.subarray(0, body.length - 12);
    }
  }
  return body;
}

function xorEncryptBytes(dataBuf, keyStr) {
  const key = Buffer.from(keyStr, "utf8");
  if (!key.length) die("[RES-ENC] key length is 0");

  const out = Buffer.allocUnsafe(dataBuf.length);
  for (let i = 0; i < dataBuf.length; i++) {
    out[i] = dataBuf[i] ^ key[i % key.length];
  }
  return out;
}

function walk(dir, cb) {
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const full = path.join(dir, it);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const webMobileDir = path.resolve(args.webMobileDir);
  if (!fs.existsSync(webMobileDir)) die(`[RES-ENC] webMobileDir not found: ${webMobileDir}`);

  const sigBuf = Buffer.from(args.sig, "utf8");
  const exts = args.exts.split(",").map(s => s.trim()).filter(Boolean).map(s => s.startsWith(".") ? s.toLowerCase() : ("." + s.toLowerCase()));

  const targetDir = args.includeAllBundles
    ? path.join(webMobileDir, "assets")
    : path.join(webMobileDir, "assets", "main");

  if (!fs.existsSync(targetDir)) die(`[RES-ENC] targetDir not found: ${targetDir}`);

  console.log(`[RES-ENC] webMobileDir: ${webMobileDir}`);
  console.log(`[RES-ENC] targetDir  : ${targetDir}`);
  console.log(`[RES-ENC] includeAll : ${args.includeAllBundles}`);
  console.log(`[RES-ENC] exts       : ${exts.join(",")}`);
  console.log(`[RES-ENC] sigLen     : ${sigBuf.length}`);

  let total = 0;
  let encrypted = 0;
  let skipped = 0;

  walk(targetDir, (file) => {
    const ext = path.extname(file).toLowerCase();
    if (!exts.includes(ext)) return;

    total++;
    const buf = fs.readFileSync(file);

    // skip already encrypted
    if (isAlreadyEncrypted(buf, sigBuf)) {
      skipped++;
      return;
    }

    // only encrypt real png by header
    if (!isPngFileByHeader(buf)) {
      skipped++;
      return;
    }

    const body = preProcessPng(buf);
    const enc = xorEncryptBytes(body, args.key);
    const finalBuf = Buffer.concat([sigBuf, enc]);

    fs.writeFileSync(file, finalBuf);
    encrypted++;
    console.log(`[RES-ENC] Encrypted: ${file}`);
  });

  console.log(`[RES-ENC] Done. totalMatched=${total}, encrypted=${encrypted}, skipped=${skipped}`);
  process.exit(0);
}

main();