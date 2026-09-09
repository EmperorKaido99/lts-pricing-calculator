# Program.cs — nothing to change, just verify

You said your Razor Pages starter's `Program.cs` is already wired up, and for
a page this simple (no database, no extra services, no custom routes) the
default `dotnet new webapp` `Program.cs` needs **zero changes**. There is
one line to double-check is present, because if it's missing, none of the
calculator's CSS/JS/SVGs will load (you'll get a blank/unstyled page with
404s in the browser console):

```csharp
app.UseStaticFiles();
```

This is what serves everything under `wwwroot/` (`css/pricing-calculator.css`,
`js/pricing-calculator.js`, `assets/*.svg`) at the site root — e.g.
`wwwroot/css/pricing-calculator.css` becomes reachable at
`/css/pricing-calculator.css`, which is exactly what `~/css/pricing-calculator.css`
in `Index.cshtml` and `_Layout.cshtml` resolves to.

For reference, a stock ASP.NET Core 6 Razor Pages `Program.cs` looks like
this (top-level statements) — if yours matches this shape, you're already
good to go:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();   // <-- the line that matters for this page

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
```

Nothing about the calculator requires new services, middleware, or routes —
it's a single static Razor page plus its own CSS/JS bundle.
