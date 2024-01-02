const keys = require("./credentials.json");
const ssjson = require("./ssjson.json");
const ssaddress = ssjson.BCAKDT;
const urlweb = ssjson.ADMKDT;
const delaynya = ssjson.delay_ * 1000;

const myHeaders = new Headers();
// const secret = require('./secret.json');
// const username = secret.username;
// const password = secret.password;
const { google } = require("googleapis");
const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  "https://www.googleapis.com/auth/spreadsheets",
]);
const gsapi = google.sheets({ version: "v4", auth: client });
// myHeaders.set('Authorization', 'Basic ' + btoa(username + ":" + password));

const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function getAdminData() {
  const adminDataURL = "http://127.0.0.1:5500/test.html"; // Change this URL to the path of your test.html file
  const response = await fetch(adminDataURL);
  const html = await response.text();

  // Use cheerio to parse the HTML and extract data
  const $ = cheerio.load(html);

  const adminData = [];

  // Example: Extract data from elements with class 'admin-data'
  $(".admin-data").each((index, element) => {
    const idForm = $(element).data("id-form");
    const username = $(element).data("username");
    const namaRek = $(element).data("nama-rek");
    const noRek = $(element).data("no-rek");
    const nominal = $(element).data("nominal");

    adminData.push({
      a_cntg: idForm,
      a_name: username.toUpperCase(),
      a_fnme: namaRek
        .toUpperCase()
        .replace(/(.+?)\/\s?|[\d\n\s-\'\",\.]/g, "")
        .substring(0, 10),
      a_fnom: noRek.replace(/[^0-9]/g, ""),
      a_uang: Number(nominal.replace(/[,.]/g, "")),
    });
  });

  return adminData;
}
async function recur1() {
  let date = new Date();
  let hours__ = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  hours__ < 10 ? (hours__ = `0${hours__}`) : (hours__ = hours__);
  minutes < 10 ? (minutes = `0${minutes}`) : (minutes = minutes);
  seconds < 10 ? (seconds = `0${seconds}`) : (seconds = seconds);
  let timenow = `${hours__}:${minutes}:${seconds}`;
  console.log(`\n⏰${timenow}`);
  if (
    (Number(hours__) == 23 && Number(minutes) >= 30) ||
    (Number(hours__) == 00 && Number(minutes) < 25)
  ) {
    console.log("JAM MATI");
    await delay(5 * 60000);
    return;
  }

  //// PHASE 1 ---> GOOGLE SHEESH
  let wks_ss = [];
  let wks_ss_res = await gsapi.spreadsheets.get({ spreadsheetId: ssaddress });
  let hsl = wks_ss_res.data.sheets;
  for (let i = 0; i < hsl.length; i++) {
    wks_ss.push(hsl[i].properties.title); //get yg sheet names
  }

  for (let z = 0; z < wks_ss.length; z++) {
    const opt = {
      spreadsheetId: ssaddress,
      range: `${wks_ss[z]}!A:F`,
    };
    await delay(ssjson.delay_per_bank * 1000);
    getssdata = await gsapi.spreadsheets.values.get(opt);
    getssdata = getssdata.data.values;

    if (getssdata == null || getssdata[3] == null) continue;
    var geturlss = [[`${getssdata[3][3]}`]];
    if (!geturlss[0][0].match(/\//g)) continue;
    geturlss = geturlss[0][0].replace(/[^0-9]/g, "");
    //get wks data
    let wks_data = [];
    for (let i = 0; i < getssdata.length; i++) {
      if (getssdata == null || getssdata[i].length < 5) continue;
      let w_nme;
      let wks_nama = getssdata[i][3];
      let wks_nominal = Number(getssdata[i][4].replace(/[.,]/g, ""));
      if (
        getssdata[i][0] != "" ||
        getssdata[i][1] != "" ||
        getssdata[i][2] != "" ||
        wks_nama == "" ||
        wks_nominal < 25000
      )
        continue;
      if (wks_nama.match(/[0-9]/g)) {
        w_nme = wks_nama;
      } else {
        w_nme = wks_nama
          .replace(/EDC\s?|ECHANNEL\s?|[\W\d]/g, "")
          .toUpperCase()
          .substring(0, 10);
      }
      wks_data.push({
        w_dari: w_nme,
        w_uang: wks_nominal,
        w_indx: i + 1,
      });
    }

    //get admin data
    const adminDataURL = "http://127.0.0.1:5500/test.html"; // Change this URL to the path of your test.html file
    var qwer = await fetch(adminDataURL);
    var tyui = await qwer.json();
    var opas = tyui.data;
    let adm_data = [];
    let len__ = opas.length;
    for (let a = 0; a < len__; a++) {
      adm_data.push({
        a_cntg: opas[a].id_form,
        a_name: opas[a].username.toUpperCase(),
        a_fnme: opas[a].nama_rek
          .replace(/(.+?)\/\s?|[\d\n\s-\'\",\.]/g, "")
          .toUpperCase()
          .substring(0, 10),
        a_fnom: opas[a].no_rek.replace(/[^0-9]/g, ""),
        a_uang: Number(opas[a].nominal.replace(/[,.]/g, "")),
      });
    }

    //// PHASE 3 ---> CROSSCHECK
    adm_data.sort((a, b) =>
      a.a_uang > b.a_uang ? -1 : b.a_uang > a.a_uang ? 1 : 0
    );
    wks_data.sort((a, b) =>
      a.w_uang > b.w_uang ? -1 : b.w_uang > a.w_uang ? 1 : 0
    );
    let adm_len = adm_data.length;

    let sortir = [];
    let ygsm = [];
    for (let a = 0; a < adm_len; a++) {
      let wks_len = wks_data.length;
      for (let w = 0; w < wks_len; w++) {
        let adata = adm_data[a];
        let cekls = adata["a_cntg"];
        let a__id = adata["a_name"];
        let anama = adata["a_fnme"];
        let anomi = adata["a_fnom"];
        let auang = adata["a_uang"];

        let wdata = wks_data[w];
        let wnama = wdata["w_dari"];
        let wuang = wdata["w_uang"];
        let windx = wdata["w_indx"];
        if (wnama == "") continue;
        if ((anama == wnama || anomi == wnama) && auang == wuang) {
          ygsm.push({
            c_bx: cekls,
            c_id: a__id,
            c_ix: windx,
          });
          wks_data.splice(w, 1, {
            w_dari: "",
            w_uang: "",
            w_indx: "",
          });
          break;
        }
      }
    }
    ygsm.sort((a, b) => (a.c_ix > b.c_ix ? -1 : b.c_ix > a.c_ix ? 1 : 0));
    if (ygsm[0] == null) continue;
    let kirim = [];
    for (let h = 0; h < ygsm.length; h++) {
      kirim.push(ygsm[h].c_bx);
    }
    console.log(`${wks_ss[z]}:`);
    console.log(ygsm);
    await tempelid();
    //// PHASE 4 ---> TEMPEL ID
    async function tempelid() {
      let iter = 0;
      if (ygsm[0] != null) {
        while (iter < ygsm[0].c_ix) {
          sortir.push([]);
          iter++;
        }
        for (let i = 0; i < ygsm.length; i++) {
          sortir.splice(ygsm[i].c_ix - 1, 1, [, `⏱️${timenow}`, ygsm[i].c_id]);
        }
      }
      const updt = {
        spreadsheetId: ssaddress,
        range: `${wks_ss[z]}!A1`, //because my for loops and etc the index starts from 0
        valueInputOption: "USER_ENTERED",
        resource: { values: sortir },
      };
      await gsapi.spreadsheets.values.update(updt);
      await autoapp();
    }

    //// PHASE 5 ---> CEKLIS
    async function autoapp() {
      await fetch(`${urlweb}wsapi/ApproveDepo`, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(kirim),
      });
    }
  }
  recur2();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function recur2() {
  console.log(`delay ${delaynya / 1000} detik ya ko`);
  setTimeout(recur1, delaynya);
}
recur2();
