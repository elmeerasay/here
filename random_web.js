require("dotenv").config();
const readline = require("readline");
const chalk = require("chalk");
const crypto = require("crypto");
const axios = require("axios");

const API_KEY = process.env.HERENOW_API_KEY;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(q) {
  return new Promise(res => rl.question(q, res));
}

function banner() {
  console.clear();
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║              HERE.NOW BULK-GENERATOR PRO MAX 🚀              ║
║         (Memory-Only, Sorted Price & Paywall UI)             ║
╠══════════════════════════════════════════════════════════════╣
║          🔥 BUILT WITH PASSION BY: FULLOCHZ 🔥               ║
╚══════════════════════════════════════════════════════════════╝
`));
}

function getRandomPrice(input) {
  if (!input.includes("-")) return input;
  const [min, max] = input.split("-").map(Number);
  let rawRandom = Math.floor(Math.random() * (max - min + 1)) + min;
  let finalPrice;
  if (rawRandom < 100) finalPrice = Math.round(rawRandom / 10) * 10;
  else if (rawRandom < 500) finalPrice = Math.round(rawRandom / 50) * 50;
  else if (rawRandom < 2000) finalPrice = Math.round(rawRandom / 100) * 100;
  else finalPrice = Math.round(rawRandom / 500) * 500; 
  if (finalPrice > max) finalPrice = max; 
  if (finalPrice < min) finalPrice = min;
  return (Math.random() > 0.9) ? max.toString() : finalPrice.toString();
}

async function generateInstantHTML(iteration, price) {
    let success = false;
    let dataUrl = "";
    while (!success) {
        try {
            process.stdout.write(chalk.gray(`   [${iteration}] 📥 Downloading Image... `));
            const randomSeed = crypto.randomBytes(4).toString('hex');
            const response = await axios.get(`https://picsum.photos/1920/1080?random=${randomSeed}`, { 
                responseType: 'arraybuffer',
                timeout: 30000 
            });
            if (response.data && response.data.length > 80000) { 
                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                dataUrl = `data:image/jpeg;base64,${base64Image}`;
                success = true;
                process.stdout.write(chalk.green(`OK! (${(response.data.length / 1024).toFixed(0)} KB)\n`));
            } else { process.stdout.write(chalk.yellow(`RETRY... `)); }
        } catch (e) {
            process.stdout.write(chalk.red(`RETRY... `));
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    const displayPrice = price ? `$${price}` : "Premium";
    
    // TEXT UPDATED: "This website is locked"
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Locked Content</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body, html { height: 100%; width: 100%; overflow: hidden; font-family: -apple-system, sans-serif; background: #000; } .bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${dataUrl}'); background-size: cover; background-position: center; filter: blur(25px); transform: scale(1.1); z-index: 1; } .paywall-container { position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; height: 100vh; background: rgba(0,0,0,0.5); } .paywall-card { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 50px 30px; border-radius: 30px; text-align: center; color: white; max-width: 380px; width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.5); } .icon { font-size: 60px; margin-bottom: 20px; } h1 { font-size: 26px; font-weight: 700; margin-bottom: 10px; } p { opacity: 0.7; font-size: 15px; margin-bottom: 30px; line-height: 1.6; } .price-tag { font-size: 36px; font-weight: 800; margin-bottom: 25px; color: #00d4ff; } .btn { background: #fff; color: #000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; transition: 0.3s; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; } .btn:hover { transform: scale(1.05); background: #00d4ff; } </style></head><body><div class="bg"></div><div class="paywall-container"><div class="paywall-card"><div class="icon">🔒</div><h1>Exclusive Content</h1><p>This website is locked. Please complete the payment to unlock full access.</p><div class="price-tag">${displayPrice}</div><a href="#" class="btn" onclick="alert('Please use the platform payment button.')">Unlock Now</a></div></div></body></html>`;
}

async function fetchSites() {
  const res = await fetch("https://here.now/api/v1/publishes", { headers: { Authorization: `Bearer ${API_KEY}` } });
  const data = await res.json();
  return data.publishes || [];
}

async function fetchPrice(slug) {
  try {
    const res = await fetch(`https://here.now/api/pay/${slug}/session`, { method: "POST", headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: crypto.randomUUID() }) });
    const data = await res.json();
    return data.amount ? parseInt(data.amount) : 0;
  } catch { return -1; }
}

