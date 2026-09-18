(function () {
  "use strict";

  function start() {
    var api = window.StarshipGacha;
    var data = window.StarshipGachaData;
    if (!api || !data) {
      throw new Error("抽卡核心尚未載入");
    }

    var storageKey = "starship-gacha-test-save-v1";
    var selectedBannerId = data.banners[0].id;
    var rngMode = "random";
    var fixedRng = 0.5;
    var game;

    function storageGet() {
      try {
        var value = window.localStorage.getItem(storageKey);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        return null;
      }
    }

    function storageSet(value) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (error) {
        // 測試頁即使無法使用 localStorage 也可以繼續測試。
      }
    }

    function testRng() {
      if (rngMode === "low") {
        return 0;
      }
      if (rngMode === "high") {
        return 0.999999;
      }
      if (rngMode === "fixed") {
        return fixedRng;
      }
      return Math.random();
    }

    function createGame(savedState) {
      return new api.GachaGame({
        banners: data.banners,
        state: savedState || undefined,
        rng: testRng,
        now: function () { return new Date().toISOString(); }
      });
    }

    game = createGame(storageGet());

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

    function bannerById(id) {
      return data.banners.find(function (banner) { return banner.id === id; });
    }

    function showMessage(text, isError) {
      byId("test-message").textContent = text;
      byId("test-message").className = isError ? "message error" : "message";
    }

    function rewardText(reward) {
      var parts = [];
      if (reward && reward.starSand) { parts.push("+" + reward.starSand + " 星砂"); }
      if (reward && reward.starMarks) { parts.push("+" + reward.starMarks + " 星痕"); }
      if (reward && reward.echoPowder) { parts.push("+" + reward.echoPowder + " 回響粉"); }
      return parts.join("、") || "無額外資源";
    }

    function renderResults(outcome) {
      byId("test-results").innerHTML = outcome.results.map(function (item) {
        if (!item.card) {
          return "<div class=\"test-result resource-test-result\"><strong>一般回響</strong><span>第 " + item.pityPullNumber + " 抽｜" + escapeHtml(rewardText(item.resourceReward)) + "</span></div>";
        }
        return "<div class=\"test-result rarity-test-" + item.rarity + "\"><strong>" + escapeHtml(item.card.name) + "｜" + item.card.rarity + "★｜" + escapeHtml(item.card.element) + "</strong><span>第 " + item.pityPullNumber + " 抽｜" + (item.featured ? "精選" : "一般") + (item.isHardPity ? "｜硬保底" : "") + "</span></div>";
      }).join("");
    }

    function render() {
      var banner = bannerById(selectedBannerId);
      var pity = game.getPityStatus(selectedBannerId);
      var state = game.getState();
      var bannerSelect = byId("test-banner");
      var featuredSelect = byId("test-featured");

      bannerSelect.innerHTML = data.banners.map(function (item) {
        return "<option value=\"" + escapeHtml(item.id) + "\">" + escapeHtml(item.name) + "</option>";
      }).join("");
      bannerSelect.value = selectedBannerId;
      featuredSelect.disabled = banner.type === "standard";
      featuredSelect.innerHTML = banner.type === "standard" ? "<option value=\"\">常駐池不選精選</option>" : banner.featured4Stars.map(function (item) {
        return "<option value=\"" + escapeHtml(item.id) + "\">" + escapeHtml(item.name) + "｜" + escapeHtml(item.element) + "｜4★</option>";
      }).join("");
      if (pity.selectedFeaturedId) {
        featuredSelect.value = pity.selectedFeaturedId;
      }

      byId("test-pity-status").textContent = pity.pullsSince4Star + " / " + pity.hardPity;
      byId("test-rate").textContent = pity.currentFourStarRateText;
      byId("test-selected").textContent = pity.selectedFeatured ? pity.selectedFeatured.name : "－";
      byId("test-sand").value = state.resources.starSand;
      byId("test-tickets").value = state.resources.tickets;
      byId("test-pity").value = pity.pullsSince4Star;
      byId("test-guarantee").checked = pity.guaranteedFeatured;
      byId("test-state").textContent = JSON.stringify(state, null, 2);
    }

    function applyTestState(pityCount) {
      var banner = bannerById(selectedBannerId);
      var state = game.getState();
      var pity = state.pity[banner.poolKey] || { pullsSince4Star: 0, guaranteedFeatured: false };
      pity.pullsSince4Star = pityCount === undefined ? Number(byId("test-pity").value) : pityCount;
      pity.guaranteedFeatured = byId("test-guarantee").checked;
      state.pity[banner.poolKey] = pity;
      state.resources.starSand = Math.max(0, Number(byId("test-sand").value) || 0);
      state.resources.tickets = Math.max(0, Number(byId("test-tickets").value) || 0);
      game = createGame(state);
      if (banner.type !== "standard" && byId("test-featured").value) {
        game.selectFeatured({ bannerId: selectedBannerId, cardId: byId("test-featured").value });
      }
      storageSet(game.getState());
      render();
      showMessage("測試條件已套用。", false);
    }

    function pull(count, payment) {
      try {
        var outcome = game.pull({ bannerId: selectedBannerId, count: count, payment: payment });
        storageSet(game.getState());
        renderResults(outcome);
        render();
        showMessage("測試完成。", false);
      } catch (error) {
        showMessage(error.message, true);
      }
    }

    byId("test-banner").addEventListener("change", function () {
      selectedBannerId = this.value;
      render();
    });
    byId("test-featured").addEventListener("change", function () {
      if (this.value && bannerById(selectedBannerId).type !== "standard") {
        game.selectFeatured({ bannerId: selectedBannerId, cardId: this.value });
        storageSet(game.getState());
        render();
      }
    });
    byId("rng-mode").addEventListener("change", function () { rngMode = this.value; });
    byId("fixed-rng").addEventListener("change", function () { fixedRng = Math.min(0.999999, Math.max(0, Number(this.value) || 0)); });
    byId("apply-test").addEventListener("click", function () { applyTestState(); });
    byId("jump-21").addEventListener("click", function () { byId("test-pity").value = 20; applyTestState(20); });
    byId("jump-50").addEventListener("click", function () { byId("test-pity").value = 49; applyTestState(49); });
    byId("test-pull-one").addEventListener("click", function () { pull(1, "starSand"); });
    byId("test-pull-ten").addEventListener("click", function () { pull(10, "starSand"); });
    byId("test-pull-ticket").addEventListener("click", function () { pull(1, "ticket"); });
    byId("test-reset").addEventListener("click", function () {
      game = createGame();
      storageSet(game.getState());
      byId("test-results").innerHTML = "<div class=\"empty\">測試存檔已清除。</div>";
      render();
      showMessage("測試存檔已清除。", false);
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}());
