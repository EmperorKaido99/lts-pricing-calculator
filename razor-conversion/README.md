# LTS Pricing Calculator — Razor Pages port

This folder is the standalone `LTSPricingCalculator.html` calculator,
converted into an ASP.NET Core 6 Razor Pages page. **Nothing about how the
calculator looks or behaves was changed** — every diff was verified
(byte-for-byte for CSS, `diff`-checked for the HTML body, syntax-checked for
JS) against the original source.

The page is fully self-contained (`Layout = null;`), so it does **not**
touch your project's shared `_Layout.cshtml`, navbar, or `Program.cs` beyond
one thing to confirm. Copy four things into your project and it works.

## What's in here

```
Pages/
  Index.cshtml                 The whole page: Razor directive block up top,
                                then its own <html>/<head>/<body> — no
                                PageModel, no shared layout dependency.
wwwroot/
  css/pricing-calculator.css   Byte-identical copy of css/styles.css
  js/pricing-calculator.js     data.js + calculator.js + export.js + app.js,
                                concatenated in original load order
  assets/*.svg                  Hero art, background pattern, hex tile
PROGRAM_CS_NOTES.md            What to check in your Program.cs (nothing to
                                change — just one line to verify exists)
```

## How it stays "pixel-perfect"

- **CSS**: `wwwroot/css/pricing-calculator.css` is an exact copy of the
  original `css/styles.css` — confirmed with `diff`, zero changes.
- **HTML**: the `<body>` of `Index.cshtml` is the original standalone HTML
  file's `<body>` markup, extracted programmatically and `diff`-verified
  against the source — not retyped, so there's no risk of a stray whitespace
  or attribute change slipping in.
- **JS**: `wwwroot/js/pricing-calculator.js` is `data.js`, `calculator.js`,
  `export.js` and `app.js` concatenated **in their original `<script>` load
  order**, with zero logic changes — only comments were added. Syntax-checked
  with `node --check`.

## Integrating into your existing project

1. **Copy the files across**, matching this folder's structure into your
   real project: `Pages/Index.cshtml`, `wwwroot/css/pricing-calculator.css`,
   `wwwroot/js/pricing-calculator.js`, `wwwroot/assets/*.svg`.

2. **Check `Program.cs`** — see `PROGRAM_CS_NOTES.md`. In almost every case
   there's nothing to add; just confirm `app.UseStaticFiles();` is present,
   since that's what serves everything under `wwwroot/`.

3. **Build and run** (`dotnet build` / `dotnet run`) and open `/Index` (or
   whatever route your project maps `Pages/Index.cshtml` to) — this
   environment doesn't have the .NET SDK installed, so this hasn't been
   compiler-verified. The Razor syntax was written carefully and the
   HTML/CSS/JS are proven unchanged, but do a local build check before
   shipping.

That's it — no namespace to fix, no PageModel to wire up, nothing to merge
into your existing `_Layout.cshtml`. `Layout = null;` in the `@{ }` block at
the top of `Index.cshtml` means this one page renders its own complete HTML
document instead of participating in your site's shared layout, so it can't
collide with your navbar, your Bootstrap `.container`, or your project's
namespace — regardless of what your project happens to be called.

## Why there's no PageModel (`Index.cshtml.cs`)

Every calculation, tab switch, save, export and share happens client-side in
`pricing-calculator.js` — there's no database, no server-side rendering of
data into the page, nothing for a PageModel to do. A Razor Page with a
`@page` directive and no code-behind file is valid on its own; ASP.NET Core
generates an implicit, empty page model for it automatically. Leaving the
file out entirely means there's no namespace placeholder for anyone
integrating this to have to go back and fix.

## Updating prices or adding a product later

Everything price/product/FAQ-related lives in one place: the `LTS_DATA`
object at the top of `pricing-calculator.js` (marked `1/4: data.js` in the
file). That was true in the original site too — this port didn't change
that design.
