// Small, bundled startup copy: runs before the React application loads.
(function () {
  var messages = {"en":{"label":"Starting MyKliq","tagline":"Your Private Social Circle","recovery":"MyKliq is taking longer to start. Check your connection, then try again.","retry":"Try again"},"es":{"label":"Iniciando MyKliq","tagline":"Tu círculo social privado","recovery":"MyKliq está tardando en iniciar. Comprueba tu conexión y vuelve a intentarlo.","retry":"Intentar de nuevo"},"fr":{"label":"Démarrage de MyKliq","tagline":"Votre cercle social privé","recovery":"MyKliq met du temps à démarrer. Vérifiez votre connexion, puis réessayez.","retry":"Réessayer"},"de":{"label":"MyKliq wird gestartet","tagline":"Dein privater sozialer Kreis","recovery":"MyKliq braucht länger zum Starten. Überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.","retry":"Erneut versuchen"},"pt":{"label":"Iniciando MyKliq","tagline":"Seu círculo social privado","recovery":"O MyKliq está demorando para iniciar. Verifique sua conexão e tente novamente.","retry":"Tentar novamente"},"it":{"label":"Avvio di MyKliq","tagline":"Il tuo cerchio sociale privato","recovery":"MyKliq sta impiegando più tempo per avviarsi. Controlla la tua connessione e riprova.","retry":"Riprova"},"zh":{"label":"正在启动 MyKliq","tagline":"您的私密社交圈","recovery":"MyKliq 启动时间过长。请检查您的连接，然后重试。","retry":"重试"},"ja":{"label":"MyKliq を起動中","tagline":"あなたのプライベートソーシャルサークル","recovery":"MyKliq の起動に時間がかかっています。接続を確認してから再試行してください。","retry":"再試行"},"ko":{"label":"MyKliq 시작 중","tagline":"귀하의 비공개 소셜 서클","recovery":"MyKliq 시작 시간이 길어지고 있습니다. 연결 상태를 확인한 후 다시 시도하세요.","retry":"다시 시도"},"ar":{"label":"جاري بدء تشغيل MyKliq","tagline":"دائرتك الاجتماعية الخاصة","recovery":"يستغرق MyKliq وقتًا أطول للبدء. تحقق من اتصالك ثم حاول مرة أخرى.","retry":"حاول مجددًا"}};
  var choices = [];
  try { choices.push(localStorage.getItem("i18nextLng"), sessionStorage.getItem("i18nextLng")); } catch (_) {}
  choices = choices.concat(navigator.languages || [navigator.language]);
  var code = choices.map(function (value) { return String(value || "").toLowerCase().split(/[-_]/)[0]; }).find(function (value) { return messages[value]; }) || "en";
  var copy = messages[code];
  document.documentElement.lang = code;
  document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
  var splash = document.getElementById("mykliq-startup");
  if (!splash) return;
  splash.setAttribute("aria-label", copy.label);
  [[".mk-splash-tagline", copy.tagline], [".mk-splash-recovery p", copy.recovery], [".mk-splash-retry", copy.retry]].forEach(function (item) { var element = splash.querySelector(item[0]); if (element) element.textContent = item[1]; });
})();
