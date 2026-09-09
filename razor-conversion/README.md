# LTS Pricing Calculator — Razor Pages port

This folder is the standalone `LTSPricingCalculator.html` calculator,
converted into an ASP.NET Core 6 Razor Pages structure. **Nothing about how
the calculator looks or behaves was changed** — every diff was verified
(byte-for-byte for CSS, `diff`-checked for the HTML body, syntax-checked for
JS) against the original source.

## What's in here

```
Pages/
  Index.cshtml           The calculator page (Razor directives + the
                          original HTML body, copied verbatim)
  Index.cshtml.cs         PageModel — intentionally empty, see below
  Shared/
    _Layout.cshtml         REFERENCE layout — see "Integrating" below
wwwroot/
  css/pricing-calculator.css   Byte-identical copy of css/styles.css
  js/pricing-calculator.js     data.js + calculator.js + export.js + app.js,
                                concatenated in original load order
  assets/*.svg                  Hero art, background pattern, hex tile
PROGRAM_CS_NOTES.md        What to check in your Program.cs (nothing to
                            change — just one line to verify exists)
```

## How it stays "pixel-perfect"

- **CSS**: `wwwroot/css/pricing-calculator.css` is an exact copy of the
  original `css/styles.css` — confirmed with `diff`, zero changes.
- **HTML**: the body of `Index.cshtml` (everything from the top bar comment
  down to the loading-overlay's closing `</div>`) is the original HTML
  body's markup, extracted programmatically and `diff`-verified against the
  source — not retyped, so there's no risk of a stray whitespace or attribute
  change slipping in.
- **JS**: `wwwroot/js/pricing-calculator.js` is `data.js`, `calculator.js`,
  `export.js` and `app.js` concatenated **in their original `<script>` load
  order**, with zero logic changes — only comments were added. Syntax-checked
  with `node --check`.

## Integrating into your existing project

1. **Copy the files across**, matching this folder's structure into your
   real project (`Pages/Index.cshtml`, `Pages/Index.cshtml.cs`,
   `wwwroot/css/pricing-calculator.css`, `wwwroot/js/pricing-calculator.js`,
   `wwwroot/assets/*.svg`).

2. **Fix the namespace** in `Index.cshtml.cs` — it's currently
   `namespace RazorApp.Pages;`, a placeholder. Change `RazorApp` to your
   actual project's root namespace (matches whatever you passed to
   `dotnet new webapp -n <YourProjectName>`, or check your `.csproj`
   filename / any other `.cshtml.cs` file's namespace).

3. **Merge (don't overwrite) `_Layout.cshtml`.** The one in this folder is a
   *reference* built on the default ASP.NET Core template — if your real
   layout already exists and differs (different branding, nav items, CSS
   bundle), copy in just the three blocks marked `ADDED FOR THE CALCULATOR`
   in that file:
   - `@await RenderSectionAsync("Styles", required: false)` in `<head>`
   - the navbar wrapped in `@if (ViewData["HideNav"] as bool? != true) { ... }`
   - `@RenderBody()` conditionally skipping the `.container` wrapper when
     `ViewData["FullBleed"] == true`

   Both are needed — not just nav-hiding — because the calculator's topbar,
   hero banner and footer are all designed edge-to-edge (full viewport
   width). Left inside Bootstrap's `.container`, they'd be capped to its
   max-width and gain side padding, and the hero gradient/topbar would
   visibly not span the full page.

4. **Check `Program.cs`** — see `PROGRAM_CS_NOTES.md`. In almost every case
   there's nothing to add; just confirm `app.UseStaticFiles();` is present,
   since that's what serves everything under `wwwroot/`.

5. **Build and run** (`dotnet build` / `dotnet run`) and open the page —
   this environment doesn't have the .NET SDK installed, so this hasn't been
   compiler-verified. The Razor syntax was written carefully and the HTML/CSS/
   JS are proven unchanged, but do a local build check before shipping.

## Why `Index.cshtml.cs` is empty

Every calculation, tab switch, save, export and share happens client-side in
`pricing-calculator.js` — there's no database, no server-side rendering of
data into the page, nothing for the PageModel to do. `OnGet()` exists only
because Razor Pages requires a handler method.

## Updating prices or adding a product later

Everything price/product/FAQ-related lives in one place: the `LTS_DATA`
object at the top of `pricing-calculator.js` (marked `1/4: data.js` in the
file). That was true in the original site too — this port didn't change
that design.
