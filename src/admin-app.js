(function () {
  "use strict";

  function start() {
    var state = null;
    var player = null;
    var key = "";

    function byId(id) { return document.getElementById(id); }
    function showMessage(text, isError) { var node = byId("admin-message"); node.textContent = text; node.className = isError ? "message error" : "message"; }
    function request(path, body) {
      return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (payload) {
          if (!response.ok || payload.ok === false) throw new Error(payload.error || "管理 API 失敗");
          return payload;
        });
      });
    }
    function setNumber(id, value) { byId(id).value = value === undefined ? 0 : value; }
    function render() {
      if (!state) return;
      setNumber("admin-star-sand", state.resources.starSand); setNumber("admin-tickets", state.resources.tickets); setNumber("admin-star-marks", state.resources.starMarks); setNumber("admin-echo-powder", state.resources.echoPowder);
      setNumber("admin-limited-pity", state.pity.limited.pullsSince4Star); setNumber("admin-standard-pity", state.pity.standard.pullsSince4Star); byId("admin-guarantee").checked = state.pity.limited.guaranteedFeatured;
      byId("admin-state").textContent = JSON.stringify(state, null, 2);
      byId("admin-player-title").textContent = player.name;
      byId("admin-updated").textContent = player.updatedAt ? "更新於 " + new Date(player.updatedAt).toLocaleString("zh-Hant-TW") : "已載入";
    }
    function lookup() {
      key = byId("admin-key").value;
      var name = byId("admin-player").value;
      request("/api/admin/lookup", { adminKey: key, name: name }).then(function (payload) {
        state = payload.state; player = payload.player;
        var featured = byId("admin-featured");
        featured.innerHTML = [{ id: "celesia", name: "瑟蕾雅" }, { id: "eda", name: "艾妲" }, { id: "veyra", name: "薇珂" }, { id: "harlow", name: "赫洛" }, { id: "elorna", name: "艾洛娜" }, { id: "chodan", name: "Chodan" }, { id: "magenta", name: "Magenta" }, { id: "hina", name: "Hina" }, { id: "siyeon", name: "Siyeon" }, { id: "mave", name: "梅芙" }].map(function (item) { return "<option value=\"" + item.id + "\">" + item.name + "｜4★</option>"; }).join("");
        featured.value = state.selectedFeatured.limited || "celesia";
        byId("admin-editor").hidden = false; render(); showMessage("已載入玩家資料。", false);
      }).catch(function (error) { showMessage(error.message, true); });
    }
    function save() {
      if (!state || !player) return;
      var body = {
        adminKey: key,
        name: player.name,
        resources: { starSand: Number(byId("admin-star-sand").value), tickets: Number(byId("admin-tickets").value), starMarks: Number(byId("admin-star-marks").value), echoPowder: Number(byId("admin-echo-powder").value) },
        pity: { limited: { pullsSince4Star: Number(byId("admin-limited-pity").value), guaranteedFeatured: byId("admin-guarantee").checked }, standard: { pullsSince4Star: Number(byId("admin-standard-pity").value) } },
        selectedFeatured: { limited: byId("admin-featured").value }
      };
      request("/api/admin/update", body).then(function (payload) { state = payload.state; player = payload.player; render(); showMessage("玩家資料已儲存；玩家下次操作會讀到新狀態。", false); }).catch(function (error) { showMessage(error.message, true); });
    }
    byId("admin-lookup").addEventListener("click", lookup); byId("admin-save").addEventListener("click", save);
    byId("admin-player").addEventListener("keydown", function (event) { if (event.key === "Enter") lookup(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
}());
