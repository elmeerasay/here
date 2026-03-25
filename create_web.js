require("dotenv").config();
const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");
const crypto = require("crypto");

const API_KEY = process.env.HERENOW_API_KEY;

// ================= UI =================
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
╔════════════════════════════════════╗
║   HERE.NOW CLI PRO MAX 🚀         ║
╚════════════════════════════════════╝
`));
}

// ================= FETCH =================
async function fetchSites() {
  const res = await fetch("https://here.now/api/v1/publishes", {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });

  const data = await res.json();
  return data.publishes || [];
}

// ================= FETCH PRICE (REAL) =================
async function fetchPrice(slug) {
  try {
    const res = await fetch(`https://here.now/api/pay/${slug}/session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: crypto.randomUUID()
      })
    });

    const data = await res.json();

    if (data.amount) {
      return `$${data.amount}`;
    }

    return "FREE";
  } catch (err) {
    return "ERROR";
  }
}

// ================= CREATE =================
async function createSite() {
  const usePrice = await ask("Kasih harga? (y/n): ");
  let price = null;

  if (usePrice.toLowerCase() === "y") {
    price = await ask("Masukkan harga USD: ");
  }

  const file = fs.readFileSync("index.html");

  console.log(chalk.yellow("\n🚀 Creating site..."));

  const create = await fetch("https://here.now/api/v1/publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      files: [
        {
          path: "index.html",
          size: file.length,
          contentType: "text/html; charset=utf-8"
        }
      ]
    })
  });

  const data = await create.json();

  const slug = data.slug;
  const uploadUrl = data.upload.uploads[0].url;
  const finalizeUrl = data.upload.finalizeUrl;
  const versionId = data.upload.versionId;

  console.log(chalk.green("✅ Slug:"), slug);

  // upload
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/html" },
    body: file
  });

  // finalize
  await fetch(finalizeUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ versionId })
  });

  // set price
  if (price) {
    await fetch(`https://here.now/api/v1/publish/${slug}/metadata`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        price: { amount: price, currency: "USD" }
      })
    });
  }

  console.log(chalk.green("\n🎉 DONE!"));
  console.log(chalk.blue(`🌐 https://${slug}.here.now`));

  await ask("\nKetik angka apapun untuk kembali...");
}

// ================= LIST =================
async function listSites(showPrompt = true) {
  console.log(chalk.gray("⏳ Loading harga dari server..."));

  const sites = await fetchSites();

  if (sites.length === 0) {
    console.log(chalk.red("❌ Tidak ada website"));
    return [];
  }

  console.log(chalk.cyan("\n📂 DAFTAR WEBSITE:\n"));

  for (let i = 0; i < sites.length; i++) {
    const price = await fetchPrice(sites[i].slug);

    console.log(
      chalk.yellow(`[${i + 1}]`) +
      " " +
      chalk.green(sites[i].slug) +
      " | 💰 " + price +
      " | " +
      chalk.gray(sites[i].siteUrl)
    );
  }

  console.log(chalk.magenta("\n0. Kembali"));

  if (showPrompt) {
    await ask("\nPilih angka untuk lanjut...");
  }

  return sites;
}

// ================= UPDATE PRICE =================
async function updatePrice() {
  const sites = await listSites(false);

  const input = await ask("\nPilih nomor website (0 untuk kembali): ");

  if (input === "0") return;

  const index = parseInt(input) - 1;
  const site = sites[index];

  if (!site) {
    console.log(chalk.red("❌ Tidak valid"));
    return;
  }

  const newPrice = await ask("Masukkan harga baru USD: ");

  await fetch(`https://here.now/api/v1/publish/${site.slug}/metadata`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      price: {
        amount: newPrice,
        currency: "USD"
      }
    })
  });

  console.log(chalk.green("✅ Harga berhasil diupdate"));
}

// ================= DELETE =================
async function deleteSite() {
  const sites = await listSites(false);

  const input = await ask("\nPilih nomor website (0 untuk kembali): ");

  if (input === "0") return;

  const index = parseInt(input) - 1;
  const site = sites[index];

  if (!site) {
    console.log(chalk.red("❌ Tidak valid"));
    return;
  }

  await fetch(`https://here.now/api/v1/publish/${site.slug}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${API_KEY}`
    }
  });

  console.log(chalk.green("✅ Website dihapus"));
}

// ================= MENU =================
async function menu() {
  while (true) {
    banner();

    console.log(chalk.yellow("1. Buat Website"));
    console.log(chalk.yellow("2. List Website (real price)"));
    console.log(chalk.yellow("3. Ubah Harga"));
    console.log(chalk.yellow("4. Hapus Website"));
    console.log(chalk.yellow("0. Exit\n"));

    const choice = await ask("Pilih menu: ");

    if (choice === "1") await createSite();
    else if (choice === "2") await listSites();
    else if (choice === "3") await updatePrice();
    else if (choice === "4") await deleteSite();
    else if (choice === "0") break;
  }

  rl.close();
}

// ================= START =================
if (!API_KEY) {
  console.log("❌ API KEY belum diset di .env");
  process.exit();
}

menu();