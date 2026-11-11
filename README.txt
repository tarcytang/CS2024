DEKATRE WEBSITE
===============
Open index.html in a browser to view the site. Keep all folders together.

Video banners
  Both site videos are delivered as 1920x1080 HD MP4s. climate.html uses
  videos/climate-environment-landscape.mp4 as a moving background; it blurs
  when you scroll. routine.html uses an edited loop of the supplied skincare
  clip with the Wardah C-Defense range added; its title and instructions sit
  below the video banner.

Folders
  css/style.css   colours, fonts and layout for every page (colours are at the top)
  js/main.js      menu, Shopee links, bundles, points, discount codes, PRODUCT PRICES (top of file)
  js/live.js      live Singapore UV / PSI / temperature / humidity (needs internet)
  images/         product cutouts, video posters and original wide banner artwork:
                  banner-home.jpg, banner-shop.jpg, banner-climate.jpg, banner-science.jpg,
                  banner-routine.jpg, banner-community.jpg, banner-about.jpg, banner-app.jpg
                  Product cutouts: wash.png, mist.png, mask.png, moisturiser.png, ddcream.png
  videos/         climate-environment-landscape.mp4, routine-guide-banner.mp4

To edit
  Menu links      js/main.js, the MENU list
  Prices          js/main.js, PRODUCTS and BUNDLE
  Team            team.html: group number, 3 names, emails, photos (marked EDIT)
  Sustainability  index.html, "A climate brand should act like one" section

Accounts (login.html)
  Sign up / log in links points, vouchers, daily spins and quiz progress to an account.
  New accounts get 50 welcome points. Guests can browse and play the quiz, but must
  log in to earn, spin, redeem or post reviews.
  PROTOTYPE: accounts are stored in the browser (no server), which suits GitHub Pages.
  Passwords are saved as a SHA-256 hash, not plain text. Accounts only exist on the
  browser/device where they were created.

Fonts
  DM Serif Display (headings) and DM Sans (body text), loaded from Google Fonts.
  To change fonts: edit the Google Fonts <link> in each page and --display / --body
  at the top of css/style.css.

SEO
  Every page has a title, meta description and social sharing tags.
  sitemap.xml and robots.txt: replace YOUR-GITHUB-USERNAME and YOUR-REPO-NAME
  with your real GitHub Pages address after uploading.

If changes don't show
  Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) to hard-refresh.
  CSS/JS links end in ?v=16 / ?v=14. Bump the number after big edits so browsers reload them.

Shopping and rewards (v2)
  No cart: every "Buy" button opens Shopee. Bundle link = SHOPEE_BUNDLE in js/main.js;
  single products use Shopee search links (swap in exact product links if you have them).
  Rewards are discount codes (e.g. DK10OFF-7KQ2) shown in the rewards wallet to copy
  into Shopee checkout. PROTOTYPE: in a real launch each code would be a Shopee shop voucher.
  Student bundle: accounts with a school email (ending .edu.sg or .edu) see code DKSTUDENT15.

Light and dark mode
  Soft ivory and sage are the default. The sun/moon button switches to charcoal night mode,
  and the choice is remembered. Colours for both themes are at the top of css/style.css.

Also included
  404.html        friendly "page not found" page (GitHub Pages uses it automatically)
  Contact form    on team.html, with PDPA consent
  FAQ             on products.html

Notes
  Cart is saved in the browser and kept between visits.
  The spin page has a "Reset today's spin" link for presentations.
  Checkout is a demo: no payment is taken.
