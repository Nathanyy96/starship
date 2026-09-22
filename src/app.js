(function () {
  "use strict";

  function start() {
    var api = window.StarshipGacha;
    var data = window.StarshipGachaData;
    if (!api || !data) {
      throw new Error("抽卡核心尚未載入");
    }

    var storageKey = "starship-gacha-save-v1";
    var storage = {
      get: function () {
        try {
          var value = window.localStorage.getItem(storageKey);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          return null;
        }
      },
      set: function (value) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
          // 以檔案方式開啟或瀏覽器停用 localStorage 時仍可正常試抽。
        }
      }
    };

    var game;
    try {
      game = new api.GachaGame({ banners: data.banners, state: storage.get() || undefined });
    } catch (error) {
      game = new api.GachaGame({ banners: data.banners });
    }

    var selectedBannerId = data.banners[0].id;
    var bannerSelect = document.getElementById("banner-select");
    var results = document.getElementById("results");
    var message = document.getElementById("message");
    var exchangeButton = document.getElementById("exchange-featured");

    function byId(id) {
      return document.getElementById(id);
    }

    function escapeHtml(value) {
      return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function number(value) {
      return Number(value || 0).toLocaleString("zh-Hant-TW");
    }

    function bannerById(id) {
      return data.banners.find(function (banner) { return banner.id === id; });
    }

    // Keep the summon result cards on the same canonical portrait source as
    // character development and the design document.  Falling back to image
    // only preserves compatibility with legacy cards that have no portrait
    // wrapper yet.
    function characterPortraitSource(card) {
      return card && (card.portraitImage || card.image || card.backgroundImage) || "";
    }

    function showMessage(text, isError) {
      message.textContent = text;
      message.className = isError ? "message error" : "message";
    }

    function rewardText(reward) {
      var parts = [];
      if (reward.starSand) { parts.push("+" + reward.starSand + " 星砂"); }
      if (reward.starMarks) { parts.push("+" + reward.starMarks + " 星痕"); }
      if (reward.echoPowder) { parts.push("+" + reward.echoPowder + " 回響粉"); }
      return parts.join("、");
    }

    function cardMarkup(item) {
      var card = item.card;
      if (!card) {
        return "<article class=\"result-card resource-result\"><div class=\"card-art\"><div class=\"card-watermark\">回響</div><div class=\"resource-result-title\">一般回響</div><div class=\"resource-result-copy\">本格未取得角色</div></div><div class=\"result-meta\"><span>第 " + item.pityPullNumber + " 抽判定</span></div><div class=\"result-note\">獲得 " + escapeHtml(rewardText(item.resourceReward)) + "，不占用角色收集。</div></article>";
      }
      var badge = item.featured ? "精選" : (item.isHardPity ? "硬保底" : "");
      var duplicate = rewardText(item.duplicateReward);
      var tag = badge ? "<span class=\"result-tag\">" + badge + "</span>" : "";
      var duplicateLine = duplicate ? "<div class=\"duplicate-reward\">重複轉換：" + escapeHtml(duplicate) + "</div>" : "";
      var imageStyle = "--accent:" + escapeHtml(card.accent || "#8f7cff");
      var portrait = characterPortraitSource(card);
      if (portrait) {
        imageStyle += ";--card-image:url(" + escapeHtml(portrait) + ")";
      }
      return "<article class=\"result-card rarity-" + card.rarity + (item.featured ? " featured" : "") + "\">" +
        "<div class=\"card-art\" style=\"" + imageStyle + "\">" +
          "<div class=\"card-watermark\">星律</div>" +
          "<div class=\"card-element\">" + escapeHtml(card.element) + "</div>" +
          "<div class=\"card-stars\">" + "★".repeat(card.rarity) + "</div>" +
          "<div class=\"card-name\"><strong>" + escapeHtml(card.name) + "</strong><span>" + escapeHtml(card.romanizedName) + "</span></div>" +
        "</div>" +
        "<div class=\"result-meta\"><span>第 " + item.pityPullNumber + " 抽判定</span>" + tag + "</div>" +
        "<div class=\"result-note\">" + escapeHtml(card.note) + "</div>" + duplicateLine +
        "</article>";
    }

    function renderResults(outcome) {
      var summary = outcome.summary;
      results.innerHTML =
        "<div class=\"result-summary\"><strong>本次召集完成</strong><span>" + summary.total + " 格｜4★ " + summary.fourStar + "｜3★ " + summary.threeStar + "｜一般回響 " + summary.resource + "｜精選 " + summary.featured + "</span></div>" +
        "<div class=\"result-grid\">" + outcome.results.map(cardMarkup).join("") + "</div>";
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderCollection(state) {
      var container = byId("collection");
      var cards = data.activeCards;
      container.innerHTML = cards.map(function (card) {
        var copies = state.collection[card.id] || 0;
        return "<div class=\"collection-item " + (copies ? "owned" : "locked") + "\">" +
          "<span class=\"collection-rarity\">" + "★".repeat(card.rarity) + "</span>" +
          "<span class=\"collection-name\">" + escapeHtml(card.name) + " <small>" + escapeHtml(card.element) + "</small></span>" +
          "<span class=\"collection-count\">" + (copies ? "×" + copies : "未取得") + "</span>" +
        "</div>";
      }).join("");
      byId("collection-count").textContent = Object.keys(state.collection).filter(function (id) { return state.collection[id] > 0; }).length + " / " + cards.length;
    }

    function renderHistory(state) {
      var container = byId("history");
      var entries = state.history.slice().reverse().slice(0, 8);
      if (!entries.length) {
        container.innerHTML = "<div class=\"empty\">尚未有召集紀錄。</div>";
        return;
      }
      container.innerHTML = entries.map(function (entry) {
        var banner = bannerById(entry.bannerId);
        var title = banner ? banner.name : entry.bannerId;
        var payment = number(entry.cost || api.DEFAULT_RULES.singleCost) + " 星砂";
        return "<div class=\"history-row\"><span>" + escapeHtml(title) + "</span><span>" + entry.count + " 格｜4★ " + entry.summary.fourStar + "｜" + escapeHtml(payment) + "</span></div>";
      }).join("");
    }

    function render() {
      var state = game.getState();
      var banner = bannerById(selectedBannerId);
      var pity = game.getPityStatus(selectedBannerId);

      byId("star-sand").textContent = number(state.resources.starSand);
      byId("star-marks").textContent = number(state.resources.starMarks);
      byId("echo-powder").textContent = number(state.resources.echoPowder);
      byId("banner-description").textContent = banner.description;
      byId("pity-count").textContent = pity.pullsSince4Star + " / " + pity.hardPity;
      byId("pity-rate").textContent = pity.currentFourStarRateText;
      byId("pity-distance").textContent = "距離 4★ 硬保底還有 " + pity.pullsUntilHardPity + " 格";
      byId("pity-fill").style.width = Math.min(100, pity.pullsSince4Star / pity.hardPity * 100) + "%";
      byId("featured-guarantee").textContent = banner.type === "standard" ? "常駐池沒有精選保證" : (pity.guaranteedFeatured ? "下一張 4★ 必定是目前選中的角色" : "目前為 55% 選中角色／45% 其他 4★");

      var featuredSelect = byId("featured-select");
      featuredSelect.innerHTML = "";
      featuredSelect.disabled = banner.type === "standard";
      if (banner.type !== "standard") {
        banner.featured4Stars.forEach(function (candidate) {
          var option = document.createElement("option");
          option.value = candidate.id;
          option.textContent = candidate.name + "｜" + candidate.element + "｜4★";
          option.selected = candidate.id === pity.selectedFeaturedId;
          featuredSelect.appendChild(option);
        });
      } else {
        var standardOption = document.createElement("option");
        standardOption.textContent = "常駐池不選精選";
        featuredSelect.appendChild(standardOption);
      }

      var featured = pity.selectedFeatured;
      byId("featured-card").innerHTML = featured ? cardMarkup({ card: featured, pityPullNumber: "－", duplicateReward: {}, featured: true, isHardPity: false }) : "<div class=\"standard-featured\">常駐回音召集：無當期精選</div>";

      byId("pull-one").disabled = state.resources.starSand < api.DEFAULT_RULES.singleCost;
      byId("pull-ten").disabled = state.resources.starSand < api.DEFAULT_RULES.tenCost;
      exchangeButton.disabled = banner.type === "standard" || state.resources.starMarks < 10 || Boolean(state.bannerExchanges[banner.id]);
      exchangeButton.textContent = state.bannerExchanges[banner.id] ? "本檔精選已兌換" : "10 星痕兌換精選";

      renderCollection(state);
      renderHistory(state);
    }

    function pull(count, payment) {
      try {
        var outcome = game.pull({ bannerId: selectedBannerId, count: count, payment: payment });
        storage.set(game.getState());
        renderResults(outcome);
        showMessage("召集完成；十連也逐格套用同一套保底計數。", false);
        render();
      } catch (error) {
        showMessage(error.message, true);
      }
    }

    bannerSelect.addEventListener("change", function () {
      selectedBannerId = bannerSelect.value;
      render();
      showMessage("已切換卡池；同類型限定／復刻會共用限定計數。", false);
    });
    byId("featured-select").addEventListener("change", function () {
      if (!this.value) {
        return;
      }
      try {
        game.selectFeatured({ bannerId: selectedBannerId, cardId: this.value });
        storage.set(game.getState());
        render();
        showMessage("已選定「" + this.options[this.selectedIndex].textContent + "」；之後的 55% 精選判定會以此角色為準。", false);
      } catch (error) {
        showMessage(error.message, true);
      }
    });
    byId("pull-one").addEventListener("click", function () { pull(1, "starSand"); });
    byId("pull-ten").addEventListener("click", function () { pull(10, "starSand"); });
    exchangeButton.addEventListener("click", function () {
      try {
        var exchanged = game.exchangeFeatured({ bannerId: selectedBannerId });
        storage.set(game.getState());
        results.innerHTML = "<div class=\"result-summary\"><strong>兌換完成</strong><span>取得 " + escapeHtml(exchanged.card.name) + "（4★｜" + escapeHtml(exchanged.card.element) + "）</span></div>";
        showMessage("已使用 10 枚星痕；兌換不會改變保底計數。", false);
        render();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
    byId("reset-save").addEventListener("click", function () {
      if (!window.confirm("要清除本機試玩紀錄並回到初始資源嗎？")) {
        return;
      }
      game.reset();
      storage.set(game.getState());
      results.innerHTML = "<div class=\"empty\">紀錄已重設，可以開始召集。</div>";
      showMessage("本機試玩紀錄已重設。", false);
      render();
    });

    data.banners.forEach(function (banner) {
      var option = document.createElement("option");
      option.value = banner.id;
      option.textContent = banner.name;
      bannerSelect.appendChild(option);
    });
    bannerSelect.value = selectedBannerId;
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}());