async function manageSites() {
  banner();
  console.log(chalk.gray("⏳ Fetching sites from server..."));
  const rawSites = await fetchSites();
  if (rawSites.length === 0) {
      console.log(chalk.red("❌ No sites found. Your factory is currently empty."));
      await ask(chalk.yellow("\nTekan Enter untuk kembali ke menu utama..."));
      return;
  }
  console.log(chalk.gray(`⏳ Loading & Sorting prices for ${rawSites.length} sites...`));
  let sitesWithPrice = [];
  const batchSize = 20;
  for (let i = 0; i < rawSites.length; i += batchSize) {
      const batch = rawSites.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(async (site) => {
          const price = await fetchPrice(site.slug);
          return { ...site, rawPrice: price };
      }));
      sitesWithPrice.push(...batchResults);
      process.stdout.write(chalk.gray(`\r   Progress: ${Math.min(i + batchSize, rawSites.length)}/${rawSites.length}`));
  }
  sitesWithPrice.sort((a, b) => a.rawPrice - b.rawPrice);
  banner();
  console.log(chalk.cyan("\n📂 YOUR REGISTERED WEBSITES (Sorted by Price):\n"));
  sitesWithPrice.forEach((site, i) => {
    const num = `[${i + 1}]`.padEnd(6);
    const slug = chalk.green(site.slug.padEnd(25));
    const priceTxt = site.rawPrice === 0 ? "FREE" : `$${site.rawPrice}`;
    console.log(`${num} ${slug} | 💰 ${chalk.white(priceTxt.padEnd(8))} | ${chalk.gray(site.siteUrl)}`);
  });

  const idxUpdate = sitesWithPrice.length + 1;
  const idxDeleteSome = sitesWithPrice.length + 2;
  const idxDeleteAll = sitesWithPrice.length + 3;
  const idxBack = sitesWithPrice.length + 4;
  const idxExit = sitesWithPrice.length + 5;

  console.log(chalk.yellow(`\n${idxUpdate}. ubah harga`));
  console.log(chalk.yellow(`${idxDeleteSome}. hapus beberapa`));
  console.log(chalk.red(`${idxDeleteAll}. hapus semua website`));
  console.log(chalk.magenta(`${idxBack}. kembali`));
  console.log(chalk.red(`${idxExit}. exit`));

  const choice = await ask(`\nPilih nomor: `);
  if (choice == idxExit) process.exit();
  if (choice == idxBack || choice == "0" || !choice) return;

  if (choice == idxUpdate) {
      const input = await ask(chalk.blue("\nMasukkan nomor web (contoh: 1,3,5): "));
      const newPrice = await ask(chalk.yellow("Harga baru USD: "));
      const targets = input.split(/[\s,]+/).map(n => parseInt(n) - 1).filter(i => i >= 0 && i < sitesWithPrice.length);
      for (const i of targets) {
          process.stdout.write(chalk.gray(`   Updating ${sitesWithPrice[i].slug}... `));
          await fetch(`https://here.now/api/v1/publish/${sitesWithPrice[i].slug}/metadata`, { method: "PATCH", headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ price: { amount: newPrice, currency: "USD" } }) });
          console.log(chalk.green("OK!"));
      }
  } else if (choice == idxDeleteSome) {
      const input = await ask(chalk.red("\nNomor web yang mau dihapus: "));
      const targets = input.split(/[\s,]+/).map(n => parseInt(n) - 1).filter(i => i >= 0 && i < sitesWithPrice.length);
      for (const i of targets) {
          process.stdout.write(chalk.red(`   🗑️ Menghapus ${sitesWithPrice[i].slug}... `));
          await fetch(`https://here.now/api/v1/publish/${sitesWithPrice[i].slug}`, { method: "DELETE", headers: { Authorization: `Bearer ${API_KEY}` } });
          console.log(chalk.green("DONE!"));
      }
  } else if (choice == idxDeleteAll) {
    const confirm = await ask(chalk.red(`⚠️ Konfirmasi: Hapus total ${sitesWithPrice.length} website? (y/n): `));
    if (confirm.toLowerCase() === 'y') {
      await Promise.all(sitesWithPrice.map(site => fetch(`https://here.now/api/v1/publish/${site.slug}`, { method: "DELETE", headers: { Authorization: `Bearer ${API_KEY}` } })));
      console.log(chalk.green("\n✅ Akun bersih!"));
    }
  }
  await ask("\nTekan Enter untuk kembali...");
}

async function createSiteBulk() {
  banner();
  const countInput = await ask(chalk.magenta("❓ Mau bikin berapa website? : "));
  const count = parseInt(countInput) || 1;
  const priceInput = await ask(chalk.yellow("   Masukkan harga (Contoh: 50 atau 10-1000): "));

  console.log(chalk.blue(`\n🚀 Memulai produksi ${count} website (Memory Mode)...\n`));
  for (let i = 1; i <= count; i++) {
    console.log(chalk.yellow(`➔ Memproses Website Ke-${i}:`));
    try {
      let finalPrice = getRandomPrice(priceInput);
      const htmlData = await generateInstantHTML(i, finalPrice);
      const htmlBuffer = Buffer.from(htmlData, 'utf-8');

      const create = await fetch("https://here.now/api/v1/publish", { 
        method: "POST", 
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ files: [{ path: "index.html", size: htmlBuffer.length, contentType: "text/html; charset=utf-8" }] }) 
      });
      const data = await create.json();
      
      await fetch(data.upload.uploads[0].url, { method: "PUT", headers: { "Content-Type": "text/html" }, body: htmlBuffer });
      await fetch(data.upload.finalizeUrl, { method: "POST", headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ versionId: data.upload.versionId }) });
      await fetch(`https://here.now/api/v1/publish/${data.slug}/metadata`, { method: "PATCH", headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ price: { amount: finalPrice, currency: "USD" } }) });

      console.log(chalk.green(`   ✨ Sukses! 💰 Harga: $${finalPrice} | 🌐 https://${data.slug}.here.now\n`));
    } catch (e) { 
        console.log(chalk.red(`   ❌ Error: ${e.message}\n`)); 
    }
  }
  await ask("\nTekan Enter untuk kembali...");
}

async function menu() {
  while (true) {
    banner();
    console.log(chalk.yellow("1. ✨ Bulk Create (Detailed Logs & Paywall)"));
    console.log(chalk.yellow("2. 📂 List & Manage Website (Sorted Price)"));
    console.log(chalk.red("0. 🚪 Exit\n"));
    const choice = await ask("Pilih menu: ");
    if (choice === "1") await createSiteBulk();
    else if (choice === "2") await manageSites();
    else if (choice === "0") break;
  }
  rl.close();
}

if (!API_KEY) { console.log("❌ API KEY error."); process.exit(); }
menu();