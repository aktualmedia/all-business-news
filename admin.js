<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ADMIN | WEB VIJESTI</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="../index.html"><span class="brand-mark">WV</span><span><strong>WEB VIJESTI</strong><small>AKTUAL MEDIA D.O.O.</small></span></a>
  <nav class="top-nav"><a href="../index.html">HOME</a><a href="../vijesti/index.html">VIJESTI</a><a href="../symbol/index.html">SYMBOL</a><a href="../galerija/index.html">GALERIJA</a></nav>
</header>
<main class="page-shell">
  <a class="home-button" href="../index.html">HOME – POVRATAK</a>
  <section class="hero compact"><p class="eyebrow">ADMIN</p><h1>ADMIN STRANICA</h1><p class="lead">OVO JE LOKALNI ADMIN ZA STATIČKI GITHUB PAGES. SPREMA U TVOJ PREGLEDNIK I OMOGUĆUJE PREUZIMANJE JSON DATOTEKA ZA RUČNI UPLOAD.</p></section>
  <section class="control-panel">
    <h2>GALERIJA</h2>
    <div class="control-row"><input id="gTitle" placeholder="NASLOV SLIKE"><input id="gImage" placeholder="PUTANJA SLIKE, npr. assets/gallery/gallery-01.jpg"></div>
    <div class="control-row"><input id="gDesc" placeholder="OPIS SLIKE"></div>
    <div class="hero-actions"><button class="button small" id="addGallery">SPREMI LOKALNO</button><button class="button small" id="exportGallery">PREUZMI manual_gallery.json</button></div>
  </section>
  <section class="control-panel">
    <h2>OBJAVE NERMINA SEFIĆA</h2>
    <div class="control-row"><input id="pTitle" placeholder="NASLOV OBJAVE"></div>
    <div class="control-row"><input id="pSummary" placeholder="SAŽETAK OBJAVE"></div>
    <div class="hero-actions"><button class="button small" id="addPost">SPREMI LOKALNO</button><button class="button small" id="exportPosts">PREUZMI ai_posts.json</button></div>
  </section>
  <section class="legal-box"><p id="adminStatus">UČITAVANJE ADMINA...</p><p><strong>VAŽNO:</strong> STATIČKI GITHUB PAGES NE MOŽE SAM UPISIVATI U REPOZITORIJ BEZ BACKENDA ILI GITHUB TOKENA. OVAJ ADMIN PRIPREMA JSON KOJI SE ZATIM RUČNO UPLOADA U FOLDER <strong>data</strong>.</p></section>
</main>
<nav class="mobile-bottom-nav"><a href="../index.html">HOME</a><a href="../vijesti/index.html">VIJESTI</a><a href="../symbol/index.html">SYM.</a><a href="../galerija/index.html">GALERIJA</a></nav>
<script src="../assets/admin.js"></script>
</body>
</html>