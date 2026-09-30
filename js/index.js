let musicData = [];

async function loadMusic() {
  try {
    const response = await fetch("./data/music.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    musicData = await response.json();

    if (!Array.isArray(musicData)) {
      throw new Error("music.json の形式が正しくありません");
    }

    console.log(`${musicData.length}曲を読み込みました`);

    updateFilters();
    applyFilters();

  } catch (error) {
    console.error(error);

    document.getElementById("results").innerHTML = `
      <p>曲データを読み込めませんでした。</p>
    `;
  }
}
