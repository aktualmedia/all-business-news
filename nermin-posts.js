/* 7.4 FIX - admin, real gallery, radio, Nermin posts */
.feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.gallery-filter-bar{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 18px}
.gallery-filter-bar button{border:1px solid var(--line,#dbe3ef);background:#fff;border-radius:999px;padding:9px 12px;font-weight:900;color:var(--brand,#1f3c88);cursor:pointer;text-transform:uppercase}
.gallery-filter-bar button.active{background:linear-gradient(135deg,var(--brand,#1f3c88),var(--accent,#6d28d9));color:#fff;border-color:transparent}
.share-mini{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-top:12px}
.share-mini strong{font-size:.72rem;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
.share-mini a{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 9px;border:1px solid var(--line,#dbe3ef);border-radius:999px;background:#fff;color:var(--brand,#1f3c88);text-decoration:none;font-size:.72rem;font-weight:900}
.admin-grid,.radio-grid,.posts-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.admin-box,.radio-card,.nermin-card{background:#fff;border:1px solid var(--line,#dbe3ef);border-radius:22px;box-shadow:0 14px 38px rgba(15,23,42,.05);padding:18px}
.admin-box input,.admin-box textarea,.admin-box select{width:100%;border:1px solid var(--line,#dbe3ef);border-radius:14px;padding:12px;margin:7px 0;font-size:16px}
.admin-box textarea{min-height:96px}
.admin-note{background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;border-radius:18px;padding:14px;font-weight:800}
.radio-card audio{width:100%;margin:12px 0}
.nermin-card h3{margin:.2rem 0 .5rem}
.nermin-card .meta{font-weight:900;color:#64748b;text-transform:uppercase;font-size:.76rem}
@media(max-width:800px){.feature-grid,.admin-grid,.radio-grid,.posts-grid{grid-template-columns:1fr}.gallery-filter-bar{flex-wrap:nowrap;overflow-x:auto;padding-bottom:8px}.gallery-filter-bar button{flex:0 0 auto}.share-mini a{font-size:.68rem;padding:6px 8px}}