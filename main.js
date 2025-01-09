const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const resultDisplay = document.getElementById("resultDisplay");
const dropZone = document.getElementById("dropZone");

let items = [];


// ルーレット描画関数
function drawRoulette(startAngle, startButtonDisabled, stopButtonDisabled, dropZonePointerEvents, resultDisplayText) {
  const radius = canvas.width / 2;
  const arcSize = (2 * Math.PI) / items.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  items.forEach((item, index) => {
    const angle = startAngle + index * arcSize;

    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, angle, angle + arcSize);
    ctx.fillStyle = item.color;
    ctx.fill();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#322d32";
    ctx.font = "16px Arial";
    ctx.fillText(item.name, radius - 6, 6);
    ctx.textBaseline = "middle";



    ctx.restore();
  });

  startButton.disabled = startButtonDisabled;
  stopButton.disabled = stopButtonDisabled;
  dropZone.style.pointerEvents = dropZonePointerEvents;
  resultDisplay.textContent = resultDisplayText;
}



// スタートボタンの動作
startButton.addEventListener("click", () => { 
  spinRoulette(false, 0, 0.5, 0.99, 0.001, null);
});



// ルーレットを回す
function spinRoulette(stopSpin, startAngle, spinSpeed, decrement, minSpeed, spinTimeout) {
  if (spinSpeed < minSpeed) {
    clearTimeout(spinTimeout);
    const selectedIndex = Math.floor(((startAngle % (2 * Math.PI)) / (2 * Math.PI)) * items.length);
    const winner = items[(items.length - 1 - selectedIndex + items.length) % items.length].name;
    
    drawRoulette(startAngle, false, true, "auto", `${winner}さんコメントお願いします！`);
    return;
  }

  // ストップボタンの動作
  stopButton.addEventListener("click", () => {
    stopSpin = true;
  });

  if (stopSpin) {
    spinSpeed *= decrement;
  }

  startAngle += spinSpeed;
  drawRoulette(startAngle, true, false, "none", "");
  spinTimeout = requestAnimationFrame(() => 
    spinRoulette(stopSpin, startAngle, spinSpeed, decrement, minSpeed, spinTimeout));
}



// ドラッグ＆ドロップイベント
window.addEventListener("dragover", (event) => {
  event.preventDefault();
});

window.addEventListener("drop", (event) => {
  event.preventDefault();
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.style.borderColor = "";

  CSVReader(event);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.style.borderColor = "#fbfbff";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.borderColor = "";
});



// CSVの読み取り
function CSVReader(event) {
  const file = event.dataTransfer.files[0];
  if (!file || (file.type !== "text/csv" && file.type !== "application/vnd.ms-excel")) {
    alert("CSVファイルをドラッグ＆ドロップしてください。");
    return;
  }

  items = [];
  const reader = new FileReader();

  // ファイルの読み取り
  reader.onload = (e) => {

    const csvRows = e.target.result
      .replace(/\r\n/g, "\n") // 改行コードを統一
      .split("\n") // 行ごとに分割
      .map((line) => line.trim()) // 空白を削除

    const header = csvRows.shift(); // ヘッダー行を削除

    if (!header.includes("氏名") || !header.includes("ユーザーの操作")) {
      alert("正しいフォーマットのCSVファイルを使用してください。");
      return;
    }

    const userActions = {}; // 各氏名の操作回数を記録
    const excludedNames = []; // 除外された名前を記録するリスト

    csvRows.forEach((row) => {
      const [name, action] = row.split(/,|\t/); // カンマまたはタブで分割
      if (!name || !action) return;

      const cleanName = name.split(" (")[0]; // 「（」の前の名前を抽出

      if (excludedNames.includes(cleanName)) return;

      // 「除外」の処理
      if (action === "除外") {
        // 除外リストに追加（重複を避ける）
        if (!excludedNames.includes(cleanName)) {
          excludedNames.push(cleanName);
        }
        // すでに存在する場合は削除
        if (userActions[cleanName]) {
          delete userActions[cleanName];
        }
        return;
      }

      if (!userActions[cleanName]) {
        userActions[cleanName] = { joined: 0, left: 0 };
      }

      if (action === "参加済み") userActions[cleanName].joined += 1;
      if (action === "退出") userActions[cleanName].left += 1;
    });

    // 条件を満たす氏名をitemsに追加
    items = Object.keys(userActions)
      .filter((name) => userActions[name].joined !== userActions[name].left) // 参加済みと退出の数が異なる場合
      .map((name) => ({ name: name, color: getRandomColor() })); // 名前とランダム色を格納

    // 更新されたitemsでルーレット描画
    drawRoulette(0, false, true, "auto", "");
  };

  reader.readAsText(file, "utf-8");
}



// ランダムに色を選ぶ関数。同じ色が連続しないようにし、使用済みの色を保持する
const availableColors = [
  '#f2a8a5', '#fdb7a0', '#fecd98', 
  '#f8e38d', '#d4dc8b', '#99d6ac', 
  '#7dcabf', '#77b8c8', '#82a5c5', 
  '#9c9ec5', '#b597b9', '#d89dae'];

function getRandomColor() {
  while (true) {
    let ramdomColor = availableColors[Math.floor(Math.random() * availableColors.length)];

    if (items.length === 0) {
      return ramdomColor;
    }

    if (ramdomColor !== items[items.length - 1].color) {
      return ramdomColor;
    }
  }
}
